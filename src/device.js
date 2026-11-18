// 앱(Capacitor)으로 포장됐을 때만 쓰는 기기 기능. 웹 브라우저에서는 아무 일도 하지 않는다.
// 번들러 없이 쓰려고, 앱이 넣어 주는 window.Capacitor의 기본 호출(nativePromise, nativeCallback)을 직접 쓴다.
const cap = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() ? window.Capacitor : null;
const call = (plugin, method, args = {}) => cap.nativePromise(plugin, method, args);

export const isApp = !!cap;

// ───── 저장 이중화 ─────
// 앱의 웹 저장소(localStorage)는 기기 용량이 모자라면 지워질 수 있다.
// 그래서 같은 내용을 기기 저장소(Preferences)에도 써 두고, 웹 저장소가 비었을 때 되살린다.

const MIRROR_DELAY = 1500; // 저장이 잦아서 모아서 쓴다(밀리초)
let waiting = {}, timer = 0;

function flush() {
  clearTimeout(timer);
  timer = 0;
  const batch = waiting;
  waiting = {};
  for (const [key, value] of Object.entries(batch)) {
    const done = value == null ? call('Preferences', 'remove', { key }) : call('Preferences', 'set', { key, value });
    done.catch(() => { /* 기기 저장소를 못 쓰면 웹 저장소만 쓴다 */ });
  }
}

// value가 null이면 기기 저장소에서도 지운다. 지우는 건 미루지 않는다(바로 새로고침해도 되살아나지 않게).
export function mirror(key, value) {
  if (!cap) return;
  waiting[key] = value;
  if (value == null) flush();
  else timer ||= setTimeout(flush, MIRROR_DELAY);
}

// 웹 저장소에 없는 키를 기기 저장소에서 되살린다. 게임을 불러오기 전에 한 번 부른다.
export async function restoreMirrored(prefix) {
  if (!cap) return;
  try {
    const { keys } = await call('Preferences', 'keys');
    for (const key of keys) {
      if (!key.startsWith(prefix) || localStorage.getItem(key) != null) continue;
      const { value } = await call('Preferences', 'get', { key });
      if (value != null) localStorage.setItem(key, value);
    }
  } catch { /* 되살리지 못해도 게임은 시작한다 */ }
}

if (cap) {
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  window.addEventListener('pagehide', flush);
}

// ───── 뒤로 가기, 공유 ─────

// 안드로이드 뒤로 가기 버튼. handler가 true를 돌려주면 게임 안에서 처리한 것이고, 아니면 앱을 내려놓는다.
export function onBack(handler) {
  if (!cap) return;
  cap.nativeCallback('App', 'addListener', { eventName: 'backButton' }, () => {
    if (!handler()) call('App', 'minimizeApp').catch(() => {});
  });
}

// 앱이 앞으로 나올 때(true)와 물러날 때(false) 알려 준다. 제어 센터나 전화처럼 화면은 그대로인데 앱이 잠깐 멈출 때도 온다.
export function onActive(handler) {
  if (!cap) return;
  cap.nativeCallback('App', 'addListener', { eventName: 'appStateChange' }, state => handler(!!state?.isActive));
}

// 기기의 공유 창을 띄운다. 띄웠으면(닫은 경우 포함) true, 공유 창이 없으면 false.
export async function share({ text, url }) {
  if (cap) {
    try { await call('Share', 'share', url ? { text, url } : { text }); } catch { /* 공유 창을 닫은 경우 */ }
    return true;
  }
  if (!navigator.share) return false;
  try { await navigator.share(url ? { text, url } : { text }); } catch { /* 공유 창을 닫은 경우 */ }
  return true;
}
