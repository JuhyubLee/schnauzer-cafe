// 게임 상태와 규칙. 화면(DOM, canvas)은 모른다. 바뀐 일은 on()으로 알린다.
import {
  RECIPES, RECIPE, CUSTOM_TIERS, MAX_CUSTOM, CUSTOM_NAME_MAX, FURN, FURN_GROUPS, FLOORS, WALLS,
  PETS, PET_SLOTS, PET_NAME_MAX, WEAR, START_ROWS, START_COLS, START_DOOR, EXPANSIONS, WIDENINGS, EXPAND_DIRS,
  STOVE_SPEED, STOVE_UPGRADE_COST, PHOTO_MAX_CHARS, levelOf, stoveLimit,
} from './data.js';
import { CUSTOMER_LOOKS, validIcon } from './sprites.js';
import { mirror } from './device.js';

// 가게 크기는 저장에 있다: state.rows(세로 줄 수), state.cols(가로 칸 수). 칸 번호는 y * cols + x.
// 문은 윗벽의 state.door 칸 위에 있고, 그 아래 칸 (door, 0)은 손님이 드나드는 길이다.
const cols = () => G.state.cols;
const SAVE_KEY = 'schnauzer-cafe-v1';
const PATIENCE = 40; // 손님이 기다려 주는 시간(초)
const EAT_TIME = 5;
const WALK_SPEED = 2.2; // 칸/초
const PET_SPEED = 2.8;
const PET_BOOST_TIME = 20;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// state: 저장되는 것. world: 화면에 돌아다니는 것(저장 안 함). edit: 꾸미기 중일 때만 있음.
// visit: 친구 가게를 구경하는 중일 때만 있음. 그동안 state는 친구 가게(임시)이고 내 가게는 home에 있다.
export const G = { state: null, world: null, edit: null, visit: null, home: null };

const listeners = {};
export const on = (evt, fn) => { (listeners[evt] ||= []).push(fn); };
const emit = (evt, data) => { for (const fn of listeners[evt] || []) fn(data); };
const fail = msg => { emit('toast', msg); return false; };
const rand = n => Math.floor(Math.random() * n);

function freshState() {
  let id = 1;
  const it = (type, x, y, extra) => ({ id: id++, type, x, y, ...extra });
  return {
    v: 1, started: false, shopName: '',
    coins: 100, xp: 0, rows: START_ROWS, cols: START_COLS, door: START_DOOR,
    items: [
      it('stove', 1, 0, { lv: 1, cook: null }), it('plant', 0, 0),
      it('table', 2, 2), it('stool', 1, 2), it('stool', 3, 2),
      it('table', 5, 4), it('stool', 4, 4), it('stool', 6, 4),
    ],
    nextId: id,
    floor: Array(START_ROWS * START_COLS).fill('wood'),
    wall: 'cream', walls: ['cream'],
    inv: {}, stock: {},
    pets: [], nextPet: 1, closet: [],
    custom: [], nextCustom: 1,
    notes: [],
    tut: 0, sound: true, music: true, dim: true,
    photo: null,
    stats: { sold: 0, cooked: 0 },
  };
}

// 예전 버전이 만든 저장을 지금 모양으로 맞춘다. 저장과 백업 코드를 읽을 때마다 거친다.
// 강아지 한 마리(dogName, dog.love)였던 저장은 슈나우저 친구 한 마리로 옮긴다.
function upgrade(s) {
  if (!Array.isArray(s.pets)) {
    s.pets = s.started
      ? [{ id: 1, species: 'schnauzer', name: s.dogName || '슈슈', love: s.dog?.love || 0, wear: {} }]
      : [];
  }
  delete s.dogName;
  delete s.dog;
  s.nextPet ??= s.pets.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  s.closet ??= [];
  s.custom ??= [];
  s.nextCustom ??= 1;
  s.music ??= true;
  s.dim ??= true;
  s.photo ??= null;
  s.cols ??= START_COLS;
  s.door ??= START_DOOR;
  delete s.lastSeen; // 자리를 비운 동안 팔던 때 쓰던 값
  return s;
}

function freshWorld() {
  G.world = { customers: [], nextCid: 1, spawnT: 2, time: 0, floats: [], pets: [] };
  syncPets();
}

// 저장된 친구마다 가게 안을 돌아다니는 몸을 하나씩 둔다.
function syncPets() {
  const w = G.world;
  w.pets = G.state.pets.map((pet, i) => {
    const old = w.pets.find(p => p.id === pet.id);
    if (old) return old;
    const pos = nearestFree(4 - i, 1);
    return {
      id: pet.id, x: pos.x, y: pos.y, path: [], state: 'idle', t: 1.5 + i * 0.7,
      dir: 1, up: false, walk: 0, boost: 0, target: null, think: i * 0.15, petCd: 0,
    };
  });
}

// ───── 저장 ─────

