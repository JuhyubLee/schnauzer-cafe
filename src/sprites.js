// 픽셀 스프라이트. 글자 하나가 픽셀 하나이고, PAL이 글자를 색으로 바꾼다.
// 새 그림을 추가할 때는 def()로 등록하면 된다. outline 기본값은 true(바깥선 자동 추가).

export const PAL = {
  k: '#3b2b2b', K: '#1e1616',
  w: '#fff7ea', c: '#fbe3bf', C: '#e9c48e',
  o: '#f58a1f', O: '#cf6410', a: '#ffb35c',
  y: '#ffd34d', Y: '#e0a520',
  r: '#e2432c', R: '#a82a1c',
  p: '#f7a8a0', P: '#e07a78',
  g: '#8f929c', G: '#5f626e', l: '#cfd2d9',
  b: '#9a6842', B: '#6b4329', t: '#d19a62', T: '#b47b46',
  n: '#66ad5c', N: '#3f7a45',
  u: '#8cc4ee', U: '#5b9bd8',
  m: '#9bdccb', M: '#63b3a0',
  s: '#f8cfa6', e: '#2a1f1f',
  // 손님마다 바뀌는 색(머리 h, 옷 v/V, 바지 j)의 기본값
  h: '#4a3328', v: '#6aa0e0', V: '#3f6fb3', j: '#3d4a6b',
};

const RAW = {};

function def(name, rows, opts = {}) {
  const w = rows[0].length;
  for (const [i, r] of rows.entries()) {
    if (r.length !== w) throw new Error(`sprite ${name}: row ${i} is ${r.length} wide, expected ${w}`);
  }
  RAW[name] = { rows, outline: opts.outline !== false, pal: opts.pal || null };
}

function withOutline(rows) {
  const h = rows.length, w = rows[0].length;
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && rows[y][x] !== '.';
  return rows.map((r, y) => [...r].map((ch, x) =>
    ch === '.' && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) ? 'k' : ch
  ).join(''));
}

// ───── 가구 ─────

def('table', [
  '................',
  '....tttttttt....',
  '..tttttttttttt..',
  '..tttttttttttt..',
  '..tttttttttttt..',
  '..tttttttttttT..',
  '..TtttttttttTT..',
  '....TTTTTTTT....',
  '......BBBB......',
  '.......BB.......',
  '.......BB.......',
  '.......BB.......',
  '.....BBBBBB.....',
  '................',
  '................',
  '................',
]);

def('stool', [
  '................',
  '................',
  '................',
  '................',
  '................',
  '....aooooooo....',
  '....oooooooO....',
  '....OOOOOOOO....',
  '.....B....B.....',
  '.....B....B.....',
  '.....B....B.....',
  '.....B....B.....',
  '................',
  '................',
  '................',
  '................',
]);

const STOVE_TOP = [
  '................',
  '................',
  '................',
  '................',
  '....kkkkkkkk....',
  '.kkllllllllllkk.',
  '...kggggggggk...',
  '...kgggggggGk...',
  '...kGGGGGGGGk...',
  'kkkkkkkkkkkkkkkk',
  'kcccccccccccccck',
  'kccccccccccccCCk',
  'kkkkkkkkkkkkkkkk',
  'koKooKooooKooKok',
  'kooooooooooooook',
  'kokkkkkkkkkkkkok',
];
const STOVE_BOTTOM = [
  'kokkkkkkkkkkkkok',
  'kooooooooooooook',
  'kOOOOOOOOOOOOOOk',
  'kkkkkkkkkkkkkkkk',
  '.kk..........kk.',
];
def('stove', [...STOVE_TOP,
  'kokGGGGGGGGGGkok',
  'kokGlGGGGGGGGkok',
  'kokGGGGGGGGGGkok',
  ...STOVE_BOTTOM], { outline: false });
def('stove_on', [...STOVE_TOP,
  'kokryaayyaayrkok',
  'kokyayyaayyaykok',
  'kokayyaayyaaykok',
  ...STOVE_BOTTOM], { outline: false });

