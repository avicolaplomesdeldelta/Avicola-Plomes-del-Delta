// Script Node.js para GitHub Actions
// Se ejecuta cada mañana, lee Firestore y envía notificaciones push
// Variables de entorno necesarias: FIREBASE_SERVICE_ACCOUNT, VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const webpush = require('web-push');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

webpush.setVapidDetails(
  'mailto:info@avicolaplomesdeldelta.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

function hoy() {
  return new Date().toISOString().split('T')[0];
}
function enDias(fecha, n) {
  const d = new Date(fecha);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
function fmt(f) {
  if (!f) return '';
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
}
function dif(desde, hasta) {
  return Math.round((new Date(hasta) - new Date(desde)) / 86400000);
}

async function main() {
  const HOY = hoy();
  const alertas = [];

  // Leer datos de Firestore
  const [lotesSnap, animalesSnap, encargosSnap] = await Promise.all([
    db.collection('datos').doc('incubacion-lotes').get(),
    db.collection('datos').doc('gallinero-animales').get(),
    db.collection('datos').doc('encargos-huevos').get(),
  ]);

  const lotes = lotesSnap.exists ? JSON.parse(lotesSnap.data().value) : [];
  const animales = animalesSnap.exists ? JSON.parse(animalesSnap.data().value) : [];
  const encargos = encargosSnap.exists ? JSON.parse(encargosSnap.data().value) : [];

  // 1. Alertas de lotes de incubación
  lotes.filter(l => l.estado === 'en_curso').forEach(l => {
    const esp = l.especie || '';
    const label = `${esp} (${l.numHuevos} huevos)`;

    // Ovoscopia: avisar el día de
    if (l.fechaOvoscopia && (l.fechaOvoscopia === HOY || enDias(HOY, -1) === l.fechaOvoscopia))
      alertas.push({ title: '🔍 Ovoscopia hoy', body: `Lote de ${label} — ${fmt(l.fechaOvoscopia)}`, tag: `ovo-${l.id}` });

    // Nacedora: avisar 1 día antes y el día de
    if (l.fechaNacedora) {
      const d = dif(HOY, l.fechaNacedora);
      if (d === 1) alertas.push({ title: '⚠️ Nacedora mañana', body: `Traslada el lote de ${label}`, tag: `nac-${l.id}` });
      if (d === 0) alertas.push({ title: '⚠️ Nacedora HOY', body: `Traslada el lote de ${label} ahora`, tag: `nac-${l.id}` });
    }

    // Eclosión: avisar 1 día antes y el día de
    if (l.fechaEclosion) {
      const d = dif(HOY, l.fechaEclosion);
      if (d === 1) alertas.push({ title: '🐣 Eclosión mañana', body: `Lote de ${label}`, tag: `ecl-${l.id}` });
      if (d === 0) alertas.push({ title: '🐣 ¡Eclosión hoy!', body: `Revisa el lote de ${label}`, tag: `ecl-${l.id}` });
    }
  });

  // 2. Pollitos pendientes de anillar (con más de 6 días)
  const pendientes = animales.filter(a => a.pendienteAnillar && a.estado === 'activo');
  if (pendientes.length > 0)
    alertas.push({ title: `🏷️ ${pendientes.length} pollito${pendientes.length > 1 ? 's' : ''} sin anillar`, body: 'Recuerda ponerles la anilla', tag: 'anillar' });

  // 3. Encargos con entrega hoy o mañana
  encargos.filter(e => e.estado !== 'completado' && e.fechaEntrega).forEach(en => {
    const d = dif(HOY, en.fechaEntrega);
    if (d === 1) alertas.push({ title: '📝 Encargo para mañana', body: `${en.cliente} espera su pedido mañana`, tag: `enc-${en.id}` });
    if (d === 0) alertas.push({ title: '📝 Entrega de encargo HOY', body: `${en.cliente} espera su pedido hoy`, tag: `enc-${en.id}` });
    if (d < 0) alertas.push({ title: '🔴 Encargo atrasado', body: `${en.cliente} lleva ${Math.abs(d)} día${Math.abs(d) > 1 ? 's' : ''} esperando`, tag: `enc-${en.id}` });
  });

  // 4. Castraciones recomendadas
  animales.filter(a => a.estado === 'activo' && !a.castrado).forEach(a => {
    const E = {gallina:70,pato:70,oca:70,pavo:56,pavoreal:70,faisan:70,perdiz:70,otra:70};
    const dias = E[a.especie] || 0;
    if (!dias || !a.anyo) return;
    const nacim = new Date(`${a.anyo}-01-01`);
    const cast = new Date(nacim); cast.setDate(cast.getDate() + dias);
    const castStr = cast.toISOString().split('T')[0];
    const d = dif(HOY, castStr);
    if (d >= 0 && d <= 3)
      alertas.push({ title: '✂️ Castración recomendada', body: `${a.especie}${a.anilla ? ' anilla '+a.anilla : ''} — en ${d} día${d !== 1 ? 's' : ''}`, tag: `cast-${a.id}` });
  });

  if (alertas.length === 0) {
    console.log('Sin alertas para hoy.');
    return;
  }

  console.log(`Enviando ${alertas.length} alertas...`);

  // Leer suscripciones de dispositivos
  const disposSnap = await db.collection('dispositivos').get();
  const suscripciones = [];
  disposSnap.forEach(doc => {
    const d = doc.data();
    // La app guarda como { value: JSON.stringify({subscription, fecha}) }
    try {
      if (d.value) {
        const parsed = JSON.parse(d.value);
        if (parsed.subscription) suscripciones.push({ id: doc.id, sub: parsed.subscription });
      } else if (d.subscription) {
        // Formato antiguo por compatibilidad
        suscripciones.push({ id: doc.id, sub: d.subscription });
      }
    } catch(e) { console.error('Error leyendo dispositivo', doc.id, e); }
  });

  if (suscripciones.length === 0) {
    console.log('Sin dispositivos suscritos.');
    return;
  }

  // Enviar cada alerta a cada dispositivo
  for (const alerta of alertas) {
    for (const { id, sub } of suscripciones) {
      try {
        await webpush.sendNotification(sub, JSON.stringify(alerta));
        console.log(`✓ Enviado a ${id}: ${alerta.title}`);
      } catch (err) {
        console.error(`✗ Error en ${id}:`, err.statusCode || err.message);
        // Si el dispositivo ya no existe, borrarlo
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.collection('dispositivos').doc(id).delete();
        }
      }
    }
  }
}

main().catch(console.error);