// 저장하고, 저장한 글(JSON)을 돌려준다.
// 구경 중에는 state가 남의 가게라서 절대 저장하지 않는다. (저장하면 내 가게가 덮인다)
export function save() {
  if (G.visit) return null;
  const json = JSON.stringify(G.state);
  try { localStorage.setItem(SAVE_KEY, json); } catch { /* 저장 공간이 막힌 브라우저 */ }
  mirror(SAVE_KEY, json);
  return json;
}

export function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { /* 깨진 저장은 버린다 */ }
  G.state = s && s.v === 1 ? upgrade(s) : freshState();
  G.edit = null;
  customCache = null;
  freshWorld();
}

export function reset() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* 위와 같음 */ }
  mirror(SAVE_KEY, null);
  load();
}

export function startGame({ shopName, petName, species }) {
  const s = G.state;
  s.shopName = shopName;
  s.pets = [{ id: s.nextPet++, species, name: petName, love: 0, wear: {} }];
  s.started = true;
  syncPets();
  save();
}

// ───── 놀러 가기 ─────

// 친구 가게(state)를 구경하기 시작한다. 거기서 일어난 일(판매, 쓰다듬기)은 돌아올 때 모두 버린다.
// info: { name, sid } 구경 중인 가게
export function enterVisit(state, info) {
  if (G.visit) leaveVisit();
  G.home = G.state;
  G.state = state;
  G.visit = info;
  G.edit = null;
  customCache = null;
  freshWorld();
  for (const c of state.custom) emit('custom', c.id);
  emit('resize');
}

export function leaveVisit() {
  if (!G.visit) return;
  G.state = G.home;
  G.home = null;
  G.visit = null;
  customCache = null;
  freshWorld();
  emit('resize');
}

// ───── 백업 코드 ─────

const BACKUP_PREFIX = 'CAFE1:';
export const MAX_ROWS = START_ROWS + Object.keys(EXPANSIONS).length;
export const MAX_COLS = START_COLS + Object.keys(WIDENINGS).length;

// 붙여 넣은 백업이 이 게임이 읽을 수 있는 모양인지 본다. 잘린 코드나 엉뚱한 글을 걸러 낸다.
function usable(s) {
  const int = Number.isInteger, has = Object.hasOwn;
  const obj = v => !!v && typeof v === 'object';
  const recipe = id => has(RECIPE, id) || s.custom.some(c => c.id === id);
  return obj(s) && s.v === 1
    && typeof s.shopName === 'string'
    && int(s.coins) && s.coins >= 0 && int(s.xp) && s.xp >= 0
    && int(s.nextId) && int(s.nextPet) && int(s.nextCustom)
    && int(s.rows) && s.rows >= START_ROWS && s.rows <= MAX_ROWS
    && int(s.cols) && s.cols >= START_COLS && s.cols <= MAX_COLS && int(s.door) && s.door >= 0 && s.door < s.cols
    && Array.isArray(s.floor) && s.floor.length === s.rows * s.cols && s.floor.every(f => has(FLOORS, f))
    && has(WALLS, s.wall) && Array.isArray(s.walls) && Array.isArray(s.notes)
    && (s.photo === null || validPhoto(s.photo))
    && obj(s.inv) && obj(s.stock) && obj(s.stats)
    && Array.isArray(s.closet) && s.closet.every(id => has(WEAR, id))
    && Array.isArray(s.custom) && s.custom.length <= MAX_CUSTOM && s.custom.every(c => obj(c)
      && /^c\d+$/.test(c.id) && typeof c.name === 'string' && has(CUSTOM_TIERS, c.tier) && validIcon(c.px))
    && Array.isArray(s.pets) && s.pets.length >= 1 && s.pets.length <= PET_SLOTS.length && s.pets.every(p => obj(p)
      && int(p.id) && has(PETS, p.species) && typeof p.name === 'string' && int(p.love) && obj(p.wear)
      && Object.entries(p.wear).every(([slot, id]) => has(WEAR, id) && WEAR[id].slot === slot))
    && Array.isArray(s.items) && s.items.every(i => obj(i) && has(FURN, i.type)
      && int(i.x) && int(i.y) && i.x >= 0 && i.x < s.cols && i.y >= 0 && i.y < s.rows
      && (i.type !== 'stove' || (STOVE_SPEED[i.lv - 1] > 0 && (!i.cook || recipe(i.cook.r)))));
}

export function exportSave() {
  let bin = '';
  for (const b of new TextEncoder().encode(JSON.stringify(G.state))) bin += String.fromCharCode(b);
  return BACKUP_PREFIX + btoa(bin);
}

// 백업 코드로 가게를 통째로 바꾼다. 성공하면 저장까지 하고 true.
export function importSave(code) {
  code = code.replace(/\s+/g, ''); // 메신저가 넣은 줄바꿈
  let s = null;
  try {
    const bin = atob(code.slice(BACKUP_PREFIX.length));
    s = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, ch => ch.charCodeAt(0))));
    if (s && s.v === 1) upgrade(s);
  } catch { s = null; }
  if (!code.startsWith(BACKUP_PREFIX) || !usable(s)) return fail('백업 코드가 올바르지 않아요. 처음부터 끝까지 복사했는지 봐 주세요');
  G.state = s;
  G.edit = null;
  customCache = null;
  freshWorld();
  save();
  return true;
}

