// 게임 수치. 메뉴·가구·가격을 바꾸려면 이 파일만 고치면 된다.

// time: 조리 시간(초), n: 한 번에 나오는 그릇 수, price: 한 그릇 값, lv: 열리는 레벨
// shop: 이 메뉴를 파는 가게(SHOP_TYPES의 이름). 안 적으면 분식. 가게마다 수치의 크기는 같게 둔다(지갑이 따로라서).
// 이름은 실제 상표와 겹치지 않는 흔한 말로 쓴다.
// id는 저장 데이터에 들어가므로 이름을 바꿔도 id는 그대로 둔다. 가게끼리도 겹치지 않게 짓는다.
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
  { id: 'latte', name: '카페라테', icon: 'f_latte', lv: 1, cost: 8, time: 15, n: 4, price: 5, xp: 3, shop: 'cafe' },
  { id: 'cookie', name: '버터 쿠키', icon: 'f_cookie', lv: 1, cost: 20, time: 40, n: 5, price: 9, xp: 5, shop: 'cafe' },
  { id: 'croissant', name: '크루아상', icon: 'f_croissant', lv: 2, cost: 55, time: 120, n: 8, price: 15, xp: 12, shop: 'cafe' },
  { id: 'lemonade', name: '레몬에이드', icon: 'f_lemonade', lv: 2, cost: 12, time: 30, n: 6, price: 5, xp: 4, shop: 'cafe' },
  { id: 'muffin', name: '초코 머핀', icon: 'f_muffin', lv: 3, cost: 90, time: 300, n: 8, price: 24, xp: 22, shop: 'cafe' },
  { id: 'pudding', name: '커스터드 푸딩', icon: 'f_pudding', lv: 4, cost: 70, time: 480, n: 6, price: 28, xp: 26, shop: 'cafe' },
  { id: 'tart', name: '과일 타르트', icon: 'f_tart', lv: 5, cost: 160, time: 900, n: 10, price: 36, xp: 45, shop: 'cafe' },
  { id: 'cheesecake', name: '치즈 케이크', icon: 'f_cheesecake', lv: 6, cost: 220, time: 1800, n: 12, price: 42, xp: 70, shop: 'cafe' },
  { id: 'tiramisu', name: '티라미수', icon: 'f_tiramisu', lv: 7, cost: 300, time: 3600, n: 14, price: 50, xp: 110, shop: 'cafe' },
  { id: 'shortcake', name: '딸기 생크림 케이크', icon: 'f_shortcake', lv: 8, cost: 420, time: 10800, n: 16, price: 64, xp: 200, shop: 'cafe' },
  // worn: 입을 수 있는 옷이면, 산 손님의 모습을 어떻게 바꾸는지(sprites.js의 wornSprite). 없으면 손에 들고 나간다.
  //   top: 윗옷 [밝은 색, 어두운 색], bottom: 바지 색, skirt: 치마 색(다리가 보인다), cap: 모자 [색, 챙 색]
  { id: 'socks', name: '양말', icon: 'f_socks', lv: 1, cost: 8, time: 15, n: 4, price: 5, xp: 3, shop: 'clothes' },
  { id: 'hanky', name: '손수건', icon: 'f_hanky', lv: 1, cost: 20, time: 40, n: 5, price: 9, xp: 5, shop: 'clothes' },
  { id: 'tshirt', name: '티셔츠', icon: 'f_tshirt', lv: 2, cost: 55, time: 120, n: 8, price: 15, xp: 12, shop: 'clothes', worn: { top: ['#f58a1f', '#cf6410'] } },
  { id: 'cap', name: '야구 모자', icon: 'f_cap', lv: 2, cost: 12, time: 30, n: 6, price: 5, xp: 4, shop: 'clothes', worn: { cap: ['#e2432c', '#a82a1c'] } },
  { id: 'totebag', name: '에코백', icon: 'f_totebag', lv: 3, cost: 90, time: 300, n: 8, price: 24, xp: 22, shop: 'clothes' },
  { id: 'vest', name: '니트 조끼', icon: 'f_vest', lv: 4, cost: 70, time: 480, n: 6, price: 28, xp: 26, shop: 'clothes', worn: { top: ['#66ad5c', '#3f7a45'] } },
  { id: 'jeans', name: '청바지', icon: 'f_jeans', lv: 5, cost: 160, time: 900, n: 10, price: 36, xp: 45, shop: 'clothes', worn: { bottom: '#5b9bd8' } },
  { id: 'dress', name: '원피스', icon: 'f_dress', lv: 6, cost: 220, time: 1800, n: 12, price: 42, xp: 70, shop: 'clothes', worn: { top: ['#f7a8a0', '#e07a78'], skirt: '#f7a8a0' } },
  { id: 'coat', name: '코트', icon: 'f_coat', lv: 7, cost: 300, time: 3600, n: 14, price: 50, xp: 110, shop: 'clothes', worn: { top: ['#9a6842', '#6b4329'] } },
  { id: 'hanbok', name: '한복', icon: 'f_hanbok', lv: 8, cost: 420, time: 10800, n: 16, price: 64, xp: 200, shop: 'clothes', worn: { top: ['#ffd34d', '#e0a520'], bottom: '#e2432c' } },
];
export const RECIPE = Object.fromEntries(RECIPES.map(r => [r.id, r]));

