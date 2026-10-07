// 글꼴(.woff2)은 한 번 받으면 폰 안에 보관해 두고 다음부터 바로 꺼내 쓴다 (주소에 버전이 박혀 있어 내용이 바뀌지 않는다)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.mode === 'navigate') return event.respondWith(fetch(req));
  if (req.url.endsWith('.woff2')) event.respondWith(caches.open('fonts-v1').then(c => c.match(req).then(hit => hit
    || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }))));
});

// 웹 푸시는 앱 화면이 닫혀 있어도 여기서 받아 표시한다.
// 서버가 본문 첫 줄에 제목('파트 일정 변경 · 고친 사람')을 실어 보낸다 → 떼어 알림 제목으로 (발송 서버는 본문만 넘겨서)
self.addEventListener('push', event => {
  let message = {};
  try { message = event.data ? event.data.json() : {}; } catch (e) {}
  let title = '파트 일정 변경', body = typeof message.body === 'string' ? message.body.slice(0, 160) : '파트 일정이 바뀌었어요. 앱에서 확인해 주세요.';
  const [head, ...rest] = body.split('\n');
  if (rest.length && /^(파트 일정|일정 알림)/.test(head)) { title = head; body = rest.join('\n'); }
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: { url: self.registration.scope },
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const url = self.registration.scope;
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const opened = windows.find(client => client.url.startsWith(url));
    if (opened) return opened.focus();
    return clients.openWindow(url);
  })());
});