// ───── 조회 ─────

export const level = () => levelOf(G.state.xp);
export const itemAt = (x, y) => G.state.items.find(i => i.x === x && i.y === y);
export const itemById = id => G.state.items.find(i => i.id === id);
export const petById = id => G.state.pets.find(p => p.id === id);
export const charm = () => G.state.items.reduce((sum, i) => sum + (FURN[i.type].charm || 0), 0);
export const stoves = () => G.state.items.filter(i => i.type === 'stove');
export const cookState = st => (!st.cook ? 'idle' : Date.now() >= st.cook.end ? 'done' : 'cooking');
const inBounds = (x, y) => x >= 0 && y >= 0 && x < cols() && y < G.state.rows;
const spawnInterval = () => Math.max(3.5, 9 - charm() * 0.2);

// 메뉴: 기본 메뉴와 나만의 메뉴를 같은 모양으로 다룬다.
let customCache = null; // 나만의 메뉴 id → 메뉴. 고칠 때마다 비운다.
function customRecipes() {
  customCache ||= new Map(G.state.custom.map(c =>
    [c.id, { ...CUSTOM_TIERS[c.tier], id: c.id, name: c.name, icon: `custom_${c.id}`, custom: true }]));
  return customCache;
}
export const recipeOf = id => RECIPE[id] || customRecipes().get(id);
export const allRecipes = () => [...RECIPES, ...customRecipes().values()];
const inStock = () => allRecipes().filter(r => G.state.stock[r.id] > 0);

// 돈도 재고도 없고 불 위에 올린 것도 없으면, 가장 싼 메뉴는 공짜로 만들 수 있다. (막히지 않게)
const CHEAPEST = RECIPES.reduce((a, b) => (b.cost < a.cost ? b : a));
const broke = () => G.state.coins < CHEAPEST.cost && !inStock().length && stoves().every(st => !st.cook);
export const costOf = r => (r === CHEAPEST && broke() ? 0 : r.cost);

// 받침에 맞는 조사를 붙인다: josa('슈슈', '이', '가') → '슈슈가'
export function josa(word, withBatchim, without) {
  const code = word.charCodeAt(word.length - 1);
  const has = code >= 0xac00 && code <= 0xd7a3 ? (code - 0xac00) % 28 !== 0 : false;
  return word + (has ? withBatchim : without);
}

export function hint() {
  const s = G.state;
  if (G.visit) return `${G.visit.name}에 놀러 왔어요. 동물 친구를 눌러 쓰다듬어 보세요`;
  if (G.edit) return '';
  switch (s.tut) {
    case 0: return '화구를 눌러 첫 메뉴를 만들어 보세요';
    case 1: return '요리가 끝나면 화구를 눌러 꺼내요';
    case 2: return `손님을 누르면 바로 서빙! 기다리면 ${josa(s.pets[0].name, '이', '가')} 가져다줘요`;
    case 3: return '번 돈으로 꾸미기에서 가게를 꾸며 보세요';
    default: return '';
  }
}

export function unlocksAt(lv) {
  const out = [];
  for (const r of RECIPES) if (r.lv === lv) out.push({ icon: r.icon, text: `새 메뉴: ${r.name}` });
  for (const f of Object.values(FURN)) if (f.lv === lv && lv > 1) out.push({ icon: f.sprite, text: `새 가구: ${f.name}` });
  for (const f of Object.values(FLOORS)) if (f.lv === lv && lv > 1) out.push({ text: `새 바닥: ${f.name}` });
  for (const w of Object.values(WALLS)) if (w.lv === lv && lv > 1) out.push({ text: `새 벽지: ${w.name}` });
  for (const t of Object.values(CUSTOM_TIERS)) if (t.lv === lv && lv > 1) out.push({ text: `나만의 메뉴: ${t.name} 등급` });
  if (stoveLimit(lv) > stoveLimit(lv - 1)) out.push({ icon: 'stove', text: `화구를 ${stoveLimit(lv)}개까지 놓을 수 있어요` });
  if (PET_SLOTS.some((slot, i) => i > 0 && slot.lv === lv)) out.push({ text: '새 동물 친구를 데려올 수 있어요' });
  if (EXPANSIONS[G.state.rows]?.lv === lv) out.push({ text: '가게를 위아래로 한 줄 넓힐 수 있어요' });
  if (WIDENINGS[G.state.cols]?.lv === lv) out.push({ text: '가게를 옆으로 한 줄 넓힐 수 있어요' });
  return out;
}

// ───── 길 찾기 ─────

function blockGrid() {
  const C = cols(), grid = new Uint8Array(C * G.state.rows);
  for (const i of G.state.items) if (FURN[i.type].block) grid[i.y * C + i.x] = 1;
  return grid;
}

