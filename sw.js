// 글꼴(.woff2)은 한 번 받으면 폰 안에 보관해 두고 다음부터 바로 꺼내 쓴다 (주소에 버전이 박혀 있어 내용이 바뀌지 않는다)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.mode === 'navigate') return event.respondWith(fetch(req));
  if (req.url.endsWith('.woff2')) event.respondWith(caches.open('fonts-v1').then(c => c.match(req).then(hit => hit
    || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }))));
});
