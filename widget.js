// DOSIMETRIST_WIDGET — Dosimetrist Calendar 아이폰 위젯 (Scriptable 앱)
// 폰에 붙여넣는 건 짧은 설치 코드(widget-setup.html)뿐이고, 그 코드가 이 파일을 받아 실행한다 → 여기만 고치면 모든 폰 위젯이 바뀐다
// 위젯 매개변수: A(기본) = 오늘 업무 + 오늘 일정 / B = 오늘·내일 일정(참석 인원) + 당직·온콜
//   뒤에 '라이트' 또는 '다크'를 붙이면 그 색으로 고정 (예: 'A 라이트'). 없으면 폰 설정을 따른다
//   (iOS 18 홈 화면 '사용자화'가 다크로 고정돼 있으면 폰이 라이트여도 위젯은 다크로 그려진다)
// 접근 코드는 처음 한 번 Scriptable 에서 실행할 때 입력 → 그 폰의 키체인에만 저장 (코드·서버 어디에도 안 남김)

const API = 'https://script.google.com/macros/s/AKfycbx9edCqkSdDH_WXUhUyHx-V5TVKAMWQ2X8ZDNhDXV04eTYVotygX5CTqWVT8no5b4jK/exec';
const APP = 'https://kimdg0116.github.io/dosimetrist-calendar/';
const KEY = 'dosimetrist-code';
const DUTY = ['당직', '온콜'];                                         // B 에 보일 업무

const PARAM = String((typeof args !== 'undefined' && args.widgetParameter) || '');
const THEME = /라이트|light/i.test(PARAM) ? 'light' : /다크|dark/i.test(PARAM) ? 'dark' : '';
const dyn = (l, d) => THEME === 'light' ? new Color(l) : THEME === 'dark' ? new Color(d)
  : Color.dynamic(new Color(l), new Color(d));                       // 라이트 / 다크 (앱과 같은 색)
// 위젯 색 = 앱 테마 색. 앱 개인 설정 → 아이폰 위젯 → '위젯 색 맞추기'가 scriptable:///run/dosimetrist-widget-core?color=mint 처럼 열어 이 폰 키체인에 적어 둔다
// (설치 코드 이름은 사람마다 다를 수 있어서, 이름이 고정된 위젯 본체를 연다)
const COLOR_KEY = 'dosimetrist-color';
const QP = (typeof args !== 'undefined' && args.queryParameters) || {};
if (QP.color && /^[a-z]+$/.test(QP.color)) Keychain.set(COLOR_KEY, QP.color);
// <palettes> 앱 index.html 테마 색에서 뽑은 [라이트, 다크] × [바탕, 글자, 흐림, 제목, 알약, 알약 글자, 빨강, 줄] (서버 폴더 tools/widget-palettes.py --write)
const PALETTES = {"blue":[["#ffffff","#191919","#666666","#1428a0","#e8f1ff","#2e70ff","#fa4b50","#dbe8ff"],["#1a2233","#e9eef8","#9ba8bf","#8cbaff","#1d2c4d","#508eff","#fb6f73","#2b3750"]],"mint":[["#ffffff","#191919","#666666","#00806F","#e2f4f0","#00A08C","#fa4b50","#d3ebe5"],["#162523","#e7f2f0","#97aba7","#2BB8A5","#173531","#2BB8A5","#fb6f73","#25403b"]],"lavender":[["#ffffff","#191919","#666666","#6B5BB5","#efedf7","#8A7AD6","#fa4b50","#e6e3f2"],["#23222e","#e7e6f0","#9d9ab0","#A99CF0","#333145","#A99CF0","#fb6f73","#3b384d"]],"lilac":[["#ffffff","#191919","#666666","#86529F","#f2ecf4","#A878C8","#fa4b50","#eae2ef"],["#26222d","#e9e6ef","#a29aae","#C99BE6","#3a3143","#C99BE6","#fb6f73","#41384b"]],"indigo":[["#ffffff","#191919","#666666","#4F45A6","#ecebf5","#7166D0","#fa4b50","#e1dff0"],["#22212d","#e6e5f0","#9b99b0","#9F96EE","#313044","#9F96EE","#fb6f73","#39374c"]],"coral":[["#ffffff","#191919","#666666","#C04A36","#f8ebe9","#E8705A","#fa4b50","#f4e0dd"],["#2c2021","#eee4e6","#ac979a","#FF8A75","#452d2c","#FF8A75","#fb6f73","#4c3434"]],"apricot":[["#ffffff","#191919","#666666","#B5562B","#f7ece8","#E07B45","#fa4b50","#f2e2db"],["#2c2220","#eee6e5","#ac9b98","#FF9E6A","#45312a","#FF9E6A","#fb6f73","#4c3832"]],"rose":[["#ffffff","#191919","#666666","#BF4260","#f8eaee","#E06A84","#fa4b50","#f4dfe4"],["#2c2126","#eee5ea","#ac99a3","#FF92A8","#452f36","#FF92A8","#fb6f73","#4c363e"]],"charcoal":[["#ffffff","#191919","#666666","#3F4650","#eaebec","#6B7280","#fa4b50","#dee0e1"],["#24252a","#e8e8ed","#9fa0a9","#B8BEC8","#36383d","#B8BEC8","#fb6f73","#3e3f45"]],"bluegray":[["#ffffff","#191919","#666666","#41536B","#eaecef","#6A7C93","#fa4b50","#dfe2e6"],["#23242a","#e7e8ed","#9da0aa","#A9B9CE","#33373e","#A9B9CE","#fb6f73","#3b3e46"]],"warmgray":[["#ffffff","#191919","#666666","#504943","#ecebea","#7A7168","#fa4b50","#e1e0df"],["#262527","#e9e8eb","#a2a0a5","#C4BAB0","#393738","#C4BAB0","#fb6f73","#403e40"]],"sky":[["#ffffff","#191919","#666666","#0B5C99","#e6f1f9","#2A9BE0","#fa4b50","#d8e9f6"],["#1b242e","#e0e8f0","#8f9fb1","#5BB8F5","#243646","#5BB8F5","#fb6f73","#2b3e4e"]],"navy":[["#ffffff","#191919","#666666","#1A2D5A","#e8ebf2","#3D63B0","#fa4b50","#dbe1eb"],["#20232d","#e5e7ef","#989eaf","#8FAEE8","#2e3443","#8FAEE8","#fb6f73","#353c4b"]],"cobalt":[["#ffffff","#191919","#666666","#0B3AA8","#e6ecfc","#3B6EF5","#fa4b50","#d9e2fa"],["#1f222f","#e3e6f1","#959cb3","#7FA3FF","#2b3248","#7FA3FF","#fb6f73","#323950"]],"sage":[["#ffffff","#191919","#666666","#4A7A6A","#ebf0ef","#6E9C8B","#fa4b50","#e0e8e6"],["#212627","#e5e9eb","#99a2a5","#94C4B2","#2f3938","#94C4B2","#fb6f73","#364040"]],"teal":[["#ffffff","#191919","#666666","#0E7490","#e4f0f3","#1597B5","#fa4b50","#d6e7ec"],["#1a252c","#dfe9ef","#8ca1ad","#4CC2DE","#213841","#4CC2DE","#fb6f73","#284049"]]};
// </palettes>
const P = PALETTES[Keychain.contains(COLOR_KEY) ? Keychain.get(COLOR_KEY) : 'blue'] || PALETTES.blue;
const C = Object.fromEntries(['bg', 'fg', 'mute', 'deep', 'pill', 'pillFg', 'red', 'line'].map((k, i) => [k, dyn(P[0][i], P[1][i])]));
// 배경은 단색(backgroundColor) 대신 같은 색 두 개로 만든 그라데이션으로 칠한다.
// Scriptable 위젯에서 단색 배경은 폰의 라이트/다크 전환을 따라가지 않고, 그라데이션은 따라간다
const fill = c => { const g = new LinearGradient(); g.colors = [c, c]; g.locations = [0, 1]; return g; };
const F = { head: Font.heavySystemFont(13), role: Font.semiboldSystemFont(11.5), who: Font.boldSystemFont(12.5),
  pill: Font.boldSystemFont(10.5), ev: Font.boldSystemFont(12), sub: Font.mediumSystemFont(10.5), tiny: Font.mediumSystemFont(9) };

