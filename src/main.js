// 시작점: 불러오기, 화면 크기 맞추기, 터치 처리, 매 프레임 갱신.
import {
  G, load, save, tick, catchUp, on, serve, petDog, collect, cookState, stoves,
  place, moveItem, paintFloor,
} from './game.js';
import { RECIPE, fmtTime } from './data.js';
import { buildAtlas } from './sprites.js';
import { createRenderer, VIEW_W, viewH, tileAt, TILE, PAD, WALL_H } from './render.js';
import { initUI } from './ui.js';
import { sfx } from './sfx.js';

load();
const canvas = document.getElementById('cv');
const stage = document.getElementById('stage');
const atlas = buildAtlas();
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

  const d = w.dog;
  if (inRect(p, PAD + d.x * TILE - 3, WALL_H + d.y * TILE - 6, TILE + 6, TILE + 8)) { petDog(); return; }

  const it = renderer.pickItem(p.x, p.y);
  if (it?.type !== 'stove') return;
  if (cookState(it) === 'idle') { sfx('tap'); ui.openCook(it.id); }
  else ui.toast(`${RECIPE[it.cook.r].name} · ${fmtTime((it.cook.end - Date.now()) / 1000)} 남았어요`);
}

function editTap(p) {
  const e = G.edit, t = tileAt(p.x, p.y);
  if (e.place) place(e.place, t.x, t.y);
  else {
    const it = renderer.pickItem(p.x, p.y);
    if (it) e.sel = e.sel === it.id ? null : it.id;
    else if (e.sel != null) moveItem(e.sel, t.x, t.y);
  }
  ui.renderEdit();
}

function paintAt(e) {
  const p = toView(e), t = tileAt(p.x, p.y);
  if (paintFloor(t.x, t.y, G.edit.floor)) sfx('tap');
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

// ── 자리를 비웠다 돌아왔을 때 ──
function comeBack() {
  if (!G.state.started) return;
  const result = catchUp();
  if (result) ui.showWelcome(result);
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (G.state.started) save(); } else comeBack();
});
window.addEventListener('pagehide', () => { if (G.state.started) save(); });
comeBack();

// ── 매 프레임 ──
let last = performance.now(), uiT = 0, saveT = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  tick(dt);
  renderer.draw();
  if ((uiT += dt) > 0.25) { uiT = 0; ui.refresh(); }
  if ((saveT += dt) > 5) { saveT = 0; if (G.state.started) save(); }
  requestAnimationFrame(frame);
}
fit();
requestAnimationFrame(frame);