// 시작 칸에서 isGoal 칸까지의 길(시작 칸 제외). 막힌 칸이라도 목적지면 들어갈 수 있다. 길이 없으면 null.
function findPath(sx, sy, isGoal, grid = blockGrid()) {
  const rows = G.state.rows, C = cols();
  const prev = new Int16Array(C * rows).fill(-1);
  const start = sy * C + sx;
  prev[start] = start;
  const queue = [start];
  for (let qi = 0; qi < queue.length; qi++) {
    const cur = queue[qi], cx = cur % C, cy = (cur - cx) / C;
    if (isGoal(cx, cy)) {
      const path = [];
      for (let n = cur; n !== start; n = prev[n]) path.unshift({ x: n % C, y: Math.floor(n / C) });
      return path;
    }
    if (grid[cur] && cur !== start) continue;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (!inBounds(nx, ny)) continue;
      const ni = ny * C + nx;
      if (prev[ni] !== -1 || (grid[ni] && !isGoal(nx, ny))) continue;
      prev[ni] = cur;
      queue.push(ni);
    }
  }
  return null;
}

function nearestFree(x, y) {
  const grid = blockGrid(), C = cols();
  let best = null, bestD = Infinity;
  for (let ty = 0; ty < G.state.rows; ty++) {
    for (let tx = 0; tx < C; tx++) {
      const d = Math.abs(tx - x) + Math.abs(ty - y);
      if (!grid[ty * C + tx] && d < bestD) { best = { x: tx, y: ty }; bestD = d; }
    }
  }
  return best || { x, y };
}

// 테이블 옆에 붙은 스툴만 자리로 친다.
function seats() {
  const out = [];
  for (const st of G.state.items) {
    if (st.type !== 'stool') continue;
    const d = DIRS.find(([dx, dy]) => FURN[itemAt(st.x + dx, st.y + dy)?.type]?.table);
    if (d) out.push({ id: st.id, x: st.x, y: st.y, tx: st.x + d[0], ty: st.y + d[1] });
  }
  return out;
}
export const seatCount = () => seats().length;

// 경로를 따라 움직인다. 다 가면 true.
function stepAlong(e, speed, dt) {
  let left = speed * dt;
  while (e.path.length && left > 0) {
    const p = e.path[0], dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
    if (Math.abs(dx) > 0.01) e.dir = dx > 0 ? 1 : -1;
    e.up = dy < -0.01;
    if (d <= left) { e.x = p.x; e.y = p.y; e.path.shift(); left -= d; }
    else { e.x += (dx / d) * left; e.y += (dy / d) * left; left = 0; }
  }
  e.walk += dt;
  return e.path.length === 0;
}

// ───── 돈과 경험치 ─────

function addXp(n) {
  if (G.visit) return; // 구경 중인 가게는 자라지 않는다
  const s = G.state, before = level();
  s.xp += n;
  const after = level();
  for (let lv = before + 1; lv <= after; lv++) {
    const reward = 50 * lv;
    s.coins += reward;
    emit('levelup', { lv, reward, unlocks: unlocksAt(lv) });
  }
}

// ───── 손님 ─────

function pickOrder() {
  const open = allRecipes().filter(r => r.lv <= level());
  const have = inStock();
  const pool = have.length && Math.random() < 0.8 ? have : open;
  return pool[rand(pool.length)].id;
}

function trySpawn() {
  const w = G.world, door = G.state.door;
  const taken = new Set(w.customers.map(c => c.seat.id));
  const free = seats().filter(s => !taken.has(s.id));
  const grid = blockGrid();
  while (free.length) {
    const seat = free.splice(rand(free.length), 1)[0];
    const path = findPath(door, 0, (x, y) => x === seat.x && y === seat.y, grid);
    if (!path) continue;
    w.customers.push({
      id: w.nextCid++, look: rand(CUSTOMER_LOOKS), seat, order: pickOrder(),
      x: door, y: -1, path: [{ x: door, y: 0 }, ...path],
      state: 'in', t: 0, dir: 1, up: false, walk: 0, claim: null,
    });
    return;
  }
}

function leave(c) {
  const door = G.state.door;
  const path = findPath(c.seat.x, c.seat.y, (x, y) => x === door && y === 0);
  if (!path) { c.state = 'gone'; return; }
  c.path = [...path, { x: door, y: -1 }];
  c.state = 'out';
}

function pay(c) {
  const s = G.state, r = recipeOf(c.order);
  const tip = Math.random() < Math.min(0.6, charm() * 0.03) ? Math.max(1, Math.round(r.price * 0.25)) : 0;
  s.coins += r.price + tip;
  s.stats.sold++;
  // 서빙 안내는 세 그릇 팔 때까지 보여 준다. (친구가 먼저 서빙해도 읽을 시간이 있게)
  if (s.tut === 2 && s.stats.sold >= 3) s.tut = 3;
  G.world.floats.push({ kind: 'coin', n: r.price + tip, x: c.x, y: c.y, t: 0 });
  emit('sale');
  addXp(1);
}