def('plant', [
  '................',
  '......nn........',
  '.....nNnn.nn....',
  '....nnnNnnnnn...',
  '...nnnnnNnnNnn..',
  '..nnNnnnnnnnnn..',
  '..nnnNnnnNnnnn..',
  '..nnnnnnnnNnnn..',
  '..nNnnnNnnnnNn..',
  '...nnnnnNnnnn...',
  '....nnNnnnnn....',
  '.....nnnNnn.....',
  '.......BB.......',
  '.......BB.......',
  '....aooooooO....',
  '....ooooooOO....',
  '.....oooooO.....',
  '.....oooooO.....',
  '.....ooooOO.....',
  '.....OOOOOO.....',
  '................',
]);

def('flower', [
  '................',
  '.....oo...yy....',
  '....oyyo.yooy...',
  '....oyyo.yooy...',
  '.....oo...yy....',
  '..oo..n....n....',
  '.oyyo.n.oo.n....',
  '.oyyo.nnyyon....',
  '..oo..noyyon....',
  '...n..n.oo.n....',
  '...nn.n..n.n....',
  '....nnnnnnnn....',
  '.....nNnnNn.....',
  '....wccccccC....',
  '....ccccccCC....',
  '.....cccccC.....',
  '.....cccccC.....',
  '.....ccccCC.....',
  '.....CCCCCC.....',
  '................',
]);

def('lamp', [
  '................',
  '.....aaaaaa.....',
  '....aaoooooo....',
  '....aooooooo....',
  '...aooooooooO...',
  '...ooooooooOO...',
  '..oooooooooOOO..',
  '..OOOOOOOOOOOO..',
  '......yyyy......',
  '.......BB.......',
  '.......BB.......',
  '.......BB.......',
  '.......BB.......',
  '.......BB.......',
  '.......BB.......',
  '.......BB.......',
  '.......BB.......',
  '.......BB.......',
  '.......BB.......',
  '.......BB.......',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '................',
]);

def('shelf', [
  'kkkkkkkkkkkkkkkk',
  'kbbbbbbbbbbbbbbk',
  'kBrruuyBnnooBBBk',
  'kBrruuyBnnooBwBk',
  'kBrruuyBnnooBwBk',
  'kBrruuynnnooBwBk',
  'kbbbbbbbbbbbbbbk',
  'kBBBooBuunnrrBBk',
  'kBwBooBuunnrrBBk',
  'kBwBooyuunnrrBBk',
  'kBwBooyuunnrrBBk',
  'kbbbbbbbbbbbbbbk',
  'kBnnBBBByyrruuBk',
  'kBnnBglByyrruuBk',
  'kBnnBggByyrruuBk',
  'kBnnBggByyrruuBk',
  'kbbbbbbbbbbbbbbk',
  'kBBBBBBBBBBBBBBk',
  'kBBBBBBBBBBBBBBk',
  'kkkkkkkkkkkkkkkk',
  '.kk..........kk.',
], { outline: false });

def('rug', [
  '................',
  '.OOOOOOOOOOOOOO.',
  '.OccccccccccccO.',
  '.OcoooooooooocO.',
  '.OcoaaooooaaocO.',
  '.OcoaooyyooaocO.',
  '.OcoooyyyyooocO.',
  '.OcooyyccyyoocO.',
  '.OcooyyccyyoocO.',
  '.OcoooyyyyooocO.',
  '.OcoaooyyooaocO.',
  '.OcoaaooooaaocO.',
  '.OcoooooooooocO.',
  '.OccccccccccccO.',
  '.OOOOOOOOOOOOOO.',
  '................',
], { outline: false });

def('dogbed', [
  '................',
  '................',
  '................',
  '................',
  '................',
  '....oooooooo....',
  '..oooooooooooo..',
  '.oooccccccccooo.',
  '.ooccccccccccoo.',
  '.ooccccccccccoo.',
  '.oOoccccccccoOo.',
  '.OOooooooooooOO.',
  '..OOOOOOOOOOOO..',
  '................',
  '................',
  '................',
]);

