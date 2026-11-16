// 게임 상태와 규칙. 화면(DOM, canvas)은 모른다. 바뀐 일은 on()으로 알린다.
import {
  RECIPE, CUSTOM_TIERS, MAX_CUSTOM, CUSTOM_NAME_MAX, FURN, FURN_GROUPS, FLOORS, WALLS,
  PETS, PET_SLOTS, PET_NAME_MAX, WEAR, START_ROWS, START_COLS, START_DOOR, EXPANSIONS, WIDENINGS, EXPAND_DIRS,
  STOVE_SPEED, STOVE_UPGRADE_COST, PHOTO_MAX_CHARS, TREATS, TREATS_PER_DAY, SHOP_TYPES, FIRST_SHOP, SHOP_RECIPES, SHOP_NAME_MAX,
  MANAGER_RATE, STAY_REST, REGULAR_EVERY, levelOf, stoveLimit, onSale, bondOf, dayKey, shopOf, furnIn, stayRounds, regularGift,
} from './data.js';
import { CUSTOMER_LOOKS, validIcon } from './sprites.js';
import { mirror } from './device.js';
import { bump } from './daily.js';
import { through } from './bytes.js';

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
export const emit = (evt, data) => { for (const fn of listeners[evt] || []) fn(data); };
const fail = msg => { emit('toast', msg); return false; };
const rand = n => Math.floor(Math.random() * n);

// 새 가게 하나의 값(아래 SHOP_FIELDS): 만드는 기구 하나, 화분, 손님 자리(테이블 두 벌이나 옷걸이 둘), 100코인.
function freshShop(type, shopName) {
  let id = 1;
  const it = (kind, x, y, extra) => ({ id: id++, type: kind, x, y, ...extra });
  return {
    type, shopName,
    coins: 100, xp: 0, rows: START_ROWS, cols: START_COLS, door: START_DOOR,
    items: [
      it('stove', 1, 0, { lv: 1, cook: null }), it('plant', 0, 0),
      ...(SHOP_TYPES[type].stand
        ? [it('rack', 2, 2), it('rack', 5, 4)]
        : [it('table', 2, 2), it('stool', 1, 2), it('stool', 3, 2), it('table', 5, 4), it('stool', 4, 4), it('stool', 6, 4)]),
    ],
    nextId: id,
    floor: Array(START_ROWS * START_COLS).fill('wood'),
    wall: 'cream', stock: {},
    custom: [], nextCustom: 1,
    photo: null,
    share: false, // 가게 모습을 서버에 올려 최신 모습을 보여 줄지. 가게 번호(sid)와 열쇠(skey)는 visit.js가 처음 쓸 때 채운다
    stats: { sold: 0, cooked: 0 },
    tut: 4, // 첫 가게만 0에서 시작해 안내를 보여 준다
  };
}