export function serve(c) {
  const s = G.state;
  if (c.state !== 'wait') return false;
  if (!(s.stock[c.order] > 0)) return fail(`${recipeOf(c.order).name} 재고가 없어요`);
  s.stock[c.order]--;
  c.state = 'eat';
  c.t = EAT_TIME;
  G.world.floats.push({ kind: 'heart', x: c.x, y: c.y - 0.6, t: 0 });
  emit('serve');
  return true;
}

function updateCustomers(dt) {
  const w = G.world, s = G.state;
  for (const c of w.customers) {
    if (c.state === 'in') {
      if (stepAlong(c, WALK_SPEED, dt)) {
        c.state = 'wait';
        c.t = 0;
        if (c.seat.tx !== c.seat.x) c.dir = c.seat.tx > c.seat.x ? 1 : -1;
        c.up = c.seat.ty < c.seat.y;
      }
    } else if (c.state === 'wait') {
      c.t += dt;
      // 없는 메뉴를 기다리다가, 있는 메뉴로 마음을 바꾼다.
      if (c.t > 6 && !(s.stock[c.order] > 0)) {
        const have = inStock();
        if (have.length) c.order = have[rand(have.length)].id;
      }
      if (c.t > PATIENCE) leave(c);
    } else if (c.state === 'eat') {
      c.t -= dt;
      if (c.t <= 0) { pay(c); leave(c); }
    } else if (c.state === 'out') {
      if (stepAlong(c, WALK_SPEED, dt)) c.state = 'gone';
    }
  }
  w.customers = w.customers.filter(c => c.state !== 'gone');
}
export const patienceLeft = c => 1 - c.t / PATIENCE;

// ───── 동물 친구 ─────

function updatePet(p, dt) {
  const w = G.world, s = G.state;
  p.boost = Math.max(0, p.boost - dt);
  p.petCd = Math.max(0, p.petCd - dt);
  const speed = PET_SPEED * (p.boost > 0 ? 1.6 : 1);

  if (p.state === 'serve') {
    const c = w.customers.find(c => c.id === p.target);
    const stillWanted = c && c.state === 'wait' && s.stock[c.order] > 0;
    if (stillWanted && !stepAlong(p, speed, dt)) return;
    if (stillWanted) serve(c);
    if (c) c.claim = null;
    Object.assign(p, { state: 'idle', t: stillWanted ? 1 : 0.5, path: [], target: null });
    return;
  }

  // 손님이 기다리면 하던 일을 멈추고 서빙하러 간다. (1.2초는 직접 누를 틈)
  // 다른 친구가 맡은 손님(claim)은 건너뛴다.
  p.think -= dt;
  if (p.think <= 0) {
    p.think = 0.3;
    const grid = blockGrid();
    for (const c of w.customers) {
      if (c.state !== 'wait' || c.t < 1.2 || c.claim != null || !(s.stock[c.order] > 0)) continue;
      const near = (x, y) => !grid[y * cols() + x] && Math.abs(x - c.seat.x) + Math.abs(y - c.seat.y) === 1;
      const path = findPath(Math.round(p.x), Math.round(p.y), near, grid);
      if (path) {
        c.claim = p.id;
        Object.assign(p, { state: 'serve', target: c.id, path });
        return;
      }
    }
  }

  if (p.state === 'walk') {
    if (stepAlong(p, speed * 0.6, dt)) {
      const onBed = itemAt(p.x, p.y)?.type === 'dogbed';
      p.state = onBed ? 'nap' : 'idle';
      p.t = onBed ? 10 + Math.random() * 10 : 1 + Math.random() * 3;
    }
    return;
  }

  p.t -= dt;
  if (p.t > 0) return;
  const beds = s.items.filter(i => i.type === 'dogbed');
  const goal = beds.length && Math.random() < 0.35
    ? beds[rand(beds.length)]
    : { x: rand(cols()), y: rand(s.rows) };
  const path = findPath(Math.round(p.x), Math.round(p.y), (x, y) => x === goal.x && y === goal.y);
  if (path && path.length && !FURN[itemAt(goal.x, goal.y)?.type]?.block) { p.state = 'walk'; p.path = path; }
  else { p.state = 'idle'; p.t = 1; }
}

// 쓰다듬기
export function petPet(id) {
  const p = G.world.pets.find(p => p.id === id);
  if (!p || p.petCd > 0) return;
  p.petCd = 0.8;
  p.boost = PET_BOOST_TIME;
  petById(id).love++;
  if (p.state === 'nap') { p.state = 'idle'; p.t = 1; }
  G.world.floats.push({ kind: 'heart', x: p.x, y: p.y - 0.4, t: 0 });
  emit('pet');
}

// 다음 친구를 데려오는 조건. 더 데려올 수 없으면 null.
export const adoptSlot = () => PET_SLOTS[G.state.pets.length] || null;

export function adopt(species, name) {
  const s = G.state, slot = adoptSlot();
  name = name.trim().slice(0, PET_NAME_MAX);
  if (!slot) return fail('친구는 지금이 가장 많아요');
  if (level() < slot.lv) return fail(`레벨 ${slot.lv}부터 데려올 수 있어요`);
  if (!name) return fail('친구 이름을 지어 주세요');
  if (s.coins < slot.price) return fail('코인이 모자라요');
  s.coins -= slot.price;
  const pet = { id: s.nextPet++, species, name, love: 0, wear: {} };
  s.pets.push(pet);
  syncPets();
  emit('adopt', pet);
  return pet.id;
}

