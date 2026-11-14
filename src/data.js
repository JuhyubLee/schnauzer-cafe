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

// 꾸미기 목록에서 가구를 나눠 보여 주는 분류
export const FURN_GROUPS = { seat: '테이블·의자', kitchen: '주방', deco: '장식', mat: '깔개' };

// group: 위의 분류, block: 지나갈 수 없음, charm: 분위기 점수(손님이 더 자주 오고 팁을 준다)
// table: 옆에 스툴을 붙이면 손님 자리가 되는 가구, light: 밤에 둘레를 밝히는 가구
export const FURN = {
  stool: { name: '주황 스툴', sprite: 'stool', group: 'seat', price: 25, lv: 1, block: true },
  table: { name: '원목 테이블', sprite: 'table', group: 'seat', price: 60, lv: 1, block: true, table: true },
  table_white: { name: '하얀 테이블', sprite: 'table_white', group: 'seat', price: 90, lv: 2, block: true, table: true, charm: 1 },
  table_orange: { name: '주황 테이블', sprite: 'table_orange', group: 'seat', price: 110, lv: 3, block: true, table: true, charm: 1 },
  table_check: { name: '체크 식탁보 테이블', sprite: 'table_check', group: 'seat', price: 160, lv: 5, block: true, table: true, charm: 2 },
  stove: { name: '화구', sprite: 'stove', group: 'kitchen', price: 250, lv: 1, block: true },
  plant: { name: '초록 화분', sprite: 'plant', group: 'deco', price: 40, lv: 1, block: true, charm: 2 },
  flower: { name: '주황 꽃 화분', sprite: 'flower', group: 'deco', price: 70, lv: 3, block: true, charm: 3 },
  lamp: { name: '스탠드 조명', sprite: 'lamp', group: 'deco', price: 120, lv: 4, block: true, charm: 4, light: true },
  shelf: { name: '책장', sprite: 'shelf', group: 'deco', price: 180, lv: 5, block: true, charm: 5 },
  rug: { name: '주황 러그', sprite: 'rug', group: 'mat', price: 30, lv: 2, block: false, charm: 1 },
  dogbed: { name: '폭신 방석', sprite: 'dogbed', group: 'mat', price: 90, lv: 2, block: false, charm: 2 },
};

// 동물 친구. id는 sprites.js의 PET_PAL과 같아야 한다.
// hatDy: 머리 높이가 달라서 모자를 몇 줄 내려(+) 또는 올려(-) 씌울지. nick: 이름을 안 지었을 때 쓰는 이름
export const PETS = {
  schnauzer: { name: '슈나우저', hatDy: 0, nick: '슈슈' },
  maltese: { name: '말티즈', hatDy: 0, nick: '몽이' },
  shiba: { name: '시바견', hatDy: 1, nick: '콩이' },
  poodle: { name: '푸들', hatDy: -1, nick: '초코' },
  cheese: { name: '치즈 고양이', hatDy: 1, nick: '치즈' },
  tuxedo: { name: '턱시도 고양이', hatDy: 1, nick: '턱시' },
  graycat: { name: '회색 고양이', hatDy: 1, nick: '구름' },
};
// n번째 친구를 데려오는 조건 (첫 친구는 가게를 열 때 고른다)
export const PET_SLOTS = [{ lv: 1, price: 0 }, { lv: 4, price: 600 }, { lv: 8, price: 2500 }];
export const PET_NAME_MAX = 6;

// 놀러 가기: 친구 가게를 구경하고 오면 받는 코인. 가게마다 하루 한 번, 하루에 GIFTS_PER_DAY번까지.
export const VISIT_GIFT = 30;
export const GIFTS_PER_DAY = 3;

// 앱 정보. 버전은 스토어에 올릴 때마다 올린다(android/app/build.gradle, ios 프로젝트와 같이).
export const APP_VERSION = '1.1.0';
// 웹 버전이 있는 주소. 초대장 링크와 개인정보 처리방침이 여기에 있다. 바꾸면 이미 보낸 초대장이 안 열린다.
export const SITE_URL = 'https://juhyublee.github.io/schnauzer-cafe/';
export const PRIVACY_URL = `${SITE_URL}privacy.html`;

// 옷. slot마다 하나씩 입는다. 그림은 sprites.js의 wear_<id>.
export const WEAR_SLOTS = { hat: '모자', neck: '목', body: '옷' };
export const WEAR = {
  hat_ribbon: { name: '주황 리본', slot: 'hat', price: 80 },
  hat_chef: { name: '요리사 모자', slot: 'hat', price: 150 },
  hat_straw: { name: '밀짚모자', slot: 'hat', price: 200 },
  hat_beret: { name: '빨간 베레모', slot: 'hat', price: 250 },
  hat_crown: { name: '왕관', slot: 'hat', price: 800 },
  neck_scarf: { name: '주황 스카프', slot: 'neck', price: 60 },
  neck_bow: { name: '나비넥타이', slot: 'neck', price: 120 },
  neck_bell: { name: '방울 목걸이', slot: 'neck', price: 180 },
  body_apron: { name: '하얀 앞치마', slot: 'body', price: 100 },
  body_stripe: { name: '줄무늬 티', slot: 'body', price: 150 },
  body_sweater: { name: '분홍 스웨터', slot: 'body', price: 250 },
  body_raincoat: { name: '노란 우비', slot: 'body', price: 300 },
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
