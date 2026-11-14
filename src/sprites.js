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

const TABLE_ROWS = [
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
];
def('table', TABLE_ROWS);
def('table_white', TABLE_ROWS, { pal: { t: PAL.w, T: PAL.l, B: PAL.g } });
def('table_orange', TABLE_ROWS, { pal: { t: PAL.a, T: PAL.o, B: PAL.G } });
def('table_check', [
  '................',
  '....wwrrwwrr....',
  '..rrwwrrwwrrww..',
  '..wwrrwwrrwwrr..',
  '..wwrrwwrrwwrr..',
  '..rrwwrrwwrrww..',
  '..RRccRRccRRcc..',
  '..ccRRccRRccRR..',
  '...cRRccRRccR...',
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

const PLANT_ROWS = [
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
];
def('plant', PLANT_ROWS);
def('blossom', PLANT_ROWS, { pal: { n: PAL.p, N: '#fbd0dc' } }); // 봄 한정: 벚꽃 화분

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

const LAMP_ROWS = [
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
];
def('lamp', LAMP_ROWS);
def('lamp_mint', LAMP_ROWS, { pal: { a: '#d6f5ec', o: PAL.m, O: PAL.M } });

def('lamp_mush', [
  '................',
  '.....rrrrrr.....',
  '....rrwrrrrr....',
  '...rrrrrrwrrr...',
  '...rwrrrrrrrr...',
  '...rrrrrwrrrR...',
  '....RRRRRRRR....',
  '......cccc......',
  '......cccc......',
  '......cccC......',
  '.....ccccCC.....',
  '................',
]);

def('lantern', [
  '................',
  '.......gg.......',
  '......gggg......',
  '.....GGGGGG.....',
  '.....lyyyyl.....',
  '.....lyaayl.....',
  '.....lyaayl.....',
  '.....lyaayl.....',
  '.....lyyyyl.....',
  '.....GGGGGG.....',
  '....GGGGGGGG....',
  '................',
]);

def('candle', [
  '................',
  '.......y........',
  '......yay.......',
  '......yay.......',
  '.......B........',
  '......cccc......',
  '......cwcc......',
  '......cwcc......',
  '......cccc......',
  '......cccC......',
  '....YYYYYYYY....',
  '.....YYYYYY.....',
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

// ───── 계절 한정 가구 ─────

// 트리의 전구(r, y, u)는 색을 서로 바꾼 그림(xmas_tree_b)과 번갈아 보여서 깜빡인다.
const XMAS_TREE_ROWS = [
  '................',
  '.......aa.......',
  '......aYYa......',
  '.......aa.......',
  '.......nn.......',
  '......nnnn......',
  '.....nnrnnn.....',
  '....nnnnnnun....',
  '.....nNnnnn.....',
  '....nnnnynnn....',
  '...nnrnnnnnnn...',
  '..nnnnnnNnnunn..',
  '....nNnnnnnn....',
  '...nnnynnnnrnn..',
  '..nnnnnnnNnnnnn.',
  '.nnunnnnnnnnynn.',
  '.nnnnnrnnnNnnnn.',
  '.......BB.......',
  '.......BB.......',
  '.....aooooO.....',
  '.....ooooOO.....',
  '......OOOO......',
  '................',
];
def('xmas_tree', XMAS_TREE_ROWS);
def('xmas_tree_b', XMAS_TREE_ROWS, { pal: { r: PAL.y, y: PAL.u, u: PAL.r } });

def('gift', [
  '................',
  '................',
  '.....yy..yy.....',
  '....y..yy..y....',
  '.....yyyyyy.....',
  '...rrrryyrrrr...',
  '...rrrryyrrrr...',
  '...RRRRyyRRRR...',
  '...rrrryyrrrr...',
  '...rrrryyrrrr...',
  '...rrrryyrrrr...',
  '...RRRRYYRRRR...',
  '................',
  '................',
]);

def('snowman', [
  '................',
  '......GGGG......',
  '......GGGG......',
  '.....GGGGGG.....',
  '......wwww......',
  '.....wewwew.....',
  '.....wwwoow.....',
  '.....wwwwww.....',
  '.....rrrrrr.....',
  '......rr........',
  '....wwwwwwww....',
  '...wwwwGwwwww...',
  '...wwwwwwwwww...',
  '...wwwwGwwwww...',
  '...wwwwwwwwww...',
  '....wlwwwwlw....',
  '.....llllll.....',
  '................',
]);

def('pumpkin', [
  '................',
  '................',
  '.......NN.......',
  '.......N........',
  '....ooooNooo....',
  '...oaoooooooO...',
  '..oaooOoooOooO..',
  '..oaooOoooOooO..',
  '..ooooOoooOooO..',
  '..ooooOoooOooO..',
  '..ooooOoooOooO..',
  '...ooooOoOooO...',
  '....OOOOOOOO....',
  '................',
]);

def('fan', [
  '................',
  '.....llllll.....',
  '....lwuwwuwl....',
  '...lwuuwwuuwl...',
  '...lwwugguwwl...',
  '...lwwugguwwl...',
  '...lwuuwwuuwl...',
  '....lwuwwuwl....',
  '.....llllll.....',
  '.......gg.......',
  '.......gg.......',
  '.......gg.......',
  '.....GGGGGG.....',
  '....GGGGGGGG....',
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

// 창문. 유리(가운데 24×15, '.')는 비워 두고 render.js가 그 뒤에 시각과 계절에 맞는 바깥 풍경을 그린다.
const winRow = (left, right) => `kb${left}bb${right}bk`;
const WIN_BAR = `k${'b'.repeat(26)}k`;
def('window', [
  'k'.repeat(28),
  WIN_BAR,
  winRow('ooooooooooo', 'ooooooooooo'),
  winRow('OoOoOoOoOoO', 'OoOoOoOoOoO'),
  winRow('ooo........', '........ooo'),
  winRow('oo.........', '.........oo'),
  winRow('oo.........', '.........oo'),
  winRow('o..........', '..........o'),
  winRow('o..........', '..........o'),
  WIN_BAR,
  winRow('o..........', '..........o'),
  winRow('o..........', '..........o'),
  winRow('oo.........', '.........oo'),
  winRow('oo.........', '.........oo'),
  winRow('ooo........', '...n....ooo'),
  winRow('ooo........', '..nNn...ooo'),
  winRow('oooo.......', '..TtT..oooo'),
  WIN_BAR,
  `k${'c'.repeat(24)}CCk`,
  'k'.repeat(28),
], { outline: false });

// 작은 액자. 안쪽(14×12)에는 첫 번째 친구 얼굴을 그려 넣는다(render.js).
const FRAME_INNER = 'kycccccccccccccCyk';
def('frame', [
  'kkkkkkkkkkkkkkkkkk',
  'kyyyyyyyyyyyyyyyyk',
  ...Array(11).fill(FRAME_INNER),
  'kycCCCCCCCCCCCCCyk',
  'kyyyyyyyyyyyyyyyyk',
  'kkkkkkkkkkkkkkkkkk',
], { outline: false });

// 큰 액자. 안쪽(22×18, '.')에는 플레이어가 고른 사진이나 아래 기본 그림이 들어간다.
const PHOTO_EDGE = `ky${'Y'.repeat(24)}yk`;
def('photoframe', [
  'k'.repeat(28),
  `k${'y'.repeat(26)}k`,
  PHOTO_EDGE,
  ...Array(18).fill(`kyY${'.'.repeat(22)}Yyk`),
  PHOTO_EDGE,
  `k${'y'.repeat(26)}k`,
  'k'.repeat(28),
], { outline: false });

def('painting', [
  'uuuuuuuuuuuuuuuuuuuuuu',
  'uuuuuuuuuuuuuuuuwwuuuu',
  'uuuuyyuuuuuuuuuwwwwuuu',
  'uuuyyyyuuuuuuuuuuuuuuu',
  'uuuyyyyuuuuuuuuuuuuuuu',
  'uuuuyyuuuuuuuuuuuuuuuu',
  'uuuuuuuuuuuuNuuuuuuuuu',
  'uuuuuuuuuuuNNNuuuuuuuu',
  'uuuuuuuuuuNNNNNuuuuuuu',
  'uuuuunuuuNNNNNNNuuuuuu',
  'uuuunnnuNNNNNNNNNuuuuu',
  'uuunnnnnNNNNNNNNNNuuuu',
  'uunnnnnnnNNNNNNNNNNuuu',
  'unnnnnnnnnnNNNNNNNNNuu',
  'nnnnnnnnnnnnnnNNNNNNNn',
  'nnnnnnnnnnnnnnnnnnnnnn',
  'nnnonnnnnnnnnnnnpnnnnn',
  'nnnnnnnnnnonnnnnnnnnnn',
], { outline: false });

// ───── 동물 친구 ─────

// 몸은 옆모습, 얼굴은 정면. 모든 종이 같은 자리에 머리(7~13열)와 몸(1~9열)을 둬서 옷이 그대로 맞는다.
// 글자는 역할이다: g 털, G 어두운 털, l 밝은 무늬, s 줄무늬, w 흰 털, e 눈, n 코, p 분홍,
// f 앞다리, F 뒷다리, q 발. 색은 PET_PAL이 종마다 정한다.
const PET_ROWS = {
  schnauzer: [
    '................',
    '........G...G...',
    '.......GGgggGG..',
    '.......GgggggG..',
    '..g....gllgllg..',
    '..g....gegggeg..',
    '..ggggwwwwnwwww.',
    '.gggggwwwwwwwww.',
    '.ggggggwwwpwww..',
    '.gggggggwwwww...',
    '.ggggggggg......',
  ],
  maltese: [
    '................',
    '................',
    '........ggggg...',
    '.......ggggggg..',
    '..g...GgggggggG.',
    '..g...GgegggegG.',
    '..ggggGgggngggG.',
    '.gggggGggggggg..',
    '.gggggggggpgg...',
    '.ggggggggggg....',
    '.ggggggggg......',
  ],
  shiba: [
    '................',
    '.......g.....g..',
    '.......gg...gg..',
    '.gg....ggggggg..',
    '..g....glggglg..',
    '..g....gegggeg..',
    '..gggggwwgngww..',
    '.gggggwwwwwwww..',
    '.ggggggwwwpwww..',
    '.gggggggwwwww...',
    '.ggggggggg......',
  ],
  poodle: [
    '................',
    '........ggggg...',
    '.......GgggggG..',
    '.g.....GgggggG..',
    '.gg...GGgggggGG.',
    '..g...GGegggeGG.',
    '..ggggGGggnggGG.',
    '.ggggggGgggggG..',
    '.gggggggggpgg...',
    '.ggggggggggg....',
    '.ggggggggg......',
  ],
  cat: [
    '................',
    '.......g.....g..',
    '.......gp...pg..',
    '.g.....ggsgsgg..',
    '.g.....ggggggg..',
    '.g.....gegggeg..',
    '..gsgsgwwwnwww..',
    '.ggsgsggwwwww...',
    '.ggggggggwww....',
    '.gggggggggg.....',
    '.ggggggggg......',
  ],
};
const PET_LEGS = {
  a: ['.ff.F..F.ff.....', '.qq.f..f.qq.....', '................'],
  b: ['..ff.FF.ff......', '..qq.ff.qq......', '................'],
  sleep: ['................'], // 다리를 접고 엎드린 모습
};
const DARK = '#1e1616', PINK = '#f7a8a0';
// 종 id → [몸 그림, 색]. data.js의 PETS와 id가 같아야 한다.
const PET_PAL = {
  schnauzer: ['schnauzer', { g: '#8f929c', G: '#5f626e', l: '#cfd2d9', s: '#8f929c', w: '#fff7ea', e: DARK, n: DARK, p: PINK, f: '#cfd2d9', F: '#5f626e', q: '#fff7ea' }],
  maltese: ['maltese', { g: '#fff7ea', G: '#e3d2b8', l: '#fff7ea', s: '#fff7ea', w: '#fff7ea', e: DARK, n: DARK, p: PINK, f: '#fff7ea', F: '#e3d2b8', q: '#fff7ea' }],
  shiba: ['shiba', { g: '#e8a04c', G: '#c27a2c', l: '#fbe3bf', s: '#e8a04c', w: '#fff3dc', e: DARK, n: DARK, p: PINK, f: '#f0b468', F: '#c27a2c', q: '#fff3dc' }],
  poodle: ['poodle', { g: '#a9713f', G: '#7a4c28', l: '#c48a55', s: '#a9713f', w: '#a9713f', e: DARK, n: DARK, p: PINK, f: '#a9713f', F: '#7a4c28', q: '#c48a55' }],
  cheese: ['cat', { g: '#f2a64a', G: '#d07f2a', l: '#f2a64a', s: '#d07f2a', w: '#fff3dc', e: DARK, n: PINK, p: PINK, f: '#f2a64a', F: '#d07f2a', q: '#fff3dc' }],
  tuxedo: ['cat', { g: '#3a3542', G: '#262229', l: '#3a3542', s: '#3a3542', w: '#fff7ea', e: '#ffd34d', n: PINK, p: PINK, f: '#3a3542', F: '#262229', q: '#fff7ea' }],
  graycat: ['cat', { g: '#8e97ab', G: '#6c7488', l: '#8e97ab', s: '#8e97ab', w: '#b3bbcb', e: '#2f7d46', n: '#5f626e', p: PINK, f: '#8e97ab', F: '#6c7488', q: '#b3bbcb' }],
};
export const PET_IDS = Object.keys(PET_PAL);
for (const [id, [body, pal]] of Object.entries(PET_PAL)) {
  def(`pet_${id}_a`, [...PET_ROWS[body], ...PET_LEGS.a], { pal });
  def(`pet_${id}_b`, [...PET_ROWS[body], ...PET_LEGS.b], { pal });
  def(`pet_${id}_sleep`, [...PET_ROWS[body], ...PET_LEGS.sleep], { pal: { ...pal, e: pal.G } }); // 눈을 감는다
}

// ───── 옷 ─────
// 동물 그림과 같은 16칸 폭으로, 그 위에 겹쳐 그린다.

// 모자: 7줄이 동물 그림의 -3~3번 줄에 놓인다. (머리 꼭대기가 2번 줄)
const hat = (name, rows) => def(`wear_${name}`, ['................', ...rows, '................']);
hat('hat_ribbon', [
  '................',
  '................',
  '................',
  '........oo.oo...',
  '........ooOoo...',
]);
hat('hat_chef', [
  '........wwwww...',
  '.......wwwwwww..',
  '.......wwwwwww..',
  '........wwwww...',
  '........lllll...',
]);
hat('hat_straw', [
  '................',
  '.........yyy....',
  '........yyyyy...',
  '........ooooo...',
  '......yyyyyyyYY.',
]);
hat('hat_beret', [
  '................',
  '..........r.....',
  '.........rrr....',
  '.......rrrrrrr..',
  '........RRRRR...',
]);
hat('hat_crown', [
  '................',
  '................',
  '........y.y.y...',
  '........yyyyy...',
  '........yryry...',
]);
hat('hat_santa', [
  '..........r.....',
  '.........rrr....',
  '........rrrrrw..',
  '........rrrrr...',
  '.......wwwwwww..',
]);
hat('hat_antler', [
  '................',
  '.......b.b.b.b..',
  '........bb.bb...',
  '.........b.b....',
  '........rrrrr...',
]);

// 목과 옷: 동물 그림의 0~10번 줄과 그대로 겹친다. 몸 안쪽에만 칠하므로 바깥선은 없다.
const EMPTY = '................';
const onBody = (name, rows) => def(`wear_${name}`, [...Array(11 - rows.length).fill(EMPTY), ...rows], { outline: false });
onBody('neck_scarf', ['.......o........', '......oooO......']);
onBody('neck_bow', ['.......rRr......']);
onBody('neck_bell', ['......rryr......']);
onBody('body_stripe', [
  '..owow..........',
  '.wowow..........',
  '.wowowo.........',
  '.wowowo.........',
  '.wowowowo.......',
]);
onBody('body_apron', [
  '..wwww..........',
  '.wwwww..........',
  '.wwooww.........',
  '.wwooww.........',
  '.llllllll.......',
]);
onBody('body_raincoat', [
  '..yyyy..........',
  '.yyyyy..........',
  '.yyyyyy.........',
  '.yyYyyy.........',
  '.YYYYYYYY.......',
]);
onBody('body_sweater', [
  '..pPpP..........',
  '.pPpPp..........',
  '.PpPpPp.........',
  '.pPpPpP.........',
  '.PpPpPpPp.......',
]);
onBody('body_santa', [
  '..rrrr..........',
  '.rrrrr..........',
  '.rrrrrr.........',
  '.kkykkk.........',
  '.wwwwwwww.......',
]);

// 가게 얼굴(첫 화면, 액자, 앱 아이콘)에 쓰는 정면 슈나우저
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

// 넓히기 방향 화살표. 왼쪽은 오른쪽 그림을 뒤집어 쓴다.
const ARROW_UP = [
  '................',
  '................',
  '.......oo.......',
  '......oooo......',
  '.....oooooo.....',
  '....oooooooo....',
  '...oooooooooo...',
  '......oooo......',
  '......oooo......',
  '......oooo......',
  '......oooo......',
  '......oooo......',
  '......oooo......',
  '................',
  '................',
  '................',
];
def('arrow_up', ARROW_UP);
def('arrow_down', [...ARROW_UP].reverse());
def('arrow_right', [
  '................',
  '................',
  '................',
  '.........o......',
  '.........oo.....',
  '.........ooo....',
  '...oooooooooo...',
  '...ooooooooooo..',
  '...ooooooooooo..',
  '...oooooooooo...',
  '.........ooo....',
  '.........oo.....',
  '.........o......',
  '................',
  '................',
  '................',
]);

// ───── 나만의 메뉴 아이콘 ─────

// 아이콘 그리기에서 고를 수 있는 색
export const ICON_COLORS = ['w', 'c', 'y', 'a', 'o', 'r', 'R', 'p', 'n', 'N', 'u', 'b', 'B', 'l', 'g', 'K'];
export const ICON_SIZE = 16;
const blank = n => Array(n).fill(EMPTY);
// 밑그림: 그릇만 그려 두고 음식은 직접 칠한다.
export const ICON_TEMPLATES = {
  blank: { name: '빈 칸', rows: blank(16) },
  bowl: {
    name: '그릇',
    rows: [...blank(9),
      '.wwwwwwwwwwwwww.',
      '.wwwwwwwwwwwwww.',
      '..wwwwwwwwwwww..',
      '..lwwwwwwwwwwl..',
      '...llwwwwwwll...',
      '....llllllll....',
      EMPTY],
  },
  plate: { name: '접시', rows: [...blank(10), ...PLATE] },
  cup: {
    name: '컵',
    rows: [...blank(4),
      '....wwwwwwww....', '....wwwwwwww....', '....wwwwwwww....', '....wwwwwwww....',
      '....wwwwwwww....', '....wwwwwwww....', '....wwwwwwww....', '....lwwwwwwl....',
      '.....llllll.....',
      ...blank(3)],
  },
};

// 저장된 아이콘이 그릴 수 있는 모양인지 (16줄 × 16칸, 허용한 색만)
export function validIcon(rows) {
  return Array.isArray(rows) && rows.length === ICON_SIZE
    && rows.every(r => typeof r === 'string' && r.length === ICON_SIZE && [...r].every(ch => ch === '.' || ICON_COLORS.includes(ch)));
}

// ───── 래스터화 ─────

export const SPRITE_NAMES = Object.keys(RAW);

// 글자 그림 → {w, h, data: RGBA Uint8ClampedArray}
function paint(rows, pal, name) {
  const h = rows.length, w = rows[0].length;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.') continue;
      const hex = (pal && pal[ch]) || PAL[ch];
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

// 브라우저와 아이콘 생성 스크립트가 같이 쓴다.
export function rasterize(name) {
  const s = RAW[name];
  if (!s) throw new Error(`unknown sprite: ${name}`);
  return paint(s.outline ? withOutline(s.rows) : s.rows, s.pal, name);
}

// 브라우저 전용. atlas[name]에 그림을, atlas[name + '~']에 좌우 반전본을 넣는다.
function put(atlas, name, { w, h, data }) {
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

export function buildAtlas() {
  const atlas = {};
  for (const name of SPRITE_NAMES) put(atlas, name, rasterize(name));
  return atlas;
}

// 플레이어가 그린 아이콘을 atlas에 넣는다(다시 그리면 덮어쓴다).
export function setSprite(atlas, name, rows) {
  put(atlas, name, paint(withOutline(rows), null, name));
}
