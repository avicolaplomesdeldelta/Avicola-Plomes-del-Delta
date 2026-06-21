AVÍCOLA PLOMES DEL DELTA - v7
=========================================================================
NOVEDADES DE ESTA VERSIÓN:

1. CONTRASEÑA DE ACCESO
   Ahora hace falta una contraseña para entrar a la app.
   Contraseña: Desastre.88!
   (se pide solo la primera vez en cada navegador/dispositivo)

2. FOTOS REDISEÑADAS
   Las fotos de animales ahora se guardan por separado en Firestore,
   evitando que con muchas fotos se llegue al límite de tamaño y
   falle el guardado de todos los demás datos.

3. BUSCADOR EN GALLINERO
   Nuevo campo de búsqueda por anilla, raza, ubicación o notas.

4. AVISO DE ANILLA DUPLICADA
   Si intentas guardar un animal con una anilla que ya tiene otro
   animal activo, te avisa antes de guardar (puedes continuar si
   es intencional).

5. TASA DE MORTALIDAD
   Nueva estadística en la pestaña Datos: % de bajas por
   fallecimiento sobre el total histórico de animales.

6. RESUMEN POR ESPECIE Y RAZA (de la versión anterior)
   Panel en Gallinero con el desglose de cuántos animales hay de
   cada especie y raza.

IMPORTANTE - REGLAS DE FIRESTORE:
-------------------------------------
Como ahora hay una colección nueva "fotos" además de "datos", tienes
que actualizar las reglas de seguridad en Firebase:
1. console.firebase.google.com → tu proyecto → Firestore Database → Rules
2. Sustituye todo por:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /datos/{document} {
      allow read, write: if request.auth != null;
    }
    match /fotos/{document} {
      allow read, write: if request.auth != null;
    }
  }
}

3. Publish

CÓMO ACTUALIZAR LA APP:
-------------------------------------
1. Descomprime, GitHub → Add file → Upload files → los 6 archivos
2. Commit changes → espera 1-2 min
3. Fuerza recarga sin caché (importante, mantén pulsado recargar →
   Recarga forzada, o borra caché de imágenes/archivos)
4. Te pedirá la contraseña: Desastre.88!
