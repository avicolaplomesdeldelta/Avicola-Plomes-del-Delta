const CACHE = 'plomes-v153';
const FILES = ['/', './index.html', './app.bundle.js', './firebase-init.js'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => caches.open(CACHE).then(c => c.addAll(FILES).catch(() => {})))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    clients.claim().then(() =>
      clients.matchAll({type:'window'}).then(ws => ws.forEach(w => w.navigate(w.url)))
    )
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
