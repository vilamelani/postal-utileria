/* Guarda toda la app en el celular para que funcione sin conexión.
   Si se cambia algún archivo, subir el número de versión para que los celulares se actualicen. */
const VERSION = 'guita-v4';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest',
  'css/app.css', 'js/config.js', 'js/app.js',
  'fonts/grand-hotel.woff2',
  'img/avatar.jpg', 'img/post.jpg',
  'img/mica/avatar.jpg', 'img/mica/hl1.jpg', 'img/mica/hl2.jpg', 'img/mica/hl3.jpg', 'img/mica/hl4.jpg', 'img/mica/hl5.jpg',
  'img/mica/p01.jpg', 'img/mica/p02.jpg', 'img/mica/p03.jpg', 'img/mica/p04.jpg', 'img/mica/p05.jpg', 'img/mica/p06.jpg', 'img/mica/p07.jpg', 'img/mica/p08.jpg', 'img/mica/p09.jpg',
  'video/reel-skincare.mp4', 'video/reel-micar.mp4',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Los videos en iPhone se piden "por partes" (Range): respondemos 206 desde la caché
async function rangeResponse(req) {
  const hit = await caches.match(req.url, { ignoreSearch: true });
  if (!hit) return fetch(req);
  const buf = await hit.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  const size = buf.byteLength;
  let start = m && m[1] ? parseInt(m[1], 10) : 0;
  let end = m && m[2] ? parseInt(m[2], 10) : size - 1;
  if (m && !m[1] && m[2]) { start = size - parseInt(m[2], 10); end = size - 1; }
  end = Math.min(end, size - 1);
  return new Response(buf.slice(start, end + 1), {
    status: 206, statusText: 'Partial Content',
    headers: { 'Content-Type': hit.headers.get('Content-Type') || 'video/mp4', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' }
  });
}
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.headers.get('range')) { e.respondWith(rangeResponse(e.request)); return; }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('index.html')))
  );
});
