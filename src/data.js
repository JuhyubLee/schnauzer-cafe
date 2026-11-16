// 게임 수치. 메뉴·가구·가격을 바꾸려면 이 파일만 고치면 된다.

// time: 조리 시간(초), n: 한 번에 나오는 그릇 수, price: 한 그릇 값, lv: 열리는 레벨
// 이름은 실제 상표와 겹치지 않는 흔한 말로 쓴다.
// id는 저장 데이터에 들어가므로 이름을 바꿔도 id는 그대로 둔다.
export const RECIPES = [
  { id: 'americano', name: '아이스 아메리카노', icon: 'f_americano', lv: 1, cost: 8, time: 15, n: 4, price: 5, xp: 3 },
  { id: 'riceball', name: '참치 주먹밥', icon: 'f_riceball', lv: 1, cost: 20, time: 40, n: 5, price: 9, xp: 5 },
  { id: 'tteok', name: '매운 떡볶이', icon: 'f_tteok', lv: 2, cost: 55, time: 120, n: 8, price: 15, xp: 12 },
  { id: 'coolpis', name: '복숭아 주스', icon: 'f_coolpis', lv: 2, cost: 12, time: 30, n: 6, price: 5, xp: 4 },
  { id: 'buldak', name: '매콤 볶음면', icon: 'f_buldak', lv: 3, cost: 90, time: 300, n: 8, price: 24, xp: 22 },
  { id: 'egg', name: '폭신 계란찜', icon: 'f_egg', lv: 4, cost: 70, time: 480, n: 6, price: 28, xp: 26 },
  { id: 'rose', name: '로제 파스타', icon: 'f_rose', lv: 5, cost: 160, time: 900, n: 10, price: 36, xp: 45 },
  { id: 'cream', name: '크림 파스타', icon: 'f_cream', lv: 6, cost: 220, time: 1800, n: 12, price: 42, xp: 70 },
  { id: 'cheesetteok', name: '치즈 폭탄 떡볶이', icon: 'f_cheesetteok', lv: 7, cost: 300, time: 3600, n: 14, price: 50, xp: 110 },
  { id: 'buldakpasta', name: '매콤 크림 파스타', icon: 'f_buldakpasta', lv: 8, cost: 420, time: 10800, n: 16, price: 64, xp: 200 },
];
export const RECIPE = Object.fromEntries(RECIPES.map(r => [r.id, r]));

// 나만의 메뉴: 이름과 그림은 자유, 수치는 세 등급 중에서 고른다. (기본 메뉴와 같은 수치라 균형이 안 깨진다)
export const CUSTOM_TIERS = {
  quick: { name: '간단 메뉴', lv: 1, cost: 15, time: 30, n: 5, price: 6, xp: 4 },
  meal: { name: '든든 메뉴', lv: 3, cost: 90, time: 300, n: 8, price: 24, xp: 22 },
  special: { name: '특별 메뉴', lv: 6, cost: 220, time: 1800, n: 12, price: 42, xp: 70 },
};
export const MAX_CUSTOM = 6;
export const CUSTOM_NAME_MAX = 10;

// 계절 한정: 그 달(1~12)에만 살 수 있다. 사 둔 것은 언제든 쓸 수 있다. 달은 기기 시계를 따른다.
export const SEASONS = {
  spring: { name: '봄', months: [3, 4, 5] },
  summer: { name: '여름', months: [6, 7, 8] },
  autumn: { name: '가을', months: [9, 10, 11] },
  winter: { name: '겨울', months: [12, 1, 2] },
  xmas: { name: '크리스마스', months: [11, 12] },
};
// 계절 한정이 아니거나(season 없음) 지금이 그 계절이면 살 수 있다.
export const onSale = (thing, date = new Date()) => !thing.season || SEASONS[thing.season].months.includes(date.getMonth() + 1);

// 설정에서 고르는 배경 노래. 곡과 '계절에 맞춰'의 규칙은 music.js에 있다.
export const SONG_CHOICES = {
  auto: '계절에 맞춰', main: '오르골 왈츠', spring: '봄', summer: '여름', autumn: '가을', winter: '겨울', xmas: '크리스마스',
};