function text(stack, s, font, color, lines = 1) {
  const t = stack.addText(String(s));
  t.font = font; t.textColor = color; t.lineLimit = lines; t.minimumScaleFactor = 0.75;
  return t;
}
// 구분 알약은 폭을 고정(앱의 구분 칸처럼) → 일정 내용·참석 인원이 모두 같은 세로줄에서 시작한다
const PILL_W = 31;
function pill(stack, s) {
  const p = stack.addStack();
  p.backgroundGradient = fill(C.pill); p.cornerRadius = 7; p.setPadding(1, 0, 1, 0); p.size = new Size(PILL_W, 0);
  p.addSpacer(); text(p, s, F.pill, C.pillFg); p.addSpacer();          // 가운데
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
  if (withNames && e.memo && e.names.length) {                       // 참석 인원: 알약 다음, 내용과 같은 줄에서 시작
    const n = box.addStack(); n.layoutHorizontally(); n.addSpacer(PILL_W + 4);
    text(n, e.names.join(' '), F.sub, C.mute);
  }
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
    const line = col.addStack(); line.size = new Size(colW, 1); line.backgroundGradient = fill(C.line);   // 폭을 정해야 선이 보인다
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
  if (config.runsInApp && QP.color) {
    const a = new Alert();
    a.title = '위젯 색'; a.message = '앱 테마 색으로 맞췄습니다. 홈 화면 위젯은 다음에 새로 그릴 때 바뀝니다.'; a.addAction('확인');
    await a.present();
  }
  let code = Keychain.contains(KEY) ? Keychain.get(KEY) : '';
  let mode = /^\s*B/i.test(PARAM) ? 'B' : 'A';
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
  w.backgroundGradient = fill(C.bg); w.setPadding(13, 15, 12, 15); w.url = APP;
  w.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000);          // '가장 빠르면 5분 뒤' 요청. 실제로 다시 그리는 때는 iOS 가 정한다 (하루 횟수 제한)
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
// 목록에서 이 파일(dosimetrist-widget-core)을 직접 눌러도 위젯 미리보기로 돈다. 예전엔 함수만 만들고 끝나지 않아 동그라미만 계속 돌았다.
// '파트 위젯'(설치 코드)이 불러올 때는 Script.name() 이 '파트 위젯' 이라 두 번 돌지 않는다
if (Script.name() === 'dosimetrist-widget-core') module.exports();
