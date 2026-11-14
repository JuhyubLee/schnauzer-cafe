// 게임 수치. 메뉴·가구·가격을 바꾸려면 이 파일만 고치면 된다.

// time: 조리 시간(초), n: 한 번에 나오는 그릇 수, price: 한 그릇 값, lv: 열리는 레벨
export const RECIPES = [
  { id: 'americano', name: '아이스 아메리카노', icon: 'f_americano', lv: 1, cost: 8, time: 15, n: 4, price: 5, xp: 3 },
  { id: 'riceball', name: '참치 주먹밥', icon: 'f_riceball', lv: 1, cost: 20, time: 40, n: 5, price: 9, xp: 5 },
  { id: 'tteok', name: '엽기 떡볶이', icon: 'f_tteok', lv: 2, cost: 55, time: 120, n: 8, price: 15, xp: 12 },
  { id: 'coolpis', name: '쿨피스', icon: 'f_coolpis', lv: 2, cost: 12, time: 30, n: 6, price: 5, xp: 4 },
  { id: 'buldak', name: '불닭볶음면', icon: 'f_buldak', lv: 3, cost: 90, time: 300, n: 8, price: 24, xp: 22 },
  { id: 'egg', name: '폭신 계란찜', icon: 'f_egg', lv: 4, cost: 70, time: 480, n: 6, price: 28, xp: 26 },
  { id: 'rose', name: '로제 파스타', icon: 'f_rose', lv: 5, cost: 160, time: 900, n: 10, price: 36, xp: 45 },
  { id: 'cream', name: '크림 파스타', icon: 'f_cream', lv: 6, cost: 220, time: 1800, n: 12, price: 42, xp: 70 },
  { id: 'cheesetteok', name: '치즈 폭탄 떡볶이', icon: 'f_cheesetteok', lv: 7, cost: 300, time: 3600, n: 14, price: 50, xp: 110 },
  { id: 'buldakpasta', name: '불닭 크림 파스타', icon: 'f_buldakpasta', lv: 8, cost: 420, time: 10800, n: 16, price: 64, xp: 200 },
];
export const RECIPE = Object.fromEntries(RECIPES.map(r => [r.id, r]));

// block: 지나갈 수 없음, charm: 분위기 점수(손님이 더 자주 오고 팁을 준다)
export const FURN = {
  stool: { name: '주황 스툴', sprite: 'stool', price: 25, lv: 1, block: true },
  table: { name: '원목 테이블', sprite: 'table', price: 60, lv: 1, block: true },
  stove: { name: '화구', sprite: 'stove', price: 250, lv: 1, block: true },
  plant: { name: '초록 화분', sprite: 'plant', price: 40, lv: 1, block: true, charm: 2 },
  rug: { name: '주황 러그', sprite: 'rug', price: 30, lv: 2, block: false, charm: 1 },
  dogbed: { name: '강아지 방석', sprite: 'dogbed', price: 90, lv: 2, block: false, charm: 2 },
  flower: { name: '주황 꽃 화분', sprite: 'flower', price: 70, lv: 3, block: true, charm: 3 },
  lamp: { name: '스탠드 조명', sprite: 'lamp', price: 120, lv: 4, block: true, charm: 4 },
  shelf: { name: '책장', sprite: 'shelf', price: 180, lv: 5, block: true, charm: 5 },
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
  brick: { name: '빨간 벽돌', price: 300, lv: 4 },
  mint: { name: '민트 도트', price: 300, lv: 5 },
};

export const START_ROWS = 6;
// 확장: 현재 줄 수 → 다음 줄을 여는 조건
export const EXPANSIONS = {
  6: { lv: 2, price: 200 },
  7: { lv: 3, price: 500 },
  8: { lv: 5, price: 1200 },
  9: { lv: 7, price: 3000 },
  10: { lv: 9, price: 7000 },
};

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