// 꾸미기 목록에서 가구를 나눠 보여 주는 분류
export const FURN_GROUPS = { seat: '테이블·의자', kitchen: '주방', deco: '장식', light: '조명', mat: '깔개', season: '계절' };

// group: 위의 분류, block: 지나갈 수 없음, charm: 분위기 점수(손님이 더 자주 오고 팁을 준다)
// table: 옆에 스툴을 붙이면 손님 자리가 되는 가구, light: 밤에 둘레를 밝히는 빛의 색
// season: 계절 한정(SEASONS의 이름), blink: 번갈아 보여 줄 두 번째 그림
// stamps: 코인으로는 못 사고 도장 가게에서 이만큼의 도장으로 받는 것(price가 없다)
export const FURN = {
  stool: { name: '주황 스툴', sprite: 'stool', group: 'seat', price: 25, lv: 1, block: true },
  table: { name: '원목 테이블', sprite: 'table', group: 'seat', price: 60, lv: 1, block: true, table: true },
  table_white: { name: '하얀 테이블', sprite: 'table_white', group: 'seat', price: 90, lv: 2, block: true, table: true, charm: 1 },
  table_orange: { name: '주황 테이블', sprite: 'table_orange', group: 'seat', price: 110, lv: 3, block: true, table: true, charm: 1 },
  table_check: { name: '체크 식탁보 테이블', sprite: 'table_check', group: 'seat', price: 160, lv: 5, block: true, table: true, charm: 2 },
  stove: { name: '화구', sprite: 'stove', group: 'kitchen', price: 250, lv: 1, block: true },
  plant: { name: '초록 화분', sprite: 'plant', group: 'deco', price: 40, lv: 1, block: true, charm: 2 },
  flower: { name: '주황 꽃 화분', sprite: 'flower', group: 'deco', price: 70, lv: 3, block: true, charm: 3 },
  shelf: { name: '책장', sprite: 'shelf', group: 'deco', price: 180, lv: 5, block: true, charm: 5 },
  aquarium: { name: '수족관', sprite: 'aquarium', blink: 'aquarium_b', group: 'deco', price: 1500, lv: 6, block: true, charm: 8 },
  fountain: { name: '분수', sprite: 'fountain', blink: 'fountain_b', group: 'deco', price: 4000, lv: 10, block: true, charm: 12 },
  musicbox: { name: '오르골', sprite: 'musicbox', blink: 'musicbox_b', group: 'deco', stamps: 15, lv: 1, block: true, charm: 8 },
  trophy: { name: '단골 트로피', sprite: 'trophy', group: 'deco', stamps: 25, lv: 1, block: true, charm: 10 },
  candle: { name: '양초', sprite: 'candle', group: 'light', price: 50, lv: 1, block: true, charm: 1, light: '#ffc46e' },
  lantern: { name: '랜턴', sprite: 'lantern', group: 'light', price: 90, lv: 2, block: true, charm: 2, light: '#ffd76e' },
  lamp_mush: { name: '버섯 무드등', sprite: 'lamp_mush', group: 'light', price: 150, lv: 3, block: true, charm: 3, light: '#ff9c8c' },
  lamp: { name: '스탠드 조명', sprite: 'lamp', group: 'light', price: 120, lv: 4, block: true, charm: 4, light: '#ffba6e' },
  lamp_mint: { name: '민트 스탠드 조명', sprite: 'lamp_mint', group: 'light', price: 200, lv: 6, block: true, charm: 4, light: '#9bdccb' },
  fireplace: { name: '벽난로', sprite: 'fireplace', blink: 'fireplace_b', group: 'light', price: 2500, lv: 8, block: true, charm: 10, light: '#ff9a4c' },
  rug: { name: '주황 러그', sprite: 'rug', group: 'mat', price: 30, lv: 2, block: false, charm: 1 },
  dogbed: { name: '폭신 방석', sprite: 'dogbed', group: 'mat', price: 90, lv: 2, block: false, charm: 2 },
  xmas_tree: { name: '크리스마스 트리', sprite: 'xmas_tree', blink: 'xmas_tree_b', group: 'season', season: 'xmas', price: 300, lv: 1, block: true, charm: 6, light: '#ffd76e' },
  gift: { name: '선물 상자', sprite: 'gift', group: 'season', season: 'xmas', price: 80, lv: 1, block: true, charm: 2 },
  snowman: { name: '눈사람', sprite: 'snowman', group: 'season', season: 'winter', price: 120, lv: 1, block: true, charm: 3 },
  blossom: { name: '벚꽃 화분', sprite: 'blossom', group: 'season', season: 'spring', price: 90, lv: 1, block: true, charm: 3 },
  fan: { name: '선풍기', sprite: 'fan', group: 'season', season: 'summer', price: 100, lv: 1, block: true, charm: 2 },
  pumpkin: { name: '호박 장식', sprite: 'pumpkin', group: 'season', season: 'autumn', price: 60, lv: 1, block: true, charm: 2 },
};

