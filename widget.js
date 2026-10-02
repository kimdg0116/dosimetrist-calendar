// DOSIMETRIST_WIDGET — Dosimetrist Calendar 아이폰 위젯 (Scriptable 앱)
// 폰에 붙여넣는 건 짧은 설치 코드(widget-setup.html)뿐이고, 그 코드가 이 파일을 받아 실행한다 → 여기만 고치면 모든 폰 위젯이 바뀐다
// 위젯 매개변수: A(기본) = 오늘 업무 + 오늘 일정 / B = 오늘·내일 일정(참석 인원) + 당직·온콜
// 접근 코드는 처음 한 번 Scriptable 에서 실행할 때 입력 → 그 폰의 키체인에만 저장 (코드·서버 어디에도 안 남김)

const API = 'https://script.google.com/macros/s/AKfycbx9edCqkSdDH_WXUhUyHx-V5TVKAMWQ2X8ZDNhDXV04eTYVotygX5CTqWVT8no5b4jK/exec';
const APP = 'https://kimdg0116.github.io/dosimetrist-calendar/';
const KEY = 'dosimetrist-code';
const DUTY = ['당직', '온콜'];                                         // B 에 보일 업무

const dyn = (l, d) => Color.dynamic(new Color(l), new Color(d));     // 라이트 / 다크 (앱과 같은 색)
const C = {
  bg: dyn('#ffffff', '#1a2233'), fg: dyn('#191919', '#e9eef8'), mute: dyn('#666666', '#9ba8bf'),
  deep: dyn('#1428a0', '#8cbaff'), pill: dyn('#e8f1ff', '#1d2c4d'), pillFg: dyn('#2e70ff', '#8cbaff'),
  red: dyn('#fa4b50', '#fb6f73'), line: dyn('#e3eaf7', '#2b3750'),
};
const F = { head: Font.heavySystemFont(13), role: Font.semiboldSystemFont(11.5), who: Font.boldSystemFont(12.5),
  pill: Font.boldSystemFont(10.5), ev: Font.boldSystemFont(12), sub: Font.mediumSystemFont(10.5), tiny: Font.mediumSystemFont(9) };

function text(stack, s, font, color, lines = 1) {
  const t = stack.addText(String(s));
  t.font = font; t.textColor = color; t.lineLimit = lines; t.minimumScaleFactor = 0.75;
  return t;
}
function pill(stack, s) {
  const p = stack.addStack();
  p.backgroundColor = C.pill; p.cornerRadius = 7; p.setPadding(1, 5, 1, 5);
  text(p, s, F.pill, C.pillFg);
  return p;
}
function header(w, left, hol, right) {
  const h = w.addStack(); h.layoutHorizontally(); h.centerAlignContent();
  text(h, left, F.head, C.deep);
  if (hol) { h.addSpacer(6); text(h, hol, F.sub, C.red); }
  h.addSpacer();
  if (right) text(h, right, F.tiny, C.mute);
}
// 일정 한 줄: [구분] 내용(없으면 이름) 시각. withNames 면 아래 줄에 참석 인원
function eventLine(stack, e, withNames) {
  const box = stack.addStack(); box.layoutVertically(); box.spacing = 1;
  const row = box.addStack(); row.layoutHorizontally(); row.centerAlignContent(); row.spacing = 4;
  pill(row, e.kind);
  const main = e.memo || e.names.join(' ') || '-';
  text(row, main, F.ev, C.fg);
  if (e.time) text(row, e.time, F.sub, C.mute);
  if (withNames && e.memo && e.names.length) text(box, e.names.join(' '), F.sub, C.mute);
  return withNames && e.memo && e.names.length ? 2 : 1;               // 차지한 줄 수
}
function events(stack, list, room, withNames) {
  if (!list.length) { text(stack, '일정 없음', F.sub, C.mute); return; }
  let used = 0, shown = 0;
  for (const e of list) {
    const need = withNames && e.memo && e.names.length ? 2 : 1;
    if (used + need > room) break;
    used += eventLine(stack, e, withNames); shown++;
  }
  if (shown < list.length) text(stack, `+${list.length - shown}개 더`, F.sub, C.mute);
}

// A: 오늘 업무(왼쪽) + 오늘 일정(오른쪽)
function buildA(w, d) {
  const t = d.days[0];
  header(w, `오늘 · ${t.md}`, t.hol, d.stale ? `${d.at} 기준` : '');
  w.addSpacer(7);
  const row = w.addStack(); row.layoutHorizontally(); row.spacing = 14;
  const left = row.addStack(); left.layoutVertically(); left.spacing = 3;
  t.roles.forEach(r => {
    const s = left.addStack(); s.layoutHorizontally(); s.centerAlignContent();
    const l = s.addStack(); l.size = new Size(76, 0);
    text(l, r.role, F.role, C.mute); l.addSpacer();                  // 왼쪽 정렬
    text(s, r.who || '-', F.who, C.fg);
  });
  const right = row.addStack(); right.layoutVertically(); right.spacing = 4;
  events(right, t.events, 6, true);                                  // 내용이 있는 일정은 아래 줄에 참석 인원
  right.addSpacer();
  w.addSpacer();
}

