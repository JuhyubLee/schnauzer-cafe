// 놀러 가기: 서버 없이 '초대장'을 주고받아 서로의 가게를 구경한다.
// 초대장은 가게 모습만 담은 글(코드)이고, 주소 뒤에 붙여 링크로 보낸다.
// 코인, 재고, 의견은 담지 않는다. 받은 초대장은 남이 만든 글이므로 하나하나 검사해서 쓴다.
import { G, level, enterVisit, leaveVisit, save, MAX_ROWS, MAX_COLS } from './game.js';
import {
  RECIPES, CUSTOM_TIERS, MAX_CUSTOM, CUSTOM_NAME_MAX, FURN, FLOORS, WALLS, PETS, PET_SLOTS, PET_NAME_MAX,
  WEAR, START_ROWS, START_COLS, START_DOOR, LEVEL_XP, VISIT_GIFT, GIFTS_PER_DAY, STOVE_SPEED, SITE_URL,
} from './data.js';
import { validIcon } from './sprites.js';
import { mirror } from './device.js';

const FRIENDS_KEY = 'schnauzer-cafe-friends'; // 내 가게 저장과 따로 둔다(백업 코드에도 안 들어간다)
const MAX_FRIENDS = 12;
const MAX_CODE = 20000; // 초대장 글자 수 한도
const MAX_BYTES = 200000; // 압축을 푼 크기 한도
const SHOP_NAME_MAX = 12;
const has = Object.hasOwn;
const int = Number.isInteger;

// ───── 글자 ↔ 바이트 ─────

const toB64 = bytes => {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64 = text => Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), ch => ch.charCodeAt(0));

async function through(bytes, stream) {
  const reader = new Blob([bytes]).stream().pipeThrough(stream).getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_BYTES) { await reader.cancel(); throw new Error('too big'); }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.length; }
  return out;
}

// ───── 초대장 만들기 ─────

// 내 가게의 겉모습만 추린다. 구경 중에는 부르지 않는다.
export function makeSnapshot() {
  const s = G.state;
  return {
    s: friends().me,
    n: s.shopName,
    l: level(),
    r: s.rows,
    k: s.cols,
    d: s.door,
    w: s.wall,
    f: s.floor,
    i: s.items.map(it => (it.type === 'stove' ? [it.type, it.x, it.y, it.lv] : [it.type, it.x, it.y])),
    p: s.pets.map(p => [p.species, p.name, p.wear.hat || '', p.wear.neck || '', p.wear.body || '']),
    c: s.custom.map(c => [c.name, c.tier, c.px.join('')]),
  };
}

// 초대장 글: 'V1.' + 압축한 것, 압축을 못 하는 브라우저면 'V0.' + 그대로
export async function encode(snap) {
  const bytes = new TextEncoder().encode(JSON.stringify(snap));
  if (typeof CompressionStream === 'undefined') return 'V0.' + toB64(bytes);
  return 'V1.' + toB64(await through(bytes, new CompressionStream('deflate-raw')));
}

// 앱 안에서는 주소가 달라서, 초대장은 항상 웹 주소로 만든다.
export const inviteLink = code => `${SITE_URL}#visit=${code}`;

// 붙여 넣은 글이나 주소에서 초대장 부분만 찾는다.
export const codeFromText = text => (String(text).match(/V[01]\.[A-Za-z0-9_-]+/) || [null])[0];

// ───── 초대장 읽기 ─────

