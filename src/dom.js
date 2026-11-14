// 화면 코드가 같이 쓰는 작은 도우미.
export const $ = id => document.getElementById(id);
export const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
// 값이 바뀌었을 때만 DOM을 건드린다. (누르는 중인 버튼이 다시 그려져 눌림이 씹히지 않게)
export const setText = (el, text) => { if (el.textContent !== String(text)) el.textContent = text; };
export const setHTML = (el, html) => { if (el._html !== html) { el._html = html; el.innerHTML = html; } };
export const setSrc = (el, src) => { if (el.getAttribute('src') !== src) el.src = src; };

// 글을 복사한다. https가 아닌 주소(집 와이파이 테스트)에는 clipboard API가 없어서 옛 방식으로 넘어간다.
export async function copyText(text) {
  if (navigator.clipboard) {
    try { await navigator.clipboard.writeText(text); return true; } catch { /* 아래 방식으로 */ }
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.append(ta);
  ta.select();
  const ok = document.execCommand('copy');
  ta.remove();
  return ok;
}