function freshState() {
  return {
    v: 1, started: false, ...freshShop(FIRST_SHOP, ''), tut: 0,
    walls: ['cream'], inv: {},
    pets: [], nextPet: 1, closet: [],
    notes: [],
    sound: true, music: true, dim: true,
    song: 'auto', // 배경 노래(data.js의 SONG_CHOICES)
    stamps: 0, daily: null, // 도장 수와 오늘의 주문(daily.js)
    others: [], // 다른 가게들(아래 '가게 여러 개')
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
  s.share ??= false;
  s.stamps ??= 0;
  s.daily ??= null;
  s.song ??= 'auto';
  s.type ??= FIRST_SHOP;
  s.others = Array.isArray(s.others) ? s.others.filter(o => o && typeof o === 'object') : [];
  // 점장으로 가 있던 가게가 저장에 없으면 데려온다
  for (const p of s.pets) if (p.post !== undefined && p.post !== s.type && !s.others.some(o => o.type === p.post)) delete p.post;
  delete s.lastSeen; // 자리를 비운 동안 팔던 때 쓰던 값
  return s;
}

function freshWorld() {
  G.world = { customers: [], nextCid: 1, spawnT: 2, time: 0, floats: [], pets: [] };
  syncPets();
}

// 지금 가게에 있는 친구인지. 점장으로 한 가게를 맡은 친구(pet.post)는 그 가게에만 있고, 나머지는 나를 따라다닌다.
export const isHere = pet => !pet.post || pet.post === G.state.type;

// 지금 가게에 있는 친구마다 가게 안을 돌아다니는 몸을 하나씩 둔다.
function syncPets() {
  const w = G.world;
  w.pets = G.state.pets.filter(isHere).map((pet, i) => {
    const old = w.pets.find(p => p.id === pet.id);
    if (old) return old;
    const pos = nearestFree(4 - i, 1);
    return {
      id: pet.id, x: pos.x, y: pos.y, path: [], state: 'idle', t: 1.5 + i * 0.7,
      dir: 1, up: false, walk: 0, boost: 0, target: null, think: i * 0.15, petCd: 0,
      gift: 0, giftT: 90 + Math.random() * 120, // 물어 온 선물(코인 수)과 다음 선물까지 남은 시간(초)
      joy: 0, wag: 0, spin: 0, eat: null, // 기쁜 얼굴·꼬리 흔들기·제자리 돌기가 남은 시간(초), 먹고 있는 간식 { icon, t, fav }
    };
  });
}

// ───── 가게 여러 개 ─────
// G.state의 맨 위에는 지금 연 가게의 값이 있고, 다른 가게는 state.others에 { type, shopName, coins, … } 모양으로 있다.
// 아래가 가게마다 따로 있는 값이다. 나머지(친구, 옷장, 도장, 보관함, 설정)는 모든 가게가 같이 쓴다.
const SHOP_FIELDS = [
  'type', 'shopName', 'coins', 'xp', 'rows', 'cols', 'door', 'items', 'nextId', 'floor', 'wall', 'stock',
  'custom', 'nextCustom', 'photo', 'stats', 'tut', 'share', 'sid', 'skey', 'regulars',
];
const has = Object.hasOwn;

// s의 맨 위 가게와 others에 있는 type 가게를 서로 바꿔 끼운다.
function rotate(s, type) {
  const other = s.others.find(o => o.type === type);
  for (const k of SHOP_FIELDS) {
    const mine = s[k];
    if (other[k] === undefined) delete s[k]; else s[k] = other[k];
    if (mine === undefined) delete other[k]; else other[k] = mine;
  }
}

// 저장에 쓰는 모양: 언제나 첫 가게(분식)가 맨 위에 있고, 열려 있던 가게는 open에 적는다.
// 다른 가게를 모르는 예전 버전이 이 저장을 읽어도 분식을 그대로 돌리고 others는 건드리지 않는다.
// 첫 가게가 열려 있으면 s 그대로, 아니면 s를 고치지 않고 사본을 돌려준다.
function pack(s) {
  if (s.type === FIRST_SHOP) return s;
  const copy = { ...s, others: s.others.map(o => ({ ...o })), open: s.type };
  rotate(copy, FIRST_SHOP);
  return copy;
}

// 저장에서 읽은 것을 게임이 쓰는 모양으로: open에 적힌 가게를 맨 위로 올린다.
// 이 버전이 모르는 종류의 가게면 그대로 둔다(분식이 열리고, open과 그 가게는 저장에 남는다).
function unpack(s) {
  if (!has(SHOP_TYPES, s.open) || !s.others.some(o => o.type === s.open)) return s;
  rotate(s, s.open);
  delete s.open;
  return s;
}

// ───── 저장 ─────

// 지금 상태를 저장에 쓰는 글(JSON)로 바꾼다.
export const saveText = () => JSON.stringify(pack(G.state));

// 저장하고, 저장한 글(JSON)을 돌려준다.
// 구경 중에는 state가 남의 가게라서 절대 저장하지 않는다. (저장하면 내 가게가 덮인다)
export function save() {
  if (G.visit) return null;
  const json = saveText();
  try { localStorage.setItem(SAVE_KEY, json); } catch { /* 저장 공간이 막힌 브라우저 */ }
  mirror(SAVE_KEY, json);
  return json;
}

export function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { /* 깨진 저장은 버린다 */ }
  G.state = s && s.v === 1 ? unpack(upgrade(s)) : freshState();
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

const BACKUP_PREFIX = 'CAFE1:'; // 저장 글을 그대로 base64로 바꾼 것
const PACKED_PREFIX = 'CAFE2:'; // 저장 글을 압축(deflate-raw)한 뒤 base64로 바꾼 것. 읽기만 하고, 아직 이 모양으로 내지는 않는다
const MAX_BACKUP_BYTES = 400000; // 압축을 푼 저장 글의 크기 한도
export const MAX_ROWS = START_ROWS + Object.keys(EXPANSIONS).length;
export const MAX_COLS = START_COLS + Object.keys(WIDENINGS).length;
const int = Number.isInteger;
const obj = v => !!v && typeof v === 'object';

// 가게 하나의 값이 이 게임이 읽을 수 있는 모양인지 본다.
function usableShop(s) {
  const recipe = id => has(RECIPE, id) || s.custom.some(c => c.id === id);
  return has(SHOP_TYPES, s.type) && typeof s.shopName === 'string'
    && int(s.coins) && s.coins >= 0 && int(s.xp) && s.xp >= 0 && int(s.nextId) && int(s.nextCustom)
    && int(s.rows) && s.rows >= START_ROWS && s.rows <= MAX_ROWS
    && int(s.cols) && s.cols >= START_COLS && s.cols <= MAX_COLS && int(s.door) && s.door >= 0 && s.door < s.cols
    && Array.isArray(s.floor) && s.floor.length === s.rows * s.cols && s.floor.every(f => has(FLOORS, f))
    && has(WALLS, s.wall) && (s.photo === null || validPhoto(s.photo)) && typeof s.share === 'boolean'
    && (s.sid === undefined || /^[a-z0-9]{6,24}$/.test(s.sid)) && (s.skey === undefined || /^[a-f0-9]{32}$/.test(s.skey))
    && obj(s.stock) && obj(s.stats) && (s.regulars === undefined || (int(s.regulars) && s.regulars >= 0))
    && Array.isArray(s.custom) && s.custom.length <= MAX_CUSTOM && s.custom.every(c => obj(c)
      && /^c\d+$/.test(c.id) && typeof c.name === 'string' && has(CUSTOM_TIERS, c.tier) && validIcon(c.px))
    && Array.isArray(s.items) && s.items.every(i => obj(i) && has(FURN, i.type)
      && int(i.x) && int(i.y) && i.x >= 0 && i.x < s.cols && i.y >= 0 && i.y < s.rows
      && (i.type !== 'stove' || (STOVE_SPEED[i.lv - 1] > 0 && (!i.cook || recipe(i.cook.r)))));
}

// 붙여 넣은 백업(저장에 쓰는 모양)이 이 게임이 읽을 수 있는 모양인지 본다. 잘린 코드나 엉뚱한 글을 걸러 낸다.
// others에는 종류마다 가게가 하나씩만 있어야 한다. 이 버전이 모르는 종류의 가게는 들여다보지 않고 그대로 간직한다
// (그 가게를 아는 버전으로 올린 뒤에 다시 열린다).
function usable(s) {
  return obj(s) && s.v === 1 && s.type === FIRST_SHOP && usableShop(s)
    && s.others.length <= 8 && s.others.every((o, i) => typeof o.type === 'string' && o.type !== s.type
      && s.others.findIndex(p => p.type === o.type) === i && (!has(SHOP_TYPES, o.type) || usableShop(o)))
    && (s.open === undefined || s.others.some(o => o.type === s.open))
    && int(s.nextPet) && Array.isArray(s.walls) && Array.isArray(s.notes) && typeof s.song === 'string' && obj(s.inv)
    && Array.isArray(s.closet) && s.closet.every(id => has(WEAR, id))
    && int(s.stamps) && s.stamps >= 0 && (s.daily === null || obj(s.daily))
    && Array.isArray(s.pets) && s.pets.length >= 1 && s.pets.length <= PET_SLOTS.length && s.pets.every(p => obj(p)
      && int(p.id) && has(PETS, p.species) && typeof p.name === 'string' && int(p.love) && obj(p.wear)
      && (p.post === undefined || typeof p.post === 'string')
      && Object.entries(p.wear).every(([slot, id]) => has(WEAR, id) && WEAR[id].slot === slot));
}

const toBase64 = bytes => {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};
const MAX_PLAIN_CODE = 9000; // 이보다 긴 백업 코드는 압축한다(카톡 한 번에 1만 자까지 붙는다)

// 백업 코드. 가게가 하나이고 짧으면 예전 버전도 읽는 CAFE1 모양으로, 가게가 여럿이거나 길면 압축한 CAFE2 모양으로 낸다.
export async function exportSave() {
  const bytes = new TextEncoder().encode(saveText());
  const plain = BACKUP_PREFIX + toBase64(bytes);
  if ((!G.state.others.length && plain.length <= MAX_PLAIN_CODE) || typeof CompressionStream === 'undefined') return plain;
  return PACKED_PREFIX + toBase64(await through(bytes, new CompressionStream('deflate-raw'), MAX_BACKUP_BYTES));
}

// 백업 코드 → 검사를 통과한 저장. 읽을 수 없으면 null.
async function decodeBackup(code) {
  try {
    const packed = code.startsWith(PACKED_PREFIX);
    if (!packed && !code.startsWith(BACKUP_PREFIX)) return null;
    let bytes = Uint8Array.from(atob(code.slice(BACKUP_PREFIX.length)), ch => ch.charCodeAt(0));
    if (packed) bytes = await through(bytes, new DecompressionStream('deflate-raw'), MAX_BACKUP_BYTES);
    const s = JSON.parse(new TextDecoder().decode(bytes));
    return s && s.v === 1 && usable(upgrade(s)) ? s : null;
  } catch {
    return null;
  }
}

// 백업 코드로 가게를 통째로 바꾼다. 성공하면 저장까지 하고 true.
export async function importSave(code) {
  const s = await decodeBackup(code.replace(/\s+/g, '')); // 메신저가 넣은 줄바꿈을 뺀다
  if (!s) return fail('백업 코드가 올바르지 않아요. 처음부터 끝까지 복사했는지 봐 주세요');
  G.state = unpack(s);
  G.edit = null;
  customCache = null;
  freshWorld();
  save();
  return true;
}

// ───── 조회 ─────

export const level = () => levelOf(G.state.xp);
// 내 가게들: 지금 연 가게와 다른 가게들(이 버전이 아는 종류만).
const myShops = (s = G.state) => [s, ...s.others.filter(o => has(SHOP_TYPES, o.type))];
export const shopOfType = type => myShops().find(shop => shop.type === type) || null;
export const shopNo = type => Object.keys(SHOP_TYPES).indexOf(type) + 1; // 몇 호점인지
// 그 종류 가게의 레벨(아직 안 연 가게면 0). 가구·바닥·벽지는 그것이 딸린 가게의 레벨로 열린다.
export const levelIn = type => { const shop = shopOfType(type); return shop ? levelOf(shop.xp) : 0; };
// 내 가게들 가운데 가장 높은 레벨. 친구를 데려오는 조건이나 오늘의 주문 목표처럼 가게 하나에 딸리지 않은 일에 쓴다.
export const bestLevel = (s = G.state) => Math.max(...myShops(s).map(shop => levelOf(shop.xp)));
// 지금 가게에서 본 가구 정보(요리 기구는 가게마다 이름과 그림이 다르다)
export const furnOf = id => furnIn(G.state.type, id);
export const itemAt = (x, y) => G.state.items.find(i => i.x === x && i.y === y);
export const itemById = id => G.state.items.find(i => i.id === id);
export const petById = id => G.state.pets.find(p => p.id === id);
const charmOf = shop => shop.items.reduce((sum, i) => sum + (FURN[i.type].charm || 0), 0);
export const charm = () => charmOf(G.state);
export const stoves = () => G.state.items.filter(i => i.type === 'stove');
export const cookState = st => (!st.cook ? 'idle' : Date.now() >= st.cook.end ? 'done' : 'cooking');
const inBounds = (x, y) => x >= 0 && y >= 0 && x < cols() && y < G.state.rows;
// 주문이 들어오는 간격(초). 분위기가 좋을수록 짧다.
const paceOf = shop => Math.max(3.5, 9 - charmOf(shop) * 0.2);
// 손님 한 명이 시키는 횟수. 머무는 가게(카페)에서는 분위기가 좋을수록 여러 번 시킨다.
const roundsOf = shop => (SHOP_TYPES[shop.type].stay ? stayRounds(charmOf(shop)) : 1);
export const rounds = () => roundsOf(G.state);
// 단골 수(머무는 가게에서 시킨 것을 끝까지 다 받고 나간 손님). 저장에는 한 명이라도 생긴 뒤에 들어간다.
export const regulars = () => G.state.regulars || 0;
// 손님이 오는 간격. 여러 번 시키는 가게에는 그만큼 드물게 와서, 주문이 들어오는 빠르기는 어느 가게나 같다.
const spawnInterval = () => paceOf(G.state) * rounds();

// 메뉴: 기본 메뉴와 나만의 메뉴를 같은 모양으로 다룬다.
let customCache = null; // 나만의 메뉴 id → 메뉴. 고칠 때마다 비운다.
function customRecipes() {
  customCache ||= new Map(G.state.custom.map(c =>
    [c.id, { ...CUSTOM_TIERS[c.tier], id: c.id, name: c.name, icon: `custom_${c.id}`, custom: true }]));
  return customCache;
}
export const recipeOf = id => RECIPE[id] || customRecipes().get(id);
export const allRecipes = () => [...SHOP_RECIPES[G.state.type], ...customRecipes().values()];
const inStock = () => allRecipes().filter(r => G.state.stock[r.id] > 0);

// 돈도 재고도 없고 불 위에 올린 것도 없으면, 그 가게의 가장 싼 메뉴는 공짜로 만들 수 있다. (막히지 않게)
const CHEAPEST = Object.fromEntries(Object.entries(SHOP_RECIPES).map(([type, list]) => [type, list.reduce((a, b) => (b.cost < a.cost ? b : a))]));
const cheapest = () => CHEAPEST[G.state.type];
const broke = () => G.state.coins < cheapest().cost && !inStock().length && stoves().every(st => !st.cook);
export const costOf = r => (r === cheapest() && broke() ? 0 : r.cost);

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

// 지금 가게가 lv 레벨이 되면 새로 열리는 것들
export function unlocksAt(lv) {
  const type = G.state.type, here = x => shopOf(x) === type, maker = furnOf('stove'), out = [];
  const words = SHOP_TYPES[type].custom;
  for (const r of SHOP_RECIPES[type]) if (r.lv === lv) out.push({ icon: r.icon, text: `새 ${words.item}: ${r.name}` });
  for (const f of Object.values(FURN)) if (here(f) && f.lv === lv && lv > 1 && !f.season) out.push({ icon: f.sprite, text: `새 가구: ${f.name}` });
  for (const f of Object.values(FLOORS)) if (here(f) && f.lv === lv && lv > 1) out.push({ text: `새 바닥: ${f.name}` });
  for (const w of Object.values(WALLS)) if (here(w) && w.lv === lv && lv > 1) out.push({ text: `새 벽지: ${w.name}` });
  for (const [id, t] of Object.entries(CUSTOM_TIERS)) if (t.lv === lv && lv > 1) out.push({ text: `나만의 ${words.item}: ${words.tiers[id]} 등급` });
  if (stoveLimit(lv) > stoveLimit(lv - 1)) out.push({ icon: maker.sprite, text: `${josa(maker.name, '을', '를')} ${stoveLimit(lv)}개까지 놓을 수 있어요` });
  // 새 친구는 가장 높은 가게 레벨로 열린다. 다른 가게가 이미 넘은 레벨이면 새 소식이 아니다.
  const otherBest = Math.max(0, ...myShops().filter(shop => shop !== G.state).map(shop => levelOf(shop.xp)));
  if (lv > otherBest && PET_SLOTS.some((slot, i) => i > 0 && slot.lv === lv)) out.push({ text: '새 동물 친구를 데려올 수 있어요' });
  if (EXPANSIONS[G.state.rows]?.lv === lv) out.push({ text: '가게를 위아래로 한 줄 넓힐 수 있어요' });
  if (WIDENINGS[G.state.cols]?.lv === lv) out.push({ text: '가게를 옆으로 한 줄 넓힐 수 있어요' });
  for (const [next, shop] of Object.entries(SHOP_TYPES)) {
    if (shop.opens?.after === type && shop.opens.lv === lv && !shopOfType(next)) {
      out.push({ icon: shop.icon, text: `${shopNo(next)}호점 ${josa(shop.name, '을', '를')} 열 수 있어요. 문을 눌러 골목으로 나가 보세요` });
    }
  }
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

// 손님 자리. 음식을 파는 가게는 테이블 옆에 붙은 스툴이고, 서서 고르는 가게(stand)는 옷걸이 옆의 빈 칸이다(옷걸이마다 한 명).
// { id, x, y: 손님이 있는 칸, tx, ty: 테이블이나 옷걸이가 있는 칸, stand: 서 있는 자리인지 }
const STAND_DIRS = [[0, 1], [-1, 0], [1, 0], [0, -1]]; // 앞(아래), 옆, 뒤 순서로 빈 칸을 찾는다
function seatsOf(s) {
  const at = (x, y) => s.items.find(i => i.x === x && i.y === y);
  const out = [];
  if (SHOP_TYPES[s.type].stand) {
    const taken = new Set();
    for (const rack of s.items) {
      if (!FURN[rack.type].rack) continue;
      const d = STAND_DIRS.find(([dx, dy]) => {
        const x = rack.x + dx, y = rack.y + dy;
        return x >= 0 && y >= 0 && x < s.cols && y < s.rows && !taken.has(y * s.cols + x) && !FURN[at(x, y)?.type]?.block;
      });
      if (!d) continue;
      taken.add((rack.y + d[1]) * s.cols + rack.x + d[0]);
      out.push({ id: rack.id, x: rack.x + d[0], y: rack.y + d[1], tx: rack.x, ty: rack.y, stand: true });
    }
    return out;
  }
  for (const st of s.items) {
    if (st.type !== 'stool') continue;
    const d = DIRS.find(([dx, dy]) => FURN[at(st.x + dx, st.y + dy)?.type]?.table);
    if (d) out.push({ id: st.id, x: st.x, y: st.y, tx: st.x + d[0], ty: st.y + d[1] });
  }
  return out;
}
const seats = () => seatsOf(G.state);
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
      round: 1, rounds: rounds(), // 몇 번째 주문인지, 모두 몇 번 시킬지
    });
    greet();
    return;
  }
}