export function renamePet(id, name) {
  name = name.trim().slice(0, PET_NAME_MAX);
  if (!name) return fail('이름을 적어 주세요');
  petById(id).name = name;
  return true;
}

export function setSpecies(id, species) {
  petById(id).species = species;
  emit('wear');
}

// 옷을 입히거나 벗긴다. 없는 옷은 사서 입힌다. 산 옷은 모든 친구가 같이 입을 수 있다.
export function wear(petId, itemId) {
  const s = G.state, pet = petById(petId), item = WEAR[itemId];
  if (!s.closet.includes(itemId)) {
    if (s.coins < item.price) return fail('코인이 모자라요');
    s.coins -= item.price;
    s.closet.push(itemId);
  }
  if (pet.wear[item.slot] === itemId) delete pet.wear[item.slot];
  else pet.wear[item.slot] = itemId;
  emit('wear');
  return true;
}

// ───── 요리 ─────

export function startCook(stoveId, recipeId) {
  const s = G.state, st = itemById(stoveId), r = recipeOf(recipeId);
  if (!st || st.cook) return fail('이 화구는 이미 요리 중이에요');
  if (r.lv > level()) return fail(`레벨 ${r.lv}에 열려요`);
  const cost = costOf(r);
  if (s.coins < cost) return fail('코인이 모자라요');
  s.coins -= cost;
  const now = Date.now();
  st.cook = { r: r.id, start: now, end: now + r.time * STOVE_SPEED[st.lv - 1] * 1000 };
  if (s.tut === 0) s.tut = 1;
  emit('cook');
  return true;
}

export function collect(stoveId) {
  const s = G.state, st = itemById(stoveId);
  if (!st || cookState(st) !== 'done') return false;
  const r = recipeOf(st.cook.r);
  s.stock[r.id] = (s.stock[r.id] || 0) + r.n;
  s.stats.cooked++;
  st.cook = null;
  if (s.tut === 1) s.tut = 2;
  G.world.floats.push({ kind: 'food', icon: r.icon, n: r.n, x: st.x, y: st.y - 0.8, t: 0 });
  emit('collect', r);
  addXp(r.xp);
  return true;
}

// ───── 나만의 메뉴 ─────

// 새로 만들거나(id 없음) 고친다. 성공하면 메뉴 id.
export function saveCustom({ id, name, tier, px }) {
  const s = G.state;
  name = name.trim().slice(0, CUSTOM_NAME_MAX);
  if (!name) return fail('메뉴 이름을 적어 주세요');
  if (!validIcon(px) || px.join('').replace(/\./g, '').length < 12) return fail('그림을 조금 더 그려 주세요');
  if (CUSTOM_TIERS[tier].lv > level()) return fail(`${CUSTOM_TIERS[tier].name} 등급은 레벨 ${CUSTOM_TIERS[tier].lv}부터 쓸 수 있어요`);
  let c = s.custom.find(c => c.id === id);
  if (!c) {
    if (s.custom.length >= MAX_CUSTOM) return fail(`나만의 메뉴는 ${MAX_CUSTOM}개까지 만들 수 있어요`);
    c = { id: `c${s.nextCustom++}` };
    s.custom.push(c);
  }
  Object.assign(c, { name, tier, px: [...px] });
  customCache = null;
  emit('custom', c.id);
  return c.id;
}

export function deleteCustom(id) {
  const s = G.state, w = G.world;
  if (stoves().some(st => st.cook?.r === id)) return fail('요리 중인 메뉴는 지울 수 없어요');
  // 이 메뉴를 먹던 손님은 계산하고, 기다리던 손님은 다른 메뉴를 고른다.
  for (const c of w.customers) if (c.order === id && c.state === 'eat') { pay(c); leave(c); }
  s.custom = s.custom.filter(c => c.id !== id);
  delete s.stock[id];
  customCache = null;
  for (const c of w.customers) if (c.order === id && (c.state === 'in' || c.state === 'wait')) c.order = pickOrder();
  emit('custom', id);
  return true;
}

// ───── 꾸미기 ─────

// group: 가구 목록에서 보고 있는 분류, pending: 구매 확정을 기다리는 것(아래 '구매 확정' 참고)
export function enterEdit() {
  G.edit = { tab: 'furn', group: Object.keys(FURN_GROUPS)[0], place: null, floor: null, sel: null, pending: null, dirty: false };
  if (G.state.tut === 3) G.state.tut = 4;
}

export function exitEdit() {
  const dirty = G.edit.dirty;
  G.edit = null;
  if (dirty) {
    // 배치가 바뀌면 길이 달라지므로 손님을 내보낸다. 먹던 손님은 계산하고 나간다.
    const w = G.world;
    for (const c of w.customers) if (c.state === 'eat') pay(c);
    w.customers = [];
    for (const p of w.pets) {
      const pos = nearestFree(Math.round(p.x), Math.round(p.y));
      Object.assign(p, { x: pos.x, y: pos.y, path: [], state: 'idle', t: 1, target: null });
    }
  }
  save();
}