// 동물 친구. id는 sprites.js의 PET_PAL과 같아야 한다.
// hatDy: 머리 높이가 달라서 모자를 몇 줄 내려(+) 또는 올려(-) 씌울지. nick: 이름을 안 지었을 때 쓰는 이름
// fav: 좋아하는 간식(TREATS의 이름). 주면 친밀도가 두 배로 오른다.
export const PETS = {
  schnauzer: { name: '슈나우저', hatDy: 0, nick: '슈슈', fav: 'jerky' },
  maltese: { name: '말티즈', hatDy: 0, nick: '몽이', fav: 'cake' },
  shiba: { name: '시바견', hatDy: 1, nick: '콩이', fav: 'biscuit' },
  poodle: { name: '푸들', hatDy: -1, nick: '초코', fav: 'cake' },
  cheese: { name: '치즈 고양이', hatDy: 1, nick: '치즈', fav: 'jerky' },
  tuxedo: { name: '턱시도 고양이', hatDy: 1, nick: '턱시', fav: 'biscuit' },
  graycat: { name: '회색 고양이', hatDy: 1, nick: '구름', fav: 'cake' },
};
// n번째 친구를 데려오는 조건 (첫 친구는 가게를 열 때 고른다)
export const PET_SLOTS = [{ lv: 1, price: 0 }, { lv: 4, price: 600 }, { lv: 8, price: 2500 }];
export const PET_NAME_MAX = 6;

// 친밀도 단계. 친밀도(love)가 이 값 이상이면 그 단계다. perk는 그 단계부터 생기는 일(game.js가 실제로 한다).
export const BONDS = [
  { love: 0, name: '서먹서먹' },
  { love: 15, name: '친구', perk: '손님을 반겨서, 손님이 주문을 더 오래 기다려 줘요' },
  { love: 50, name: '단짝', perk: '가끔 작은 선물을 물어 와요' },
  { love: 120, name: '가족', perk: '쓰다듬으면 두 배로 오래 신나요' },
  { love: 300, name: '영혼의 단짝', perk: '평소에도 더 빨리 서빙해요' },
];
export const bondOf = love => {
  let stage = 0;
  while (stage + 1 < BONDS.length && love >= BONDS[stage + 1].love) stage++;
  return stage;
};

// 간식. 코인으로 사서 바로 준다. love: 오르는 친밀도(좋아하는 간식이면 두 배).
export const TREATS = {
  biscuit: { name: '바삭 과자', icon: 't_biscuit', price: 30, love: 2 },
  jerky: { name: '쫀득 육포', icon: 't_jerky', price: 90, love: 6 },
  cake: { name: '미니 케이크', icon: 't_cake', price: 250, love: 16 },
};
export const TREATS_PER_DAY = 3; // 친구 한 마리가 하루에 먹는 간식 수