// '친구' 단계부터는 들어오는 손님을 반긴다: 꼬리를 흔들고, 가만히 있었다면 문 쪽을 본다.
function greet() {
  for (const p of G.world.pets) {
    if (bondOf(petById(p.id).love) < 1 || p.state === 'nap' || p.eat) continue;
    p.wag = 1.6;
    if (p.state === 'idle') {
      p.dir = G.state.door >= p.x ? 1 : -1;
      p.t = Math.max(p.t, 1.2);
    }
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
  bump('sell', 1);
  bump('earn', r.price + tip);
  // 서빙 안내는 세 그릇 팔 때까지 보여 준다. (친구가 먼저 서빙해도 읽을 시간이 있게)
  if (s.tut === 2 && s.stats.sold >= 3) s.tut = 3;
  G.world.floats.push({ kind: 'coin', n: r.price + tip, x: c.x, y: c.y, t: 0 });
  emit('sale');
  addXp(1);
}

// 단골이 된다: 머무는 가게에서 시킨 것을 끝까지 다 받고 나가는 손님. 열 명마다 감사 선물을 받는다. 구경 중인 가게에서는 세지 않는다.
function becomeRegular(c) {
  const w = G.world, s = G.state;
  for (let i = 0; i < 3; i++) w.floats.push({ kind: 'heart', x: c.x + (i - 1) * 0.45, y: c.y - 0.6 - (i % 2) * 0.3, t: -i * 0.12 });
  if (G.visit) return;
  s.regulars = regulars() + 1;
  const gift = s.regulars % REGULAR_EVERY === 0 ? regularGift(level()) : 0;
  s.coins += gift;
  emit('regular', { n: s.regulars, gift });
}

// byHand: 플레이어가 손님을 직접 눌러서 가져다준 경우(친구가 한 서빙과 구분한다)
export function serve(c, byHand = false) {
  const s = G.state;
  if (c.state !== 'wait') return false;
  if (!(s.stock[c.order] > 0)) return fail(`${recipeOf(c.order).name} 재고가 없어요`);
  s.stock[c.order]--;
  c.state = 'eat';
  c.t = EAT_TIME;
  G.world.floats.push({ kind: 'heart', x: c.x, y: c.y - 0.6, t: 0 });
  if (byHand) bump('serve', 1);
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
      if (c.t > patience()) leave(c);
    } else if (c.state === 'eat') {
      c.t -= dt;
      if (c.t > 0) continue;
      pay(c);
      // 머무는 가게에서는 쉬었다가 한 번 더 시킨다. 다 시켰으면 단골이 되어 나간다.
      if (c.round < c.rounds) { c.state = 'rest'; c.t = STAY_REST; continue; }
      if (c.rounds > 1) becomeRegular(c);
      c.bought = !!c.seat.stand; // 서서 고르는 가게에서는 산 물건을 들고 나간다
      leave(c);
    } else if (c.state === 'rest') {
      if ((c.t -= dt) <= 0) Object.assign(c, { round: c.round + 1, order: pickOrder(), state: 'wait', t: 0 });
    } else if (c.state === 'out') {
      if (stepAlong(c, WALK_SPEED, dt)) c.state = 'gone';
    }
  }
  w.customers = w.customers.filter(c => c.state !== 'gone');
}
// 손님이 기다려 주는 시간. '친구' 단계 이상인 동물 친구 한 마리마다 15%씩 길어진다.
const patience = () => PATIENCE * (1 + 0.15 * G.state.pets.filter(p => isHere(p) && bondOf(p.love) >= 1).length);
export const patienceLeft = c => 1 - c.t / patience();