// ───── 벽 장식 ─────

const DOOR_PANEL = 'kBtTttttttttTtBk';
def('door', [
  '.kkkkkkkkkkkkkk.',
  'kBBBBBBBBBBBBBBk',
  'kBttttttttttttBk',
  'kBtkkkkkkkkkktBk',
  'kBtkuuuuuuuuktBk',
  'kBtkuuwuuuuuktBk',
  'kBtkuwuuuuuUktBk',
  'kBtkuuuuuuUUktBk',
  'kBtkkkkkkkkkktBk',
  'kBttttttttttttBk',
  'kBtttttttttyytBk',
  'kBtttttttttyytBk',
  'kBttttttttttttBk',
  'kBtTTTTTTTTTTtBk',
  DOOR_PANEL, DOOR_PANEL, DOOR_PANEL, DOOR_PANEL, DOOR_PANEL, DOOR_PANEL,
  'kBtTTTTTTTTTTtBk',
  'kBttttttttttttBk',
  'kBBBBBBBBBBBBBBk',
  'kkkkkkkkkkkkkkkk',
], { outline: false });

def('window', [
  'kkkkkkkkkkkkkkkkkkkkkkkk',
  'kbbbbbbbbbbbbbbbbbbbbbbk',
  'kbooouuuuuubbuuuuuuooobk',
  'kboouuwuuuubbuuuuuuuoobk',
  'kboouwuuuuubbuuwuuuuoobk',
  'kbouuuuuuuubbuwuuuuuuobk',
  'kbouuuuuuuubbuuuuuuuuobk',
  'kbbbbbbbbbbbbbbbbbbbbbbk',
  'kbouuuuuuuubbuuuuuuuuobk',
  'kbouuuuuuUUbbuuuuuuUUobk',
  'kboouuuUUUUbbuuuuUUUoobk',
  'kboooUUUUUUbbUUUUUUooobk',
  'kbbbbbbbbbbbbbbbbbbbbbbk',
  'kccccccccccccccccccccCCk',
  'kkkkkkkkkkkkkkkkkkkkkkkk',
], { outline: false });

def('frame', [
  'kkkkkkkkkkkkkkkkkk',
  'kyyyyyyyyyyyyyyyyk',
  'kycccccccccccccCyk',
  'kycGGccccccccGGCyk',
  'kyGGGGggggggGGGGyk',
  'kyGGggggggggggGGyk',
  'kycgllggggggllgCyk',
  'kycggKggggggKggCyk',
  'kycggggggggggggCyk',
  'kycwwwwgKKgwwwwCyk',
  'kywwwwwwKKwwwwwwyk',
  'kywwwwwwppwwwwwwyk',
  'kycwwwwwwwwwwwwCyk',
  'kycCCCCCCCCCCCCCyk',
  'kyyyyyyyyyyyyyyyyk',
  'kkkkkkkkkkkkkkkkkk',
], { outline: false });

// ───── 슈나우저 ─────

