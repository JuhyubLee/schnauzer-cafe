// 오늘의 주문과 도장. 날마다 주문 세 가지가 오고, 하나 끝낼 때마다 도장 1개, 그날 것을 다 끝내면 1개 더 받는다.
// 도장은 도장 가게에서만 쓴다. 거기 물건(data.js에서 stamps가 붙은 옷과 가구)은 코인으로는 살 수 없다.
import { G, emit } from './game.js';
import { DAILY, DAILY_COUNT, FURN, WEAR, dayKey, levelOf } from './data.js';

// 날짜 글에서 그날의 주문 종류를 고른다. 같은 날에는 언제 열어도 같은 주문이 나온다.
function kindsFor(day) {
  let seed = 0;
  for (const ch of day) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const next = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
  const kinds = Object.keys(DAILY);
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  return kinds.slice(0, DAILY_COUNT);
}

// 오늘의 주문 { day, goals: [{ kind, need, n }] }. 날짜가 바뀌었으면 새로 만든다. 목표 수는 만들 때의 레벨로 정해진다.
// 구경 중에도 내 가게(G.home)의 주문을 본다.
export function daily() {
  const s = G.home || G.state, day = dayKey();
  if (s.daily?.day !== day) {
    const lv = levelOf(s.xp);
    s.daily = {
      day,
      goals: kindsFor(day).map(kind => ({ kind, need: Math.round(DAILY[kind].base + DAILY[kind].perLv * lv), n: 0 })),
    };
  }
  return s.daily;
}

export const goalText = goal => DAILY[goal.kind].text(goal.need);
export const goalDone = goal => goal.n >= goal.need;

// 게임에서 일이 일어날 때마다 부른다(game.js). 그 종류의 주문이 있으면 채우고, 다 채웠으면 도장을 준다.
// 구경 중이거나 아직 가게를 열지 않았으면 세지 않는다.
export function bump(kind, n = 1) {
  const s = G.state;
  if (G.visit || !s.started) return;
  const d = daily(), goal = d.goals.find(g => g.kind === kind);
  if (!goal || goalDone(goal)) return;
  goal.n = Math.min(goal.need, goal.n + n);
  if (!goalDone(goal)) return;
  const all = d.goals.every(goalDone);
  s.stamps += all ? 2 : 1;
  emit('daily', { goal, all });
}

// 도장 가게에 있는 것들: [{ id, name, cost, kind: 'wear' | 'furn', owned }]
export function stampShop() {
  const s = G.state;
  return [
    ...Object.entries(WEAR).filter(([, w]) => w.stamps).map(([id, w]) =>
      ({ id, name: w.name, cost: w.stamps, kind: 'wear', owned: s.closet.includes(id) })),
    ...Object.entries(FURN).filter(([, f]) => f.stamps).map(([id, f]) =>
      ({ id, name: f.name, cost: f.stamps, kind: 'furn', owned: false })),
  ];
}

// 도장으로 받는다. 옷은 옷장에, 가구는 보관함에 들어간다(꾸미기에서 꺼내 놓는다). 받았으면 true.
export function buyWithStamps(id) {
  const s = G.state, item = stampShop().find(i => i.id === id);
  if (!item || item.owned) return false;
  if (s.stamps < item.cost) { emit('toast', '도장이 모자라요'); return false; }
  s.stamps -= item.cost;
  if (item.kind === 'wear') s.closet.push(id);
  else s.inv[id] = (s.inv[id] || 0) + 1;
  return true;
}