// 오늘의 주문: 날마다 이 가운데 DAILY_COUNT가지가 온다. 목표 수는 base + perLv × 레벨.
// 하나 끝낼 때마다 도장 1개, 그날 것을 다 끝내면 1개 더.
export const DAILY = {
  sell: { text: n => `음식 ${n}그릇 팔기`, base: 15, perLv: 3 },
  cook: { text: n => `요리 ${n}번 하기`, base: 3, perLv: 0.5 },
  serve: { text: n => `손님에게 직접 ${n}번 가져다주기`, base: 8, perLv: 1 },
  pet: { text: n => `친구 ${n}번 쓰다듬기`, base: 5, perLv: 0 },
  treat: { text: n => `친구에게 간식 ${n}번 주기`, base: 1, perLv: 0 },
  earn: { text: n => `코인 ${n}개 벌기`, base: 150, perLv: 50 },
};
export const DAILY_COUNT = 3;

// 오늘 날짜를 저장에 적는 글. 날짜가 바뀌었는지 볼 때 쓴다(기기 시계 기준).
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

// 놀러 가기: 친구 가게를 구경하고 오면 받는 코인. 가게마다 하루 한 번, 하루에 GIFTS_PER_DAY번까지.
export const VISIT_GIFT = 30;
export const GIFTS_PER_DAY = 3;

// 앱 정보. 버전은 스토어에 올릴 때마다 올린다(android/app/build.gradle, ios 프로젝트와 같이).
export const APP_VERSION = '1.3.0';
// 웹 버전이 있는 주소. 초대장 링크와 개인정보 처리방침이 여기에 있다. 바꾸면 이미 보낸 초대장이 안 열린다.
export const SITE_URL = 'https://juhyublee.github.io/schnauzer-cafe/';
export const PRIVACY_URL = `${SITE_URL}privacy.html`;
// 가게 모습을 맡아 두는 서버(Supabase). 이 키는 앱에 넣어 쓰라고 나온 공개 키다. 가게 표는 직접 읽거나 쓸 수 없고 server/schema.sql의 함수로만 다룬다.
export const SERVER_URL = 'https://pvqzntzwcuymnizcxkxz.supabase.co';
export const SERVER_KEY = 'sb_publishable_OTD7C59V_E078KTx5ITbeg_joyFOWdS';

// 옷. slot마다 하나씩 입는다. 그림은 sprites.js의 wear_<id>.
// season: 계절 한정, stamps: 도장 가게에서만 받는 것(FURN과 같다)
export const WEAR_SLOTS = { hat: '모자', face: '얼굴', neck: '목', body: '옷', back: '등' };
export const WEAR = {
  hat_ribbon: { name: '주황 리본', slot: 'hat', price: 80 },
  hat_chef: { name: '요리사 모자', slot: 'hat', price: 150 },
  hat_straw: { name: '밀짚모자', slot: 'hat', price: 200 },
  hat_beret: { name: '빨간 베레모', slot: 'hat', price: 250 },
  hat_crown: { name: '왕관', slot: 'hat', price: 800 },
  hat_flower: { name: '꽃 화관', slot: 'hat', stamps: 5 },
  face_glasses: { name: '동그란 안경', slot: 'face', price: 150 },
  face_sun: { name: '선글라스', slot: 'face', price: 300 },
  neck_scarf: { name: '주황 스카프', slot: 'neck', price: 60 },
  neck_bow: { name: '나비넥타이', slot: 'neck', price: 120 },
  neck_bell: { name: '방울 목걸이', slot: 'neck', price: 180 },
  body_apron: { name: '하얀 앞치마', slot: 'body', price: 100 },
  body_stripe: { name: '줄무늬 티', slot: 'body', price: 150 },
  body_sweater: { name: '분홍 스웨터', slot: 'body', price: 250 },
  body_raincoat: { name: '노란 우비', slot: 'body', price: 300 },
  back_bag: { name: '빨간 책가방', slot: 'back', price: 200 },
  back_balloon: { name: '빨간 풍선', slot: 'back', price: 250 },
  back_wings: { name: '천사 날개', slot: 'back', stamps: 10 },
  hat_santa: { name: '산타 모자', slot: 'hat', price: 200, season: 'xmas' },
  hat_antler: { name: '루돌프 머리띠', slot: 'hat', price: 180, season: 'xmas' },
  body_santa: { name: '산타 옷', slot: 'body', price: 300, season: 'xmas' },
};