// 나만의 메뉴: 이름과 그림은 자유, 수치는 세 등급 중에서 고른다. (기본 메뉴와 같은 수치라 균형이 안 깨진다)
// 등급 이름은 가게마다 다르다(SHOP_TYPES의 custom.tiers).
export const CUSTOM_TIERS = {
  quick: { lv: 1, cost: 15, time: 30, n: 5, price: 6, xp: 4 },
  meal: { lv: 3, cost: 90, time: 300, n: 8, price: 24, xp: 22 },
  special: { lv: 6, cost: 220, time: 1800, n: 12, price: 42, xp: 70 },
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
// 되팔기: 코인으로 산 가구와 옷은 산 값에 이 비율을 곱한 값에 판다. 도장으로 받은 것은 값이 없어서 팔 수 없다(0).
export const SELL_RATE = 0.5;
export const sellPrice = thing => (thing.stamps || !thing.price ? 0 : Math.floor(thing.price * SELL_RATE));

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
// shop: 이 가구가 딸린 가게(안 적으면 분식). lv는 그 가게의 레벨이다. 열린 뒤에는 어느 가게에서든 사고 놓는다.
// stove는 어느 가게에서나 '요리하는 기구'다. 가게마다 이름과 그림이 다르다(SHOP_TYPES의 maker).
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
  statue: { name: '황금 슈나우저 동상', sprite: 'statue', blink: 'statue_b', group: 'deco', price: 8000, lv: 12, block: true, charm: 15 },
  musicbox: { name: '오르골', sprite: 'musicbox', blink: 'musicbox_b', group: 'deco', stamps: 15, lv: 1, block: true, charm: 8 },
  trophy: { name: '단골 트로피', sprite: 'trophy', group: 'deco', stamps: 25, lv: 1, block: true, charm: 10 },
  candle: { name: '양초', sprite: 'candle', group: 'light', price: 50, lv: 1, block: true, charm: 1, light: '#ffc46e' },
  lantern: { name: '랜턴', sprite: 'lantern', group: 'light', price: 90, lv: 2, block: true, charm: 2, light: '#ffd76e' },
  lamp_mush: { name: '버섯 무드등', sprite: 'lamp_mush', group: 'light', price: 150, lv: 3, block: true, charm: 3, light: '#ff9c8c' },
  lamp: { name: '스탠드 조명', sprite: 'lamp', group: 'light', price: 120, lv: 4, block: true, charm: 4, light: '#ffba6e' },
  lamp_mint: { name: '민트 스탠드 조명', sprite: 'lamp_mint', group: 'light', price: 200, lv: 6, block: true, charm: 4, light: '#9bdccb' },
  fireplace: { name: '벽난로', sprite: 'fireplace', blink: 'fireplace_b', group: 'light', price: 2500, lv: 8, block: true, charm: 10, light: '#ff9a4c' },
  vending: { name: '자판기', sprite: 'vending', blink: 'vending_b', group: 'light', price: 5000, lv: 11, block: true, charm: 12, light: '#cfe8ff' },
  rug: { name: '주황 러그', sprite: 'rug', group: 'mat', price: 30, lv: 2, block: false, charm: 1 },
  dogbed: { name: '폭신 방석', sprite: 'dogbed', group: 'mat', price: 90, lv: 2, block: false, charm: 2 },
  xmas_tree: { name: '크리스마스 트리', sprite: 'xmas_tree', blink: 'xmas_tree_b', group: 'season', season: 'xmas', price: 300, lv: 1, block: true, charm: 6, light: '#ffd76e' },
  gift: { name: '선물 상자', sprite: 'gift', group: 'season', season: 'xmas', price: 80, lv: 1, block: true, charm: 2 },
  snowman: { name: '눈사람', sprite: 'snowman', group: 'season', season: 'winter', price: 120, lv: 1, block: true, charm: 3 },
  blossom: { name: '벚꽃 화분', sprite: 'blossom', group: 'season', season: 'spring', price: 90, lv: 1, block: true, charm: 3 },
  fan: { name: '선풍기', sprite: 'fan', group: 'season', season: 'summer', price: 100, lv: 1, block: true, charm: 2 },
  pumpkin: { name: '호박 장식', sprite: 'pumpkin', group: 'season', season: 'autumn', price: 60, lv: 1, block: true, charm: 2 },
  table_marble: { name: '대리석 테이블', sprite: 'table_marble', group: 'seat', price: 120, lv: 2, block: true, table: true, charm: 2, shop: 'cafe' },
  menuboard: { name: '메뉴 칠판', sprite: 'menuboard', group: 'deco', price: 80, lv: 1, block: true, charm: 3, shop: 'cafe' },
  showcase: { name: '케이크 진열장', sprite: 'showcase', group: 'deco', price: 400, lv: 3, block: true, charm: 6, shop: 'cafe' },
  neon: { name: '네온 간판', sprite: 'neon', blink: 'neon_b', group: 'light', price: 600, lv: 5, block: true, charm: 6, light: '#ff9ad2', shop: 'cafe' },
  piano: { name: '피아노', sprite: 'piano', group: 'deco', price: 3000, lv: 8, block: true, charm: 12, shop: 'cafe' },
  // 옷가게(3호점). rack: 손님이 그 옆에 서서 물건을 고르는 가구(옷가게에서는 이것이 손님 자리다)
  rack: { name: '옷걸이', sprite: 'rack', group: 'seat', price: 60, lv: 1, block: true, rack: true, shop: 'clothes' },
  rack_gold: { name: '금빛 옷걸이', sprite: 'rack_gold', group: 'seat', price: 200, lv: 5, block: true, rack: true, charm: 2, shop: 'clothes' },
  mirror: { name: '전신 거울', sprite: 'mirror', group: 'deco', price: 150, lv: 2, block: true, charm: 3, shop: 'clothes' },
  // show: 파는 것 하나를 걸어 둘 수 있는 가구(걸어 둔 것은 저장의 item.show). fit: 손님이 들어가 옷을 입어 보는 가구
  mannequin: { name: '마네킹', sprite: 'mannequin', group: 'deco', price: 300, lv: 1, block: true, charm: 5, show: true, shop: 'clothes' },
  fitting: { name: '탈의실', sprite: 'fitting', group: 'deco', price: 500, lv: 2, block: true, charm: 8, fit: true, shop: 'clothes' },
};

