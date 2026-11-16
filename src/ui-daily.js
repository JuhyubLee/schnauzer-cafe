// 주문 창: 오늘의 주문과 도장 가게.
import { G, save } from './game.js';
import { daily, goalText, goalDone, stampShop, buyWithStamps } from './daily.js';
import { FURN, WEAR, DAILY_COUNT } from './data.js';
import { sfx } from './sfx.js';

export function createDailyUI({ icon, toast, openSheet, renderer, refresh }) {
  let picking = null; // 한 번 눌러 둔 도장 가게 물건 id. 한 번 더 눌러야(받기 확정) 받는다.

  const stamp = n => `<span class="coin"><img class="px" src="${icon('stamp')}" alt="도장">${n}</span>`;

  // again: 같은 창을 다시 그리는 중(스크롤 위치를 지킨다)
  function openDaily(again = false) {
    const s = G.state, d = daily();
    if (!again) picking = null;
    const pet = s.pets[0];

    const goals = d.goals.map(g => `<li class="${goalDone(g) ? 'done' : ''}">
        <img class="px" src="${icon('stamp')}" alt="">
        <span>${goalText(g)}</span>
        <b>${goalDone(g) ? '끝!' : `${g.n}/${g.need}`}</b></li>`).join('');

    const shop = stampShop().map(item => {
      const taking = picking === item.id;
      const img = item.kind === 'wear' ? renderer.petURL(pet.species, { [WEAR[item.id].slot]: item.id }) : icon(FURN[item.id].sprite);
      const have = item.kind === 'furn' ? s.inv[item.id] || 0 : 0;
      const sub = item.owned ? '옷장에 있어요' : taking ? `${stamp(item.cost)}<br>받기 확정` : `${stamp(item.cost)}${have ? `<br>보관 ${have}개` : ''}`;
      return `<button type="button" class="card ${taking ? 'try' : ''}" data-act="take" data-id="${item.id}" ${item.owned ? 'disabled' : ''}>
        <img class="px" src="${img}" alt=""><b>${item.name}</b><small>${sub}</small></button>`;
    }).join('');

    openSheet('오늘의 주문', `
      <p class="muted">날마다 주문이 ${DAILY_COUNT}가지 와요. 하나 끝낼 때마다 도장 1개, 다 끝내면 1개를 더 받아요. 자정이 지나면 새 주문으로 바뀌어요.</p>
      <ul class="list goals">${goals}</ul>
      <hr>
      <p><b>도장 가게</b> · 가진 도장 ${stamp(s.stamps)}</p>
      <p class="muted">도장으로만 받을 수 있는 것들이에요. 한 번 누르고, 한 번 더 눌러 받기 확정해야 받아요. 옷은 옷장에, 가구는 꾸미기의 장식 칸에 들어가요.</p>
      <div class="hscroll">${shop}</div>`, {
      keepScroll: again,
      actions: {
        take(el) {
          const id = el.dataset.id;
          if (picking !== id) {
            picking = id;
            sfx('tap');
            openDaily(true);
            return;
          }
          picking = null;
          if (buyWithStamps(id)) {
            sfx('level');
            toast(FURN[id] ? '받았어요! 꾸미기의 장식 칸에서 꺼내 놓아 보세요' : '받았어요! 친구 옷장에서 입혀 보세요');
            save();
            refresh();
          }
          openDaily(true);
        },
      },
    });
  }

  // 아래 '주문' 버튼에 붙는 글: 남은 주문 수
  const label = () => {
    const left = daily().goals.filter(g => !goalDone(g)).length;
    return left ? `주문 ${left}` : '주문 끝';
  };

  return { openDaily, label };
}