// 초대장 글 → 검사를 통과한 가게 모습. 읽을 수 없으면 null.
export async function decode(code) {
  try {
    if (typeof code !== 'string' || code.length > MAX_CODE || !/^V[01]\./.test(code)) return null;
    let bytes = fromB64(code.slice(3));
    if (code[1] === '1') bytes = await through(bytes, new DecompressionStream('deflate-raw'));
    if (bytes.length > MAX_BYTES) return null;
    return sanitize(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

// 남이 보낸 값이라 아는 것만 골라 새로 만든다. 하나라도 이상하면 null.
function sanitize(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const str = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
  const sid = typeof raw.s === 'string' && /^[a-z0-9]{6,24}$/.test(raw.s) ? raw.s : null;
  const name = str(raw.n, SHOP_NAME_MAX);
  if (!sid || !name) return null;
  if (!int(raw.l) || raw.l < 1 || raw.l > LEVEL_XP.length) return null;
  if (!int(raw.r) || raw.r < START_ROWS || raw.r > MAX_ROWS) return null;
  // 가로 칸 수(k)와 문 자리(d)가 없는 초대장은 옆으로 넓히기가 생기기 전에 만든 것이다.
  const cols = raw.k ?? START_COLS, door = raw.d ?? START_DOOR;
  if (!int(cols) || cols < START_COLS || cols > MAX_COLS || !int(door) || door < 0 || door >= cols) return null;
  if (!has(WALLS, raw.w)) return null;
  if (!Array.isArray(raw.f) || raw.f.length !== raw.r * cols || !raw.f.every(f => has(FLOORS, f))) return null;

  if (!Array.isArray(raw.i) || raw.i.length > raw.r * cols) return null;
  const taken = new Set(), items = [];
  for (const it of raw.i) {
    if (!Array.isArray(it)) return null;
    const [type, x, y, lv = 1] = it;
    if (!has(FURN, type) || !int(x) || !int(y) || x < 0 || x >= cols || y < 0 || y >= raw.r) return null;
    if (type === 'stove' && !(STOVE_SPEED[lv - 1] > 0)) return null;
    if (taken.has(y * cols + x) || (FURN[type].block && x === door && y === 0)) return null;
    taken.add(y * cols + x);
    items.push(type === 'stove' ? [type, x, y, lv] : [type, x, y]);
  }

  if (!Array.isArray(raw.p) || raw.p.length < 1 || raw.p.length > PET_SLOTS.length) return null;
  const pets = [];
  for (const p of raw.p) {
    if (!Array.isArray(p)) return null;
    const [species, petName, hat, neck, body] = p;
    const worn = { hat, neck, body };
    if (!has(PETS, species) || !str(petName, PET_NAME_MAX)) return null;
    for (const [slot, id] of Object.entries(worn)) if (id !== '' && !(has(WEAR, id) && WEAR[id].slot === slot)) return null;
    pets.push([species, str(petName, PET_NAME_MAX), hat, neck, body]);
  }

  if (!Array.isArray(raw.c) || raw.c.length > MAX_CUSTOM) return null;
  const custom = [];
  for (const c of raw.c) {
    if (!Array.isArray(c)) return null;
    const [menu, tier, px] = c;
    const rows = typeof px === 'string' && px.length === 256 ? px.match(/.{16}/g) : null;
    if (!str(menu, CUSTOM_NAME_MAX) || !has(CUSTOM_TIERS, tier) || !validIcon(rows)) return null;
    custom.push([str(menu, CUSTOM_NAME_MAX), tier, px]);
  }
  return { s: sid, n: name, l: raw.l, r: raw.r, k: cols, d: door, w: raw.w, f: [...raw.f], i: items, p: pets, c: custom };
}

// ───── 다녀온 가게 목록, 방문 선물 ─────

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

let cache = null;
// { me: 내 가게 표시, list: [{sid, name, lv, code, got(받은 날), gift(선물 받은 날)}], day, gifts(오늘 받은 선물 수) }
export function friends() {
  if (cache) return cache;
  let f = null;
  try { f = JSON.parse(localStorage.getItem(FRIENDS_KEY)); } catch { /* 깨졌으면 새로 만든다 */ }
  cache = f && typeof f.me === 'string' && Array.isArray(f.list) ? f : { me: '', list: [], day: '', gifts: 0 };
  if (!/^[a-z0-9]{6,24}$/.test(cache.me)) {
    cache.me = Array.from(crypto.getRandomValues(new Uint8Array(8)), b => (b % 36).toString(36)).join('');
    store();
  }
  return cache;
}
function store() {
  const json = JSON.stringify(cache);
  try { localStorage.setItem(FRIENDS_KEY, json); } catch { /* 저장 공간이 막힌 브라우저 */ }
  mirror(FRIENDS_KEY, json);
}

// 받은 초대장을 목록 맨 위에 적어 둔다. 같은 가게면 새 모습으로 바꾼다. 내 가게 초대장은 적지 않는다.
export function rememberFriend(snap, code) {
  const f = friends();
  if (snap.s === f.me) return;
  const old = f.list.find(e => e.sid === snap.s);
  const d = new Date();
  f.list = [
    { sid: snap.s, name: snap.n, lv: snap.l, code, got: `${d.getMonth() + 1}/${d.getDate()}`, gift: old ? old.gift : '' },
    ...f.list.filter(e => e.sid !== snap.s),
  ].slice(0, MAX_FRIENDS);
  store();
}

export function forgetFriend(sid) {
  const f = friends();
  f.list = f.list.filter(e => e.sid !== sid);
  store();
}

// ───── 구경하기 ─────

// 초대장의 가게 모습으로, 게임이 굴릴 수 있는 임시 가게를 만든다.
function shopFrom(snap) {
  const custom = snap.c.map(([name, tier, px], i) => ({ id: `v${i + 1}`, name, tier, px: px.match(/.{16}/g) }));
  const stock = {};
  // 구경하는 동안 손님이 오가도록 그 가게 레벨에 맞는 메뉴를 넉넉히 채워 둔다.
  for (const r of RECIPES) if (r.lv <= snap.l) stock[r.id] = 99;
  for (const c of custom) if (CUSTOM_TIERS[c.tier].lv <= snap.l) stock[c.id] = 99;
  const home = G.state;
  return {
    v: 1, started: true, shopName: snap.n,
    coins: 0, xp: LEVEL_XP[snap.l - 1], rows: snap.r, cols: snap.k, door: snap.d,
    items: snap.i.map(([type, x, y, lv], i) => ({ id: i + 1, type, x, y, ...(type === 'stove' ? { lv, cook: null } : {}) })),
    nextId: snap.i.length + 1,
    floor: [...snap.f], wall: snap.w, walls: [snap.w],
    inv: {}, stock,
    pets: snap.p.map(([species, name, hat, neck, body], i) => {
      const wear = {};
      if (hat) wear.hat = hat;
      if (neck) wear.neck = neck;
      if (body) wear.body = body;
      return { id: i + 1, species, name, love: 0, wear };
    }),
    nextPet: snap.p.length + 1, closet: [],
    custom, nextCustom: custom.length + 1,
    notes: [], tut: 4, sound: home.sound, music: home.music,
    stats: { sold: 0, cooked: 0 },
  };
}

export function startVisit(snap) {
  enterVisit(shopFrom(snap), { name: snap.n, sid: snap.s, mine: snap.s === friends().me });
}

// 내 가게로 돌아온다. 방문 선물을 받았으면 그 코인 수, 아니면 0.
// 선물은 가게마다 하루 한 번, 하루에 GIFTS_PER_DAY번까지. 내 가게가 아직 없으면 받지 않는다.
export function endVisit() {
  const visit = G.visit;
  if (!visit) return 0;
  leaveVisit();
  const f = friends(), day = today();
  const entry = f.list.find(e => e.sid === visit.sid);
  if (f.day !== day) { f.day = day; f.gifts = 0; }
  const gift = !visit.mine && G.state.started && entry && entry.gift !== day && f.gifts < GIFTS_PER_DAY;
  if (gift) {
    entry.gift = day;
    f.gifts++;
    G.state.coins += VISIT_GIFT;
    save();
  }
  store();
  return gift ? VISIT_GIFT : 0;
}