// 동물 친구. id는 sprites.js의 PET_PAL과 같아야 한다.
// hatDy: 머리 높이가 달라서 모자를 몇 줄 내려(+) 또는 올려(-) 씌울지. nick: 이름을 안 지었을 때 쓰는 이름
// fav: 좋아하는 간식(TREATS의 이름). 주면 친밀도가 두 배로 오른다. cat: 고양이(꼬리를 느긋하게 흔든다)
// 종을 더할 때: 그림은 sprites.js의 PET_PAL(같은 id), 목소리는 sfx.js의 VOICES. 고르는 창에는 여기 적은 차례로 나온다.
// like: 1.5.0에서 더한 종에 적는다. 이 종을 모르는 예전 앱(1.4.0까지)이 내 가게를 구경할 때 대신 보여 줄 닮은 종이다.
// (예전 앱은 모르는 종이 든 초대장을 아예 못 읽는다. 그래서 초대장에는 like를 적고 진짜 종은 뒤에 덧붙인다. visit.js)
export const PETS = {
  schnauzer: { name: '슈나우저', hatDy: 0, nick: '슈슈', fav: 'jerky' },
  maltese: { name: '말티즈', hatDy: 0, nick: '몽이', fav: 'cake' },
  shiba: { name: '시바견', hatDy: 1, nick: '콩이', fav: 'biscuit' },
  poodle: { name: '푸들', hatDy: -1, nick: '초코', fav: 'cake' },
  cocker: { name: '코카스파니엘', hatDy: 0, nick: '코코', fav: 'jerky', like: 'poodle' },
  corgi: { name: '웰시코기', hatDy: 1, nick: '식빵', fav: 'biscuit', like: 'shiba' },
  pome: { name: '포메라니안', hatDy: 0, nick: '솜이', fav: 'cake', like: 'shiba' },
  bichon: { name: '비숑', hatDy: -1, nick: '구름이', fav: 'cake', like: 'maltese' },
  golden: { name: '골든 리트리버', hatDy: 0, nick: '보리', fav: 'jerky', like: 'poodle' },
  beagle: { name: '비글', hatDy: 0, nick: '호두', fav: 'biscuit', like: 'schnauzer' },
  jindo: { name: '진돗개', hatDy: 1, nick: '백구', fav: 'jerky', like: 'shiba' },
  cheese: { name: '치즈 고양이', hatDy: 1, nick: '치즈', fav: 'jerky', cat: true },
  tuxedo: { name: '턱시도 고양이', hatDy: 1, nick: '턱시', fav: 'biscuit', cat: true },
  graycat: { name: '회색 고양이', hatDy: 1, nick: '구름', fav: 'cake', cat: true },
};
// n번째 친구를 데려오는 조건 (첫 친구는 가게를 열 때 고른다). 레벨은 내 가게들 가운데 가장 높은 레벨을 본다.
export const PET_SLOTS = [{ lv: 1, price: 0 }, { lv: 4, price: 600 }, { lv: 8, price: 2500 }, { lv: 12, price: 6000 }, { lv: 12, price: 12000 }];
// 점장: 친구를 한 가게에 두면, 내가 다른 가게에 있는 동안(게임이 켜져 있을 때) 그 가게에 진열된 것을 천천히 판다.
// 직접 장사할 때 손님이 오는 속도에 이 값을 곱한 속도로 판다. 친밀도 단계마다 하나씩이다(BONDS와 같은 순서).
export const MANAGER_RATE = [0.15, 0.2, 0.25, 0.3, 0.35];
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
  sell: { text: n => `손님에게 ${n}번 팔기`, base: 15, perLv: 3 },
  cook: { text: n => `${n}번 만들기`, base: 3, perLv: 0.5 },
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
export const APP_VERSION = '1.5.0';
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
  parquet: { name: '쪽마루 바닥', price: 6, lv: 2, shop: 'cafe' },
  carpet: { name: '와인색 카펫', price: 6, lv: 2, shop: 'clothes' },
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
  gold: { name: '금빛 별무늬', price: 1500, lv: 12 },
  sage: { name: '세이지 줄무늬', price: 400, lv: 3, shop: 'cafe' },
  lilac: { name: '연보라 줄무늬', price: 400, lv: 3, shop: 'clothes' },
};