// 몸은 옆모습, 얼굴은 정면: 눈썹과 수염이 보여야 슈나우저로 읽힌다.
const DOG_BODY = [
  '................',
  '........G...G...',
  '.......GGgggGG..',
  '.......GgggggG..',
  '..g....gllgllg..',
  '..g....gKgggKg..',
  '..ggggwwwwKwwww.',
  '.gggggwwwwwwwww.',
  '.ggggggwwwpwww..',
  '.gggggggwwwww...',
  '.ggggggggg......',
];
def('dog_a', [...DOG_BODY,
  '.ll.G..G.ll.....',
  '.ww.l..l.ww.....',
  '................',
]);
def('dog_b', [...DOG_BODY,
  '..ll.GG.ll......',
  '..ww.ll.ww......',
  '................',
]);
def('dog_sleep', [
  '................',
  '................',
  '....ggggggg.....',
  '..ggggggggGGg...',
  '.gggggggggGgllg.',
  '.gggggggggggKwK.',
  '.llgglggggwwwww.',
  '..ll.ll...www...',
  '................',
]);
def('dog_face', [
  '................',
  '..GG........GG..',
  '.GGGG......GGGG.',
  '.GGGggggggggGGG.',
  '.GGggggggggggGG.',
  '..gllggggggllg..',
  '..glllgggglllg..',
  '..ggKggggggKgg..',
  '..gggggggggggg..',
  '..wwwwgKKgwwww..',
  '.wwwwwwKKwwwwww.',
  '.wwwwwwwwwwwwww.',
  '.wwwwwwppwwwwww.',
  '..wwwwwwwwwwww..',
  '...www.ww.www...',
  '................',
]);

// ───── 손님 ─────

const HEAD_SHORT = [
  '................',
  '.....hhhhhh.....',
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '...hhsssssshh...',
  '...hssssssssh...',
  '...hsessssesh...',
  '...sspsssspss...',
  '....ssssssss....',
  '.....ssssss.....',
  '....vvvvvvvv....',
  '...vvvvvvvvvv...',
  '...svvvvvvvvs...',
  '...svvvvvvvvs...',
  '....VVVVVVVV....',
];
const HEAD_LONG = [
  '................',
  '.....hhhhhh.....',
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '..hhhsssssshhh..',
  '..hhsssssssshh..',
  '..hhsesssseshh..',
  '..hhspsssspshh..',
  '..hhhsssssshhh..',
  '..hh.ssssss.hh..',
  '..hhvvvvvvvvhh..',
  '..hvvvvvvvvvvh..',
  '...svvvvvvvvs...',
  '...svvvvvvvvs...',
  '....VVVVVVVV....',
];
const LEGS = {
  a: ['....jjjjjjjj....', '....jjj..jjj....', '....KKK..jjj....', '.........KKK....', '................'],
  b: ['....jjjjjjjj....', '....jjj..jjj....', '....jjj..KKK....', '....KKK.........', '................'],
  sit: ['....jjjjjjjj....', '....KKK..KKK....', '................'],
};
// 뒷모습: 얼굴 줄(4~8)의 피부·눈·볼을 머리카락으로 덮는다.
const toBack = head => head.map((r, i) => (i >= 4 && i <= 8 ? r.replace(/[sep]/g, 'h') : r));

const HAIR = ['#4a3328', '#2b2530', '#a9713f', '#e3b04b', '#7a4a6e', '#c2552d'];
const SHIRT = [['#6aa0e0', '#3f6fb3'], ['#66ad5c', '#3f7a45'], ['#f7a8a0', '#e07a78'],
  ['#ffd34d', '#e0a520'], ['#fff7ea', '#cfd2d9'], ['#b48be0', '#8560b8']];
const PANTS = ['#3d4a6b', '#5f626e', '#6b4329'];

export const CUSTOMER_LOOKS = 12;
for (let i = 0; i < CUSTOMER_LOOKS; i++) {
  const head = i % 2 ? HEAD_LONG : HEAD_SHORT;
  const [v, V] = SHIRT[(i * 5 + 1) % SHIRT.length];
  const pal = { h: HAIR[(i * 7) % HAIR.length], v, V, j: PANTS[i % PANTS.length] };
  def(`cust${i}_a`, [...head, ...LEGS.a], { pal });
  def(`cust${i}_b`, [...head, ...LEGS.b], { pal });
  def(`cust${i}_sit`, [...head, ...LEGS.sit], { pal });
  def(`cust${i}_back_a`, [...toBack(head), ...LEGS.a], { pal });
  def(`cust${i}_back_b`, [...toBack(head), ...LEGS.b], { pal });
  def(`cust${i}_back_sit`, [...toBack(head), ...LEGS.sit], { pal });
}

// ───── 음식 ─────