function placeError(type, x, y) {
  if (!inBounds(x, y)) return '가게 밖에는 놓을 수 없어요';
  if (itemAt(x, y)) return '이미 가구가 있는 칸이에요';
  if (FURN[type].block && x === G.state.door && y === 0) return '문 앞은 비워 둬야 해요';
  return null;
}

const stoveLimitError = type => (type === 'stove' && stoves().length >= stoveLimit(level())
  ? `화구는 지금 ${stoveLimit(level())}개까지 놓을 수 있어요` : null);

function place(type, x, y) {
  const s = G.state, f = FURN[type];
  const err = placeError(type, x, y) || stoveLimitError(type);
  if (err) return fail(err);
  if (s.inv[type] > 0) s.inv[type]--;
  else if (s.coins >= f.price) s.coins -= f.price;
  else return fail('코인이 모자라요');
  s.items.push({ id: s.nextId++, type, x, y, ...(type === 'stove' ? { lv: 1, cook: null } : {}) });
  G.edit.dirty = true;
  emit('place');
  return true;
}

export function moveItem(id, x, y) {
  const it = itemById(id);
  const err = placeError(it.type, x, y);
  if (err) return fail(err);
  it.x = x; it.y = y;
  G.edit.dirty = true;
  emit('place');
  return true;
}

export function storeItem(id) {
  const s = G.state, it = itemById(id);
  if (it.type === 'stove') return fail('화구는 옮기기만 할 수 있어요');
  s.items = s.items.filter(i => i !== it);
  s.inv[it.type] = (s.inv[it.type] || 0) + 1;
  G.edit.sel = null;
  G.edit.dirty = true;
  return true;
}

export const upgradeCost = st => STOVE_UPGRADE_COST[st.lv - 1] ?? null;
const upgradeError = st => (upgradeCost(st) == null ? '더 강화할 수 없어요' : G.state.coins < upgradeCost(st) ? '코인이 모자라요' : null);
function upgradeStove(id) {
  const st = itemById(id), err = upgradeError(st);
  if (err) return fail(err);
  G.state.coins -= upgradeCost(st);
  st.lv++;
  emit('place');
  return true;
}

function paintFloor(x, y, id) {
  const s = G.state, f = FLOORS[id], i = y * cols() + x;
  if (!inBounds(x, y) || s.floor[i] === id) return false;
  if (s.coins < f.price) return fail('코인이 모자라요');
  s.coins -= f.price;
  s.floor[i] = id;
  return true;
}

function setWall(id) {
  const s = G.state, w = WALLS[id];
  if (!s.walls.includes(id)) {
    if (s.coins < w.price) return fail('코인이 모자라요');
    s.coins -= w.price;
    s.walls.push(id);
    emit('place');
  }
  s.wall = id;
  return true;
}

// 벽 액자의 사진. 작게 줄인 PNG를 글(data URL)로 저장한다. null이면 기본 그림.
// 백업 코드로도 들어오는 값이라, 화면에 그대로 넣어도 되는 글자만 받는다.
export const validPhoto = v => typeof v === 'string' && v.length <= PHOTO_MAX_CHARS && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(v);
export function setPhoto(photo) {
  if (photo !== null && !validPhoto(photo)) return fail('이 사진은 쓸 수 없어요');
  G.state.photo = photo;
  save();
  return true;
}

// 넓히기. 위·아래는 줄 수(EXPANSIONS), 왼쪽·오른쪽은 칸 수(WIDENINGS)가 늘어난다.
// 위나 왼쪽으로 넓히면 새 칸이 앞에 끼어들므로, 있던 가구와 문을 한 칸씩 밀어 제자리를 지킨다.
const tall = dir => dir === 'up' || dir === 'down';
export const expandCfg = dir => (tall(dir) ? EXPANSIONS[G.state.rows] : WIDENINGS[G.state.cols]) || null;
function expandError(dir) {
  const cfg = expandCfg(dir);
  if (!cfg) return tall(dir) ? '위아래로는 더 넓힐 수 없어요' : '옆으로는 더 넓힐 수 없어요';
  if (level() < cfg.lv) return `레벨 ${cfg.lv}부터 넓힐 수 있어요`;
  return G.state.coins < cfg.price ? '코인이 모자라요' : null;
}
function expand(dir) {
  const s = G.state, err = expandError(dir);
  if (err) return fail(err);
  s.coins -= expandCfg(dir).price;
  const C = s.cols, dx = dir === 'left' ? 1 : 0, dy = dir === 'up' ? 1 : 0;
  if (tall(dir)) {
    const row = Array(C).fill('wood');
    s.floor = dy ? [...row, ...s.floor] : [...s.floor, ...row];
    s.rows++;
  } else {
    const floor = [];
    for (let y = 0; y < s.rows; y++) {
      const row = s.floor.slice(y * C, (y + 1) * C);
      floor.push(...(dx ? ['wood', ...row] : [...row, 'wood']));
    }
    s.floor = floor;
    s.cols++;
    s.door += dx;
  }
  for (const it of s.items) { it.x += dx; it.y += dy; }
  for (const p of G.world.pets) Object.assign(p, { x: Math.round(p.x) + dx, y: Math.round(p.y) + dy, path: [], state: 'idle', target: null });
  G.edit.dirty = true; // 나갈 때 손님을 내보내고 길을 다시 잡는다
  emit('place');
  emit('resize');
  return true;
}