// B: 오늘 | 내일 — 일정(참석 인원 포함) + 당직·온콜
function buildB(w, d) {
  // 두 칸을 같은 폭으로: 중형 위젯 폭은 화면 폭의 약 87% (기종마다 다름) − 좌우 여백 30 − 칸 사이 14
  const colW = Math.floor((Device.screenSize().width * 0.866 - 44) / 2);
  const row = w.addStack(); row.layoutHorizontally(); row.spacing = 14;
  d.days.forEach((t, i) => {
    const col = row.addStack(); col.layoutVertically(); col.spacing = 4; col.size = new Size(colW, 0);
    const h = col.addStack(); h.layoutHorizontally(); h.centerAlignContent();
    text(h, `${i ? '내일' : '오늘'} ${t.md}`, F.head, C.deep);
    if (t.hol) { h.addSpacer(5); text(h, t.hol, F.sub, C.red); }
    h.addSpacer();
    events(col, t.events, 4, true);
    col.addSpacer();
    const line = col.addStack(); line.size = new Size(colW, 1); line.backgroundColor = C.line;   // 폭을 정해야 선이 보인다
    t.roles.filter(r => DUTY.includes(r.role)).forEach(r => {
      const s = col.addStack(); s.layoutHorizontally(); s.centerAlignContent();
      const l = s.addStack(); l.size = new Size(34, 0);
      text(l, r.role, F.role, C.mute); l.addSpacer();
      text(s, r.who || '-', F.who, C.fg);
    });
  });
}

// 소형: 오늘 일정만 / 잠금 화면: 숫자만 (남이 봐도 이름이 안 보이게)
function buildSmall(w, d) {
  const t = d.days[0];
  header(w, `오늘 ${t.md}`, '', '');
  w.addSpacer(6);
  const s = w.addStack(); s.layoutVertically(); s.spacing = 5;
  events(s, t.events, 5, false);
  w.addSpacer();
}
function buildLock(w, d) {
  const t = d.days[0], n = {};
  t.events.forEach(e => { n[e.kind] = (n[e.kind] || 0) + (e.kind === '연차' ? e.names.length : 1); });
  text(w, `오늘 일정 ${t.events.length}건`, Font.boldSystemFont(13), Color.white());
  text(w, Object.entries(n).map(([k, v]) => `${k} ${v}`).join(' · ') || '없음', Font.mediumSystemFont(12), Color.white());
  text(w, `내일 ${d.days[1].events.length}건`, Font.mediumSystemFont(12), Color.white());
}

async function load(code) {
  const fm = FileManager.local(), cache = fm.joinPath(fm.cacheDirectory(), 'dosimetrist-widget.json');
  try {
    const r = new Request(API);
    r.method = 'POST'; r.headers = { 'Content-Type': 'text/plain' }; r.timeoutInterval = 20;
    r.body = JSON.stringify({ fn: 'widget', args: [], code, who: '', dev: 'widget' });
    const out = await r.loadJSON();
    if (out.ok) { fm.writeString(cache, JSON.stringify(out.data)); return out.data; }
    if (out.error === 'AUTH') return { auth: true };
    throw new Error(out.error);
  } catch (e) {                                                      // 인터넷이 안 되면 마지막으로 받은 내용
    if (fm.fileExists(cache)) return { ...JSON.parse(fm.readString(cache)), stale: true };
    return { err: String((e && e.message) || e) };
  }
}

async function askCode() {
  const a = new Alert();
  a.title = 'Dosimetrist Calendar';
  a.message = '앱과 같은 6자리 접근 코드를 넣어 주세요. 이 폰에만 저장됩니다.';
  a.addSecureTextField('접근 코드', '');
  a.addAction('저장'); a.addCancelAction('취소');
  if (await a.present() !== 0) return '';
  const code = a.textFieldValue(0).trim();
  if (code) Keychain.set(KEY, code);
  return code;
}

module.exports = async () => {
  let code = Keychain.contains(KEY) ? Keychain.get(KEY) : '';
  let mode = String(args.widgetParameter || 'A').trim().toUpperCase() === 'B' ? 'B' : 'A';
  if (config.runsInApp) {                                            // 앱에서 직접 실행: 코드 입력 · 미리보기
    if (!code) code = await askCode();
    else {
      const m = new Alert();
      m.title = 'Dosimetrist Calendar 위젯';
      m.addAction('A 미리보기 (오늘 업무 + 일정)'); m.addAction('B 미리보기 (오늘·내일)'); m.addAction('접근 코드 다시 입력');
      m.addCancelAction('닫기');
      const k = await m.presentSheet();
      if (k === 2) code = await askCode();
      if (k < 0) return Script.complete();
      mode = k === 1 ? 'B' : 'A';
    }
  }
  const w = new ListWidget();
  w.backgroundColor = C.bg; w.setPadding(13, 15, 12, 15); w.url = APP;
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);         // 다시 그리는 시점은 iOS 가 정한다 (보통 15~30분)
  const d = code ? await load(code) : { auth: true };
  const fam = config.widgetFamily || 'medium';
  if (d.auth || d.err) {
    text(w, 'Dosimetrist Calendar', F.head, C.deep); w.addSpacer(4);
    text(w, d.auth ? 'Scriptable 앱에서 이 위젯을 한 번 실행해 접근 코드를 넣어 주세요' : '불러오지 못했습니다: ' + d.err, F.sub, C.mute, 3);
  } else if (fam.startsWith('accessory')) buildLock(w, d);
  else if (fam === 'small') buildSmall(w, d);
  else if (mode === 'B') buildB(w, d);
  else buildA(w, d);
  if (config.runsInWidget) Script.setWidget(w);
  else if (fam === 'small') await w.presentSmall();
  else await w.presentMedium();
  Script.complete();
};