const BOWL_WHITE = [
  '.wRRrrrrrrrrRRw.',
  '.wwwRRRRRRRRwww.',
  '..wwwwwwwwwwww..',
  '..lwwwwwwwwwwl..',
  '...llwwwwwwll...',
  '....llllllll....',
  '................',
];
def('f_tteok', [
  '................',
  '................',
  '................',
  '................',
  '....rrrrrrrr....',
  '..rrrwwrrrwwrr..',
  '.rrwwrrryyrrwwr.',
  '.rwwrrwwrrryyrr.',
  '.Rrrrwwrrrwwrrr.',
  ...BOWL_WHITE,
]);
def('f_cheesetteok', [
  '................',
  '................',
  '................',
  '......yyyy......',
  '....yyyyyyyy....',
  '..rryyyywwyyyr..',
  '.rryyPPyyyyywwr.',
  '.rwwyyyyyPPyyyr.',
  '.RrryywwyyyyRrr.',
  ...BOWL_WHITE,
]);
def('f_buldak', [
  '................',
  '................',
  '................',
  '................',
  '....rrrrrrrr....',
  '..rrarrrarrrrr..',
  '.rarrrarrrarrar.',
  '.rrrarrrNrrrarr.',
  '.GrarrrarrrarrG.',
  '.GGGrrrrrrrrGGG.',
  '.GGGGGGGGGGGGGG.',
  '..GGGGGGGGGGGG..',
  '..KGGGGGGGGGGK..',
  '...KKGGGGGGKK...',
  '....KKKKKKKK....',
  '................',
]);
const PLATE = [
  '.wwwwwwwwwwwwww.',
  '.lwwwwwwwwwwwwl.',
  '..llllllllllll..',
  '................',
  '................',
  '................',
];
def('f_rose', [
  '................',
  '................',
  '................',
  '................',
  '......nn........',
  '.....PPnPPP.....',
  '....PPaPPaPP....',
  '...PaPPaPPPaP...',
  '...PPaPPPaPPP...',
  '.wwwPPPaPPPPwww.',
  ...PLATE,
]);
def('f_cream', [
  '................',
  '................',
  '................',
  '................',
  '........K.......',
  '.....ccPcccc....',
  '....ccyccPccc...',
  '...cyccKcccycc..',
  '...ccPcccyccPc..',
  '.wwwccycccccwww.',
  ...PLATE,
]);
def('f_buldakpasta', [
  '................',
  '................',
  '................',
  '.......rr.......',
  '......rRn.......',
  '.....aaoaara....',
  '....aoaaraaoa...',
  '...araaoaaaraa..',
  '...aaoaaraaoaa..',
  '.wwwaaraaaoawww.',
  ...PLATE,
]);
def('f_americano', [
  '................',
  '..........o.....',
  '.........o......',
  '....wwwwwoww....',
  '...wwwwwwwwww...',
  '....BBBBBBBB....',
  '....BlBBBBlB....',
  '....BBBlBBBB....',
  '....BBBBBBBB....',
  '.....BBlBBB.....',
  '.....BBBBBB.....',
  '.....BBBBBB.....',
  '.....wwwwww.....',
  '................',
  '................',
  '................',
]);
def('f_coolpis', [
  '................',
  '................',
  '......pppp......',
  '.....pppppp.....',
  '....PPPPPPPP....',
  '....pppppppp....',
  '....pwwwwwwp....',
  '....pwaawwwp....',
  '....pwaawnwp....',
  '....pwwwwwwp....',
  '....pppppppp....',
  '....pppppppp....',
  '....PPPPPPPP....',
  '................',
  '................',
  '................',
]);
def('f_riceball', [
  '................',
  '................',
  '................',
  '.......ww.......',
  '......wwww......',
  '.....wwwwww.....',
  '....wwwwwwww....',
  '....wwwwwwww....',
  '...wwwKKKKwww...',
  '...wwKKKKKKww...',
  '..wwwKKKKKKwww..',
  '..wwwKKKKKKwww..',
  '...llKKKKKKll...',
  '................',
  '................',
  '................',
]);
def('f_egg', [
  '................',
  '................',
  '................',
  '.....yyyyyy.....',
  '....yyyyyyyy....',
  '...yyynyyyyyy...',
  '...yyyyyynyyy...',
  '..yyyyyyyyyyyy..',
  '.BBYYYYYYYYYYBB.',
  '.BBBBBBBBBBBBBB.',
  '..BBBBBBBBBBBB..',
  '..KBBBBBBBBBBK..',
  '...KKKKKKKKKK...',
  '................',
  '................',
  '................',
]);

