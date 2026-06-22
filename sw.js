// Service Worker - Avícola Plomes del Delta
// Maneja notificaciones push recibidas desde el servidor

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Recibir notificación push del servidor
self.addEventListener('push', e => {
  if (!e.data) return;
  let data;
  try { data = e.data.json(); } catch { data = { title: 'Plomes del Delta', body: e.data.text() }; }
  e.waitUntil(
    self.registration.showNotification(data.title || 'Avícola Plomes del Delta', {
      body: data.body || '',
      icon: '/Avicola-Plomes-del-Delta/icon-192.png',
      badge: '/Avicola-Plomes-del-Delta/icon-192.png',
      tag: data.tag || 'plomes-notif',
      data: data.url || '/',
      requireInteraction: true,
    })
  );
});

// Al tocar la notificación, abrir la app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      if (cs.length > 0) { cs[0].focus(); return; }
      clients.openWindow('/Avicola-Plomes-del-Delta/');
    })
  );
});