// 벽 액자에 거는 사진의 크기(픽셀). 고른 사진을 이 크기로 줄여서 저장한다.
export const PHOTO_W = 22;
export const PHOTO_H = 18;
export const PHOTO_MAX_CHARS = 12000;

// 가게 종류. 적은 순서가 1호점, 2호점이다. 저장의 맨 위에는 언제나 첫 가게(FIRST_SHOP)를 둔다. 예전 버전이 그 모양만 읽을 수 있어서다.
// 다른 가게의 값은 저장의 others에 들어간다(game.js의 '가게 여러 개').
// icon: 골목 화면에서 가게를 나타내는 그림, maker: 만드는 기구의 이름과 그림(만드는 중 그림은 이름 뒤에 _on)
// make: 만드는 일을 부르는 말, unit: 물건을 세는 말
// stand: 손님이 앉지 않고 옷걸이(rack) 옆에 서서 고르는 가게. 처음에 테이블 대신 옷걸이가 놓인다.
// stay: 손님이 한 번 먹고 가지 않고 머물며 여러 번 시키는 가게(아래 STAY_ROUNDS).
// trait: 그 가게만의 재미를 골목 화면에서 알려 주는 글. 카드의 좁은 칸에 두 줄로 들어가게 짧게 쓴다.
// opens: 여는 조건. after 가게가 lv 레벨이 되면 그 가게의 지갑에서 price를 내고 연다.
// custom: 나만의 메뉴를 그 가게에서 부르는 말. item: 파는 것을 부르는 말, sample: 이름 예시, tiers: 등급(CUSTOM_TIERS) 이름,
//   templates: 고를 수 있는 밑그림(sprites.js의 ICON_TEMPLATES). 첫째가 처음에 깔려 있다.
const FOOD_TIERS = { quick: '간단 메뉴', meal: '든든 메뉴', special: '특별 메뉴' };
export const SHOP_TYPES = {
  bunsik: {
    name: '분식', icon: 'f_tteok', make: '요리', unit: '그릇', maker: { name: '화구', sprite: 'stove' },
    trait: '손님이 자주 와요. 넉넉히 만들어 바쁘게 팔아요.',
    custom: { item: '메뉴', sample: '마라탕', tiers: FOOD_TIERS, templates: ['bowl', 'plate', 'cup', 'blank'] },
  },
  cafe: {
    name: '카페', icon: 'f_latte', make: '요리', unit: '개', stay: true, maker: { name: '커피 머신', sprite: 'espresso' },
    trait: '손님이 머물며 여러 번 시켜요. 끝까지 챙기면 단골이 돼요.',
    custom: { item: '메뉴', sample: '딸기 라테', tiers: FOOD_TIERS, templates: ['cup', 'plate', 'bowl', 'blank'] },
    opens: { after: 'bunsik', lv: 12, price: 15000 },
  },
  clothes: {
    name: '옷가게', icon: 'f_tshirt', make: '만들기', unit: '벌', stand: true, display: true, maker: { name: '재봉틀', sprite: 'sewing' },
    trait: '마네킹에 입힌 옷이 잘 팔려요. 손님이 입어 보고 입은 채로 나가요.',
    custom: { item: '옷', sample: '멜빵바지', tiers: { quick: '간단한 옷', meal: '멋진 옷', special: '특별한 옷' }, templates: ['shirt', 'dress', 'blank'] },
    opens: { after: 'cafe', lv: 12, price: 20000 },
  },
};
export const FIRST_SHOP = 'bunsik';
// 머무는 가게(stay)의 손님 한 명이 시키는 횟수: [분위기, 횟수]. 분위기가 그 값 이상이면 그 횟수만큼 시킨다.
export const STAY_ROUNDS = [[0, 2], [15, 3], [40, 4]];
export const stayRounds = charm => STAY_ROUNDS.reduce((n, [need, rounds]) => (charm >= need ? rounds : n), 1);
export const STAY_REST = 8; // 다 먹고 다음 것을 시킬 때까지 쉬는 시간(초)
// 단골: 시킨 것을 끝까지 다 받고 나간 손님. REGULAR_EVERY명마다 감사 선물(코인)을 받는다.
export const REGULAR_EVERY = 10;
export const regularGift = lv => 20 + 10 * lv;
// 진열하는 가게(display): 마네킹(show인 가구)에 걸어 둔 것은 손님이 더 자주 찾고(DISPLAY_PULL의 확률로 그 가운데서 고른다) 값을 더 받는다.
export const DISPLAY_PULL = 0.5;
export const DISPLAY_BONUS = 1.15;
export const FIT_TIME = 3; // 탈의실 안에서 입어 보는 시간(초). 입어 보고 산 손님은 꼭 팁을 준다.
export const POSE_TIME = 1.5; // 새 옷을 입고 나와 탈의실 앞에서 뽐내는 시간(초)
// 메뉴·가구·바닥·벽지가 딸린 가게
export const shopOf = item => item.shop || FIRST_SHOP;
export const SHOP_NAME_MAX = 12;
// 가게마다 파는 메뉴
export const SHOP_RECIPES = Object.fromEntries(Object.keys(SHOP_TYPES).map(type => [type, RECIPES.filter(r => shopOf(r) === type)]));
// 그 가게에서 본 가구 정보. 요리 기구(stove)만 가게마다 이름과 그림이 다르다.
const MAKERS = Object.fromEntries(Object.entries(SHOP_TYPES).map(([type, shop]) => [type, { ...FURN.stove, ...shop.maker }]));
export const furnIn = (shopType, id) => (id === 'stove' ? MAKERS[shopType] : FURN[id]);

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