// ───── 동물 친구 ─────
// 친밀도 단계(data.js의 BONDS)마다 생기는 일: 1 손님을 반기고 손님이 더 기다려 줌, 2 선물을 물어 옴, 3 신나는 시간 두 배, 4 서빙이 빨라짐
export const TREAT_TIME = 1.3; // 간식을 받아서 다 먹는 데 걸리는 시간(초)

function updatePet(p, dt) {
  const w = G.world, s = G.state;
  const bond = bondOf(petById(p.id).love);
  for (const k of ['boost', 'petCd', 'joy', 'wag', 'spin']) p[k] = Math.max(0, p[k] - dt);
  const speed = PET_SPEED * (p.boost > 0 ? 1.6 : 1) * (bond >= 4 ? 1.15 : 1);
  // 물어 온 선물은 받아 갈 때까지 머리 위에 떠 있다. 구경 중인 가게에서는 생기지 않는다.
  if (!G.visit && !p.gift && bond >= 2 && (p.giftT -= dt) <= 0) {
    p.gift = 5 + rand(6) + level();
    p.giftT = 240 + Math.random() * 180;
  }
  // 간식을 다 먹으면 기뻐한다. 좋아하는 간식이면 제자리에서 돌고 한 번 더 운다. 먹는 동안에는 서빙 중이 아니면 제자리에 있는다.
  if (p.eat && (p.eat.t -= dt) <= 0) {
    const { fav } = p.eat;
    p.eat = null;
    rejoice(p, fav ? 3 : 2);
    if (fav) p.spin = 0.8;
    for (let i = 0; i <= (fav ? 1 : 0); i++) w.floats.push({ kind: 'heart', x: p.x + i * 0.5, y: p.y - 0.4 - i * 0.3, t: -i * 0.15 });
    emit('cheer', { pet: petById(p.id), fav });
  }
  if (p.eat && p.state !== 'serve') return;

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

function addLove(pet, n) {
  const before = bondOf(pet.love);
  pet.love += n;
  if (!G.visit && bondOf(pet.love) > before) emit('bond', { pet, stage: bondOf(pet.love) });
}

// 기뻐한다: 웃는 얼굴로 그동안 제자리에 있는다. 걷던 길은 멈추고, 서빙 중이면 하던 서빙을 마저 한다.
function rejoice(p, secs) {
  p.joy = secs;
  if (p.state === 'walk') { p.state = 'idle'; p.path = []; }
  if (p.state === 'idle') p.t = Math.max(p.t, secs);
}

// 쓰다듬기. 물어 온 선물이 있으면 받는다.
export function petPet(id) {
  const p = G.world.pets.find(p => p.id === id);
  if (!p || p.petCd > 0) return;
  const pet = petById(id);
  p.petCd = 0.8;
  if (p.gift) {
    G.state.coins += p.gift;
    G.world.floats.push({ kind: 'coin', n: p.gift, x: p.x, y: p.y - 0.4, t: 0 });
    emit('gift', { pet, coins: p.gift });
    p.gift = 0;
  }
  // 신나 있는 동안 또 쓰다듬어도 친밀도는 오르지 않는다(연달아 눌러서 채우지 못하게).
  if (p.boost <= 0) addLove(pet, 1);
  p.boost = PET_BOOST_TIME * (bondOf(pet.love) >= 3 ? 2 : 1);
  if (p.state === 'nap') { p.state = 'idle'; p.t = 1; }
  rejoice(p, 1.5);
  G.world.floats.push({ kind: 'heart', x: p.x, y: p.y - 0.4, t: 0 });
  bump('pet', 1);
  emit('pet', pet);
}

// 오늘 이 친구에게 준 간식 수
export const fedToday = pet => (pet.fed?.day === dayKey() ? pet.fed.n : 0);

// 간식을 사서 바로 준다. 친구마다 하루 TREATS_PER_DAY개까지. 좋아하는 간식이면 친밀도가 두 배로 오른다.
// 가게에 있는 친구가 간식을 받아먹고(TREAT_TIME), 다 먹으면 updatePet이 기뻐하는 모습을 보여 준다.
export function feed(petId, treatId) {
  const s = G.state, pet = petById(petId), treat = TREATS[treatId];
  const p = G.world.pets.find(p => p.id === petId);
  if (!p) return fail(`${josa(pet.name, '은', '는')} 지금 다른 가게를 맡고 있어요. 그 가게에 가서 주세요`);
  if (fedToday(pet) >= TREATS_PER_DAY) return fail(`${josa(pet.name, '은', '는')} 오늘 배가 불러요. 내일 또 주세요`);
  if (s.coins < treat.price) return fail('코인이 모자라요');
  s.coins -= treat.price;
  pet.fed = { day: dayKey(), n: fedToday(pet) + 1 };
  const fav = PETS[pet.species].fav === treatId;
  emit('feed', { pet, fav }); // 단계가 오르면 그 소식이 뒤이어 나온다
  addLove(pet, treat.love * (fav ? 2 : 1));
  p.boost = PET_BOOST_TIME * (bondOf(pet.love) >= 3 ? 2 : 1);
  p.eat = { icon: treat.icon, t: TREAT_TIME, fav };
  if (p.state === 'nap') { p.state = 'idle'; p.t = 1; }
  bump('treat', 1);
  return true;
}

// 다음 친구를 데려오는 조건. 더 데려올 수 없으면 null.
export const adoptSlot = () => PET_SLOTS[G.state.pets.length] || null;

export function adopt(species, name) {
  const s = G.state, slot = adoptSlot();
  name = name.trim().slice(0, PET_NAME_MAX);
  if (!slot) return fail('친구는 지금이 가장 많아요');
  if (bestLevel() < slot.lv) return fail(`레벨 ${slot.lv}부터 데려올 수 있어요`);
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
    if (item.stamps) return fail('도장 가게에서 받을 수 있어요');
    if (!onSale(item)) return fail('지금은 팔지 않는 계절 한정 옷이에요');
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
  if (!st || st.cook) return fail(`이 ${josa(furnOf('stove').name, '은', '는')} 이미 만드는 중이에요`);
  if (!r || (!r.custom && shopOf(r) !== s.type)) return fail('이 가게에서는 만들 수 없는 메뉴예요');
  if (r.lv > level()) return fail(`레벨 ${r.lv}에 열려요`);
  const cost = costOf(r);
  if (s.coins < cost) return fail('코인이 모자라요');
  s.coins -= cost;
  const now = Date.now();
  st.cook = { r: r.id, start: now, end: now + r.time * STOVE_SPEED[st.lv - 1] * 1000 };
  if (s.tut === 0) s.tut = 1;
  bump('cook', 1);
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
  const s = G.state, words = SHOP_TYPES[s.type].custom;
  name = name.trim().slice(0, CUSTOM_NAME_MAX);
  if (!name) return fail(`${words.item} 이름을 적어 주세요`);
  if (!validIcon(px) || px.join('').replace(/\./g, '').length < 12) return fail('그림을 조금 더 그려 주세요');
  if (CUSTOM_TIERS[tier].lv > level()) return fail(`${words.tiers[tier]} 등급은 레벨 ${CUSTOM_TIERS[tier].lv}부터 쓸 수 있어요`);
  let c = s.custom.find(c => c.id === id);
  if (!c) {
    if (s.custom.length >= MAX_CUSTOM) return fail(`나만의 ${josa(words.item, '은', '는')} ${MAX_CUSTOM}개까지 만들 수 있어요`);
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
  if (stoves().some(st => st.cook?.r === id)) return fail('만드는 중인 것은 지울 수 없어요');
  // 이 메뉴를 먹던 손님은 계산하고 나가고, 먹고 쉬던 손님도 나간다. 기다리던 손님은 다른 메뉴를 고른다.
  for (const c of w.customers) {
    if (c.order !== id || (c.state !== 'eat' && c.state !== 'rest')) continue;
    if (c.state === 'eat') pay(c);
    leave(c);
  }
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

// 손님을 모두 내보낸다. 먹던 손님은 계산하고 나간다.
function sendOff() {
  const w = G.world;
  for (const c of w.customers) if (c.state === 'eat') pay(c);
  w.customers = [];
}

// 친구들을 지금 가게의 가까운 빈 칸에 세운다.
function settlePets() {
  for (const p of G.world.pets) {
    const pos = nearestFree(Math.round(p.x), Math.round(p.y));
    Object.assign(p, { x: pos.x, y: pos.y, path: [], state: 'idle', t: 1, target: null });
  }
}

export function exitEdit() {
  const dirty = G.edit.dirty;
  G.edit = null;
  // 배치가 바뀌면 길이 달라지므로 손님을 내보낸다.
  if (dirty) { sendOff(); settlePets(); }
  save();
}

// others에 있는 다른 가게로 옮긴다. 옮겼으면 true. 구경 중이거나 꾸미는 중에는 옮기지 않는다.
// 먹던 손님은 떠나는 가게의 지갑으로 계산한다. 따라다니는 친구들은 같이 오고, 점장은 맡은 가게에 남는다.
export function switchShop(type) {
  const s = G.state;
  if (G.visit || G.edit || !has(SHOP_TYPES, type) || !s.others.some(o => o.type === type)) return false;
  sendOff();
  rotate(s, type);
  customCache = null;
  for (const c of s.custom) emit('custom', c.id); // 가게마다 나만의 메뉴 번호가 겹쳐서 그림을 다시 만든다
  syncPets();
  settlePets();
  emit('resize');
  save();
  // 내가 없는 동안 이 가게의 점장이 판 것을 알린다
  const sold = away[type], pet = managerOf(type);
  delete away[type];
  if (sold?.n && pet) emit('manager', { pet, n: sold.n, coins: sold.coins });
  return true;
}

// 새 가게를 열 수 없으면 그 까닭, 열 수 있으면 null. 여는 값은 앞 가게(opens.after)의 지갑에서 낸다.
export function openError(type) {
  const cfg = SHOP_TYPES[type]?.opens;
  if (!cfg || shopOfType(type)) return '열 수 없는 가게예요';
  const from = shopOfType(cfg.after);
  if (!from || levelOf(from.xp) < cfg.lv) return `${shopNo(cfg.after)}호점 레벨 ${cfg.lv}에 열려요`;
  if (from.coins < cfg.price) return `${shopNo(cfg.after)}호점의 코인이 모자라요`;
  return null;
}

// 새 가게를 열고 그 가게로 들어간다. 열었으면 true. 새 가게는 100코인으로 처음부터 키운다.
export function openShop(type, shopName) {
  if (G.visit || G.edit) return false;
  const err = openError(type);
  if (err) return fail(err);
  shopName = shopName.trim().slice(0, SHOP_NAME_MAX);
  if (!shopName) return fail('가게 이름을 지어 주세요');
  const { after, price } = SHOP_TYPES[type].opens;
  shopOfType(after).coins -= price;
  G.state.others.push(freshShop(type, shopName));
  return switchShop(type);
}

function placeError(type, x, y) {
  if (!inBounds(x, y)) return '가게 밖에는 놓을 수 없어요';
  if (itemAt(x, y)) return '이미 가구가 있는 칸이에요';
  if (FURN[type].block && x === G.state.door && y === 0) return '문 앞은 비워 둬야 해요';
  return null;
}

const stoveLimitError = type => (type === 'stove' && stoves().length >= stoveLimit(level())
  ? `${josa(furnOf('stove').name, '은', '는')} 지금 ${stoveLimit(level())}개까지 놓을 수 있어요` : null);

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
  if (it.type === 'stove') return fail(`${josa(furnOf('stove').name, '은', '는')} 옮기기만 할 수 있어요`);
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
  const err = placeError(type, x, y) || stoveLimitError(type)
    || (FURN[type].stamps ? '도장 가게에서 받을 수 있어요' : null)
    || (!onSale(FURN[type]) ? '지금은 팔지 않는 계절 한정 가구예요' : null)
    || (s.coins < FURN[type].price ? '코인이 모자라요' : null);
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
    case 'furn': return { name: furnOf(p.type).name, cost: furnOf(p.type).price };
    case 'floor': return { name: `${FLOORS[p.id].name} ${p.tiles.length}칸`, cost: FLOORS[p.id].price * p.tiles.length };
    case 'wall': return { name: WALLS[p.id].name, cost: WALLS[p.id].price };
    case 'expand': return { name: `${EXPAND_DIRS[p.dir]} 한 줄 넓히기`, cost: expandCfg(p.dir).price };
    default: return { name: `${furnOf('stove').name} ${itemById(p.id).lv + 1}단계로 강화`, cost: upgradeCost(itemById(p.id)) };
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

// ───── 점장 ─────
// 친구를 한 가게의 점장으로 두면(pet.post = 가게 종류) 그 친구는 그 가게에만 있다.
// 내가 다른 가게에 있는 동안, 게임이 켜져 있으면 점장이 그 가게에 진열된 것을 천천히 판다. 판 돈은 그 가게 지갑에 쌓인다.
// 경험치와 오늘의 주문은 직접 장사할 때만 오른다. 요리를 꺼내거나 새로 올리지는 않는다.
const away = {}; // 가게 종류 → { t: 다음에 팔 때까지 남은 시간(초), n: 내가 없는 동안 판 수, coins: 번 코인 }. 저장하지 않는다.
export const managerOf = type => G.state.pets.find(p => p.post === type) || null;
// 내가 없는 동안 그 가게의 점장이 판 것 { n, coins }. 판 것이 없으면 null.
export const awaySales = type => (away[type]?.n ? away[type] : null);
const managerPace = (shop, pet) => paceOf(shop) / MANAGER_RATE[bondOf(pet.love)];
// 진열된 물건의 값. 나만의 메뉴는 그 가게의 것에서 찾는다.
const priceIn = (shop, id) => (RECIPE[id] || CUSTOM_TIERS[shop.custom.find(c => c.id === id)?.tier])?.price;

function runManagers(dt) {
  for (const shop of G.state.others) {
    const pet = has(SHOP_TYPES, shop.type) && managerOf(shop.type);
    if (!pet) continue;
    const a = (away[shop.type] ||= { t: managerPace(shop, pet), n: 0, coins: 0 });
    if ((a.t -= dt) > 0) continue;
    a.t = managerPace(shop, pet);
    const have = Object.keys(shop.stock).filter(id => shop.stock[id] > 0 && priceIn(shop, id) > 0);
    if (!have.length || !seatsOf(shop).length) continue; // 팔 것이 없거나 손님 자리가 없으면 못 판다
    const id = have[rand(have.length)], price = priceIn(shop, id);
    shop.stock[id]--;
    shop.coins += price;
    shop.stats.sold++;
    a.n++;
    a.coins += price;
  }
}

// 친구를 가게의 점장으로 두거나(type), 다시 데리고 다닌다(type이 null). 바꿨으면 true.
// 가게마다 점장은 한 마리이고, 데리고 다니는 친구가 적어도 한 마리는 남아야 한다.
export function setPost(petId, type) {
  const s = G.state, pet = petById(petId);
  if (G.visit || G.edit || !pet) return false;
  if (type) {
    if (!shopOfType(type)) return fail('아직 없는 가게예요');
    if (s.pets.some(p => p !== pet && p.post === type)) return fail('그 가게에는 이미 점장이 있어요');
    if (!s.pets.some(p => p !== pet && !p.post)) return fail('데리고 다닐 친구가 한 마리는 있어야 해요');
    pet.post = type;
  } else {
    delete pet.post;
  }
  for (const c of G.world.customers) if (c.claim === petId) c.claim = null;
  syncPets();
  return true;
}

// ───── 시간 ─────

// 장사는 게임 화면이 켜져 있는 동안에만 한다. 화면을 끄면 이 함수가 불리지 않아서 손님도 판매도 멈춘다.
// (요리는 끝나는 시각을 적어 두므로 꺼 둔 동안에도 익는다)
export function tick(dt) {
  const w = G.world;
  w.time += dt;
  for (const f of w.floats) f.t += dt;
  w.floats = w.floats.filter(f => f.t < 1.2);
  if (G.state.started && !G.visit) runManagers(dt);
  if (G.edit || !G.state.started) return;
  w.spawnT -= dt;
  if (w.spawnT <= 0) {
    w.spawnT = spawnInterval() * (0.7 + Math.random() * 0.6);
    trySpawn();
  }
  updateCustomers(dt);
  for (const p of w.pets) updatePet(p, dt);
}