// 레벨별 화구 최대 개수: [레벨, 개수]
export const STOVE_LIMITS = [[1, 1], [2, 2], [4, 3], [6, 4], [9, 5]];
// 화구 강화: 단계별 조리 시간 배수와 다음 단계 비용
export const STOVE_SPEED = [1, 0.85, 0.7];
export const STOVE_UPGRADE_COST = [300, 900];

export const FLOORS = {
  wood: { name: '나무 바닥', price: 0, lv: 1 },
  tile: { name: '크림 타일', price: 3, lv: 1 },
  check: { name: '주황 체크', price: 4, lv: 2 },
  mint: { name: '민트 타일', price: 5, lv: 4 },
};

export const WALLS = {
  cream: { name: '크림 벽지', price: 0, lv: 1 },
  orange: { name: '주황 줄무늬', price: 150, lv: 2 },
  gingham: { name: '분홍 체크', price: 200, lv: 3 },
  tile: { name: '하얀 타일', price: 250, lv: 3 },
  brick: { name: '빨간 벽돌', price: 300, lv: 4 },
  mint: { name: '민트 도트', price: 300, lv: 5 },
  plank: { name: '나무 판벽', price: 450, lv: 6 },
  flower: { name: '꽃무늬 벽지', price: 600, lv: 7 },
  navy: { name: '남색 별무늬', price: 900, lv: 9 },
};

// 벽 액자에 거는 사진의 크기(픽셀). 고른 사진을 이 크기로 줄여서 저장한다.
export const PHOTO_W = 22;
export const PHOTO_H = 18;
export const PHOTO_MAX_CHARS = 12000;

// 처음 가게의 크기와 문 자리(왼쪽에서 0부터 센 칸)
export const START_ROWS = 6;
export const START_COLS = 8;
export const START_DOOR = 6;
// 위아래로 넓히기: 현재 줄 수 → 다음 줄을 여는 조건
export const EXPANSIONS = {
  6: { lv: 2, price: 200 },
  7: { lv: 3, price: 500 },
  8: { lv: 5, price: 1200 },
  9: { lv: 7, price: 3000 },
  10: { lv: 9, price: 7000 },
};
// 옆으로 넓히기: 현재 칸 수 → 다음 칸을 여는 조건. 가게 전체가 폰 화면에 한 번에 들어오도록 두 칸까지만 늘린다.
export const WIDENINGS = {
  8: { lv: 6, price: 2500 },
  9: { lv: 10, price: 8000 },
};
export const EXPAND_DIRS = { up: '위로', down: '아래로', left: '왼쪽으로', right: '오른쪽으로' };

// 누적 경험치 기준. LEVEL_XP[i] 이상이면 레벨 i+1.
export const LEVEL_XP = [0, 20, 60, 140, 280, 500, 850, 1400, 2200, 3400, 5200, 8000];

export const levelOf = xp => {
  let lv = 1;
  while (lv < LEVEL_XP.length && xp >= LEVEL_XP[lv]) lv++;
  return lv;
};

export const stoveLimit = lv => {
  let n = 1;
  for (const [need, count] of STOVE_LIMITS) if (lv >= need) n = count;
  return n;
};

export const fmtTime = sec => {
  sec = Math.max(0, Math.ceil(sec));
  if (sec < 60) return `${sec}초`;
  if (sec < 3600) return sec % 60 ? `${Math.floor(sec / 60)}분 ${sec % 60}초` : `${sec / 60}분`;
  const m = Math.floor((sec % 3600) / 60);
  return m ? `${Math.floor(sec / 3600)}시간 ${m}분` : `${Math.floor(sec / 3600)}시간`;
};