// ───── 작은 아이콘 ─────

def('coin', [
  '.........',
  '...yyy...',
  '..ywyyy..',
  '.ywyYYyY.',
  '.yyYyyyY.',
  '.yyYYyyY.',
  '..yyyyY..',
  '...YYY...',
  '.........',
]);
def('heart', [
  '.........',
  '..rr.rr..',
  '.rprrrrr.',
  '.rrrrrrr.',
  '..rrrrr..',
  '...rrr...',
  '....r....',
  '.........',
]);
def('zzz', [
  'www..',
  '..w..',
  '.w...',
  'www..',
], { outline: false });
def('star', [
  '..y..',
  '.yyy.',
  'yywyy',
  '.yyy.',
  '..y..',
], { outline: false });
def('note', [
  '................',
  '................',
  '..wwwwwwwwwwww..',
  '..wwwwwwwwwwww..',
  '..wwrrwwrrwwww..',
  '..wrrrrrrrrwww..',
  '..wrrrrrrrrwww..',
  '..wwrrrrrrwwww..',
  '..wwwrrrrwwwww..',
  '..wwwwrrwwwwww..',
  '..wwwwwwwwwwww..',
  '..wwwwwwwwwwww..',
  '....ww..........',
  '...ww...........',
  '................',
  '................',
]);
def('hammer', [
  '................',
  '................',
  '....gggggggg....',
  '...gllllllllg...',
  '...gggggggggg...',
  '....gggggggg....',
  '.......bb.......',
  '.......bb.......',
  '.......bb.......',
  '.......bb.......',
  '.......bb.......',
  '.......bb.......',
  '.......BB.......',
  '.......BB.......',
  '................',
  '................',
]);

// ───── 래스터화 ─────

export const SPRITE_NAMES = Object.keys(RAW);

// {w, h, data: RGBA Uint8ClampedArray}. 브라우저와 아이콘 생성 스크립트가 같이 쓴다.
export function rasterize(name) {
  const s = RAW[name];
  if (!s) throw new Error(`unknown sprite: ${name}`);
  const rows = s.outline ? withOutline(s.rows) : s.rows;
  const h = rows.length, w = rows[0].length;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.') continue;
      const hex = (s.pal && s.pal[ch]) || PAL[ch];
      if (!hex) throw new Error(`sprite ${name}: unknown color "${ch}"`);
      const i = (y * w + x) * 4;
      data[i] = parseInt(hex.slice(1, 3), 16);
      data[i + 1] = parseInt(hex.slice(3, 5), 16);
      data[i + 2] = parseInt(hex.slice(5, 7), 16);
      data[i + 3] = 255;
    }
  }
  return { w, h, data };
}

// 브라우저 전용: 이름 → canvas. `${name}~` 는 좌우 반전본.
export function buildAtlas() {
  const atlas = {};
  for (const name of SPRITE_NAMES) {
    const { w, h, data } = rasterize(name);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').putImageData(new ImageData(data, w, h), 0, 0);
    atlas[name] = c;
    const f = document.createElement('canvas');
    f.width = w; f.height = h;
    const fx = f.getContext('2d');
    fx.translate(w, 0); fx.scale(-1, 1); fx.drawImage(c, 0, 0);
    atlas[name + '~'] = f;
  }
  return atlas;
}
