// Service Worker - Avícola Plomes del Delta
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let data = { title: 'Avícola Plomes del Delta', body: 'Tienes avisos pendientes' };
  try { if (e.data) data = e.data.json(); } catch(err) {}
  
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/Avicola-Plomes-del-Delta/icon-192.png',
      tag: data.tag || 'plomes',
      vibrate: [200, 100, 200],
      silent: false
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      if (cs.length > 0) return cs[0].focus();
      return clients.openWindow('/Avicola-Plomes-del-Delta/');
    })
  );
});