// ───── 구매 확정 ─────

// 꾸미기에서 돈이 드는 일은 바로 하지 않고 G.edit.pending에 올려 둔다. 화면이 그 모습을 미리 보여 주고,
// 플레이어가 구매 확정을 눌러야 confirmPending()이 실제로 산다. 돈이 안 드는 일(보관한 가구, 무료 바닥, 가진 벽지)은 바로 한다.
// pending: {kind:'furn', type, x, y} | {kind:'floor', id, tiles:[칸 번호]} | {kind:'wall', id} | {kind:'expand'} | {kind:'upgrade', id}

export function askPlace(type, x, y) {
  const s = G.state;
  if (s.inv[type] > 0) return place(type, x, y);
  const err = placeError(type, x, y) || stoveLimitError(type) || (s.coins < FURN[type].price ? '코인이 모자라요' : null);
  if (err) return fail(err);
  G.edit.pending = { kind: 'furn', type, x, y };
  return true;
}

// 칠할 칸을 하나씩 모은다. 모은 칸 값이 가진 코인을 넘으면 더 모으지 않는다.
export function askPaint(x, y, id) {
  const s = G.state, e = G.edit, f = FLOORS[id], i = y * cols() + x;
  if (!inBounds(x, y) || s.floor[i] === id) return false;
  if (!f.price) return paintFloor(x, y, id);
  const p = e.pending?.kind === 'floor' && e.pending.id === id ? e.pending : { kind: 'floor', id, tiles: [] };
  if (p.tiles.includes(i)) return false;
  if ((p.tiles.length + 1) * f.price > s.coins) return fail('코인이 모자라요');
  p.tiles.push(i);
  e.pending = p;
  return true;
}

export function askWall(id) {
  const s = G.state;
  G.edit.pending = null;
  if (s.walls.includes(id)) return setWall(id);
  if (s.coins < WALLS[id].price) return fail('코인이 모자라요');
  G.edit.pending = { kind: 'wall', id };
  return true;
}

export function askExpand(dir) {
  const err = expandError(dir);
  if (err) return fail(err);
  G.edit.pending = { kind: 'expand', dir };
  return true;
}

export function askUpgrade(id) {
  const err = upgradeError(itemById(id));
  if (err) return fail(err);
  G.edit.pending = { kind: 'upgrade', id };
  return true;
}

// 올려 둔 것의 이름과 값. 없으면 null.
export function pendingInfo() {
  const p = G.edit?.pending;
  if (!p) return null;
  switch (p.kind) {
    case 'furn': return { name: FURN[p.type].name, cost: FURN[p.type].price };
    case 'floor': return { name: `${FLOORS[p.id].name} ${p.tiles.length}칸`, cost: FLOORS[p.id].price * p.tiles.length };
    case 'wall': return { name: WALLS[p.id].name, cost: WALLS[p.id].price };
    case 'expand': return { name: `${EXPAND_DIRS[p.dir]} 한 줄 넓히기`, cost: expandCfg(p.dir).price };
    default: return { name: `화구 ${itemById(p.id).lv + 1}단계로 강화`, cost: upgradeCost(itemById(p.id)) };
  }
}

export function confirmPending() {
  const p = G.edit.pending;
  G.edit.pending = null;
  switch (p.kind) {
    case 'furn': return place(p.type, p.x, p.y);
    case 'floor':
      for (const i of p.tiles) paintFloor(i % cols(), Math.floor(i / cols()), p.id);
      emit('place');
      return true;
    case 'wall': return setWall(p.id);
    case 'expand': return expand(p.dir);
    default: return upgradeStove(p.id);
  }
}

// ───── 시간 ─────

// 장사는 게임 화면이 켜져 있는 동안에만 한다. 화면을 끄면 이 함수가 불리지 않아서 손님도 판매도 멈춘다.
// (요리는 끝나는 시각을 적어 두므로 꺼 둔 동안에도 익는다)
export function tick(dt) {
  const w = G.world;
  w.time += dt;
  for (const f of w.floats) f.t += dt;
  w.floats = w.floats.filter(f => f.t < 1.2);
  if (G.edit || !G.state.started) return;
  w.spawnT -= dt;
  if (w.spawnT <= 0) {
    w.spawnT = spawnInterval() * (0.7 + Math.random() * 0.6);
    trySpawn();
  }
  updateCustomers(dt);
  for (const p of w.pets) updatePet(p, dt);
}