// 누적 경험치 기준. LEVEL_XP[i] 이상이면 레벨 i+1. 메뉴·가구·넓히기는 이 표의 마지막 레벨(TOP_LEVEL)까지에서 다 열린다.
export const LEVEL_XP = [0, 20, 60, 140, 280, 500, 850, 1400, 2200, 3400, 5200, 8000];
export const TOP_LEVEL = LEVEL_XP.length;
// 그 뒤로도 레벨은 끝없이 오른다(2026-11-16 사용자). 새로 열리는 것은 없고 레벨 선물만 받는다.
// TOP_LEVEL 다음 레벨은 LATER_XP만큼, 그다음부터는 레벨마다 LATER_STEP씩 더 모아야 오른다(하루 30분쯤이면 3~4일에 한 레벨).
export const LATER_XP = 3000;
export const LATER_STEP = 300;
// lv 레벨이 되는 데 필요한 누적 경험치
export const levelXp = lv => {
  if (lv <= TOP_LEVEL) return LEVEL_XP[lv - 1];
  const k = lv - TOP_LEVEL;
  return LEVEL_XP[TOP_LEVEL - 1] + LATER_XP * k + LATER_STEP * k * (k - 1) / 2;
};

export const levelOf = xp => {
  let lv = 1;
  while (xp >= levelXp(lv + 1)) lv++;
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
