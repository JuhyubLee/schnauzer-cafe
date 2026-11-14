// 시작점: 불러오기, 화면 크기 맞추기, 터치 처리, 매 프레임 갱신.
import {
  G, load, save, tick, on, serve, petPet, collect, cookState, stoves, recipeOf,
  askPlace, moveItem, askPaint,
} from './game.js';
import { fmtTime } from './data.js';
import { buildAtlas, setSprite } from './sprites.js';
import { createRenderer, VIEW_W, viewH, tileAt, TILE, PAD, WALL_H, PHOTO_RECT } from './render.js';
import { initUI } from './ui.js';
import { sfx } from './sfx.js';
import { syncMusic } from './music.js';
import { restoreMirrored, onBack } from './device.js';

// 앱에서는 웹 저장소가 지워졌을 때 기기 저장소의 사본으로 되살린 다음 불러온다.
await restoreMirrored('schnauzer-cafe-');
load();
const canvas = document.getElementById('cv');
const stage = document.getElementById('stage');
const atlas = buildAtlas();

// 나만의 메뉴 아이콘은 저장에 들어 있는 그림으로 만든다. 고칠 때마다 다시 만든다.
const customSprite = c => setSprite(atlas, `custom_${c.id}`, c.px);
G.state.custom.forEach(customSprite);
on('custom', id => {
  const c = G.state.custom.find(c => c.id === id);
  if (c) customSprite(c);
});

const renderer = createRenderer(canvas, atlas);
const ui = initUI({ atlas, renderer });

// ── 화면 크기: 픽셀이 뭉개지지 않게 기기 픽셀 기준 정수배로 맞춘다 ──
function fit() {
  const w = VIEW_W, h = viewH(G.state.rows), dpr = window.devicePixelRatio || 1;
  let scale = Math.min((stage.clientWidth - 12) * dpr / w, (stage.clientHeight - 12) * dpr / h);
  if (scale >= 2) scale = Math.floor(scale);
  canvas.style.width = `${(w * scale) / dpr}px`;
  canvas.style.height = `${(h * scale) / dpr}px`;
}
new ResizeObserver(fit).observe(stage);
on('resize', fit);

// ── 터치 ──
const toView = e => {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height };
};
const inRect = (p, x, y, w, h) => p.x >= x && p.x < x + w && p.y >= y && p.y < y + h;

function playTap(p) {
  const w = G.world;

  // 다 된 요리는 말풍선을 눌러도 꺼낸다.
  for (const st of stoves()) {
    if (cookState(st) === 'done' && inRect(p, PAD + st.x * TILE, WALL_H + st.y * TILE - 28, TILE, 28 + TILE)) {
      collect(st.id);
      return;
    }
  }

  // 기다리는 손님: 말풍선까지 포함해서 가장 가까운 손님
  let best = null, bestD = Infinity;
  for (const c of w.customers) {
    if (c.state !== 'wait') continue;
    const x = PAD + c.x * TILE, y = WALL_H + c.y * TILE;
    if (!inRect(p, x - 3, y - 30, TILE + 6, 30 + TILE)) continue;
    const d = Math.hypot(p.x - (x + 8), p.y - (y - 6));
    if (d < bestD) { best = c; bestD = d; }
  }
  if (best) { serve(best); return; }

  // 동물 친구: 겹쳐 있으면 누른 곳에 가까운 쪽을 쓰다듬는다.
  let pet = null, petD = Infinity;
  for (const q of w.pets) {
    const x = PAD + q.x * TILE, y = WALL_H + q.y * TILE;
    if (!inRect(p, x - 3, y - 6, TILE + 6, TILE + 8)) continue;
    const d = Math.hypot(p.x - (x + 8), p.y - (y + 8));
    if (d < petD) { pet = q; petD = d; }
  }
  if (pet) { petPet(pet.id); return; }

  if (G.visit) return; // 구경 중에는 남의 화구와 액자를 건드리지 않는다
  // 벽의 큰 액자: 누르기 쉽게 둘레 3px까지 받는다
  if (inRect(p, PHOTO_RECT.x - 3, PHOTO_RECT.y - 3, PHOTO_RECT.w + 6, PHOTO_RECT.h + 6)) { sfx('tap'); ui.openPhoto(); return; }
  const it = renderer.pickItem(p.x, p.y);
  if (it?.type !== 'stove') return;
  if (cookState(it) === 'idle') { sfx('tap'); ui.openCook(it.id); }
  else ui.toast(`${recipeOf(it.cook.r).name} · ${fmtTime((it.cook.end - Date.now()) / 1000)} 남았어요`);
}

function editTap(p) {
  const e = G.edit, t = tileAt(p.x, p.y);
  if (e.place) askPlace(e.place, t.x, t.y);
  else {
    e.pending = null;
    const it = renderer.pickItem(p.x, p.y);
    if (it) e.sel = e.sel === it.id ? null : it.id;
    else if (e.sel != null) moveItem(e.sel, t.x, t.y);
  }
  ui.renderEdit();
}

function paintAt(e) {
  const p = toView(e), t = tileAt(p.x, p.y);
  if (askPaint(t.x, t.y, G.edit.floor)) { sfx('tap'); ui.renderEdit(); }
}

let press = null;
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId);
  press = { x: e.clientX, y: e.clientY, moved: false };
  if (G.edit?.floor) paintAt(e);
});
canvas.addEventListener('pointermove', e => {
  if (!press) return;
  if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) press.moved = true;
  if (G.edit?.floor) paintAt(e);
});
canvas.addEventListener('pointerup', e => {
  if (!press) return;
  const moved = press.moved;
  press = null;
  if (moved || G.edit?.floor) return;
  if (G.edit) editTap(toView(e)); else playTap(toView(e));
});
canvas.addEventListener('pointercancel', () => { press = null; });

// ── 음악: 브라우저가 화면을 한 번 누른 뒤에야 소리를 허락하므로, 누를 때마다 맞춰 본다 ──
document.addEventListener('pointerdown', syncMusic);

// ── 화면을 떠날 때 저장한다 ──
document.addEventListener('visibilitychange', () => {
  if (document.hidden && G.state.started) save();
  syncMusic();
});
window.addEventListener('pagehide', () => { if (G.state.started) save(); });

// ── 초대장 링크(주소 뒤 #visit=...)로 들어왔을 때 ──
ui.handleInvite(location.hash);
window.addEventListener('hashchange', () => ui.handleInvite(location.hash));

// ── 안드로이드 뒤로 가기 ──
onBack(ui.back);

// ── 매 프레임 ──
// 바뀐 게 있으면 그 프레임에 바로 저장한다. 브라우저를 그냥 꺼도 마지막 조작이 남게.
let last = performance.now(), uiT = 0, saved = '';
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  tick(dt);
  renderer.draw();
  if ((uiT += dt) > 0.25) { uiT = 0; ui.refresh(); }
  if (G.state.started && !G.visit && JSON.stringify(G.state) !== saved) saved = save();
  requestAnimationFrame(frame);
}
fit();
requestAnimationFrame(frame);
