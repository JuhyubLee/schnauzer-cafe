// 골목 화면: 내 가게들을 보고 옮겨 다니고, 조건이 되면 새 가게를 연다. 문을 누르거나 가게 설정에서 연다.
import { G, shopOfType, shopNo, openError, openShop, switchShop, furnOf, josa, managerOf, awaySales } from './game.js';
import { SHOP_TYPES, SHOP_NAME_MAX, levelOf } from './data.js';
import { $, esc } from './dom.js';
import { sfx } from './sfx.js';

export function createAlleyUI({ icon, coin, toast, news, openSheet, closeSheet, refresh }) {
  function open() {
    const now = Date.now();
    const rows = Object.entries(SHOP_TYPES).map(([type, cfg]) => {
      const shop = shopOfType(type), no = shopNo(type);
      const img = `<img class="px" src="${icon(cfg.icon)}" alt="">`;
      if (shop) {
        const here = shop === G.state;
        const ready = shop.items.filter(it => it.cook && now >= it.cook.end).length;
        const manager = managerOf(type), sold = awaySales(type);
        return `<div class="row">${img}
          <span class="meta"><b>${no}호점 ${esc(shop.shopName)}</b>
            <small>${cfg.name} · Lv ${levelOf(shop.xp)} · ${coin(shop.coins)}</small>
            ${ready ? `<small>다 된 것 ${ready}개</small>` : ''}
            ${manager ? `<small>점장 ${esc(manager.name)}</small>` : ''}
            ${sold ? `<small>그동안 ${sold.n}번 팔았어요</small>` : ''}</span>
          <span class="right">${here ? '<small>지금 여기</small>'
    : `<button type="button" class="btn primary" data-act="go" data-id="${type}">들어가기</button>`}</span></div>`;
      }
      const { after, lv, price } = cfg.opens, from = shopOfType(after);
      if (!from || levelOf(from.xp) < lv) {
        return `<div class="row locked">${img}
          <span class="meta"><b>${no}호점 ${cfg.name}</b><small>${openError(type)}</small></span><span class="right"></span></div>`;
      }
      // 여는 조건(레벨)이 됐다. 코인이 모자라면 눌렀을 때 알려 준다.
      return `<div class="row">${img}
          <span class="meta"><b>${no}호점 ${cfg.name}</b><small>이제 열 수 있어요</small></span><span class="right"></span></div>
        <label class="field">새 가게 이름<input id="openName" maxlength="${SHOP_NAME_MAX}" placeholder="우리 ${cfg.name}" autocomplete="off"></label>
        <button type="button" class="btn primary big" data-act="open" data-id="${type}">개업하기 ${coin(price)}</button>
        <p class="muted">개업 비용은 ${shopNo(after)}호점 지갑에서 내요. 새 가게는 코인 100개로 처음부터 키워요. 동물 친구, 옷, 도장, 보관한 가구는 가게들이 같이 써요.</p>`;
    }).join('');
    openSheet('꼬순내 골목', `<div class="stack">
        <p class="muted">가게마다 지갑과 레벨이 따로예요. 손님은 들어가 있는 가게에만 오고, 다른 가게에서는 올려 둔 것이 익기만 해요. 친구 창에서 점장을 맡기면 그 가게에 진열된 것을 천천히 팔아 줘요.</p>
        ${rows}</div>`, {
      actions: {
        go(el) {
          if (!switchShop(el.dataset.id)) return;
          sfx('tap');
          closeSheet();
          refresh();
          // 점장이 그동안 판 소식이 먼저 떴으면 그 뒤에 이어서 보여 준다(toast는 앞의 알림을 덮는다)
          news(`${shopNo(G.state.type)}호점 ${G.state.shopName}에 왔어요`);
        },
        // 코인이 드는 일이라 같은 단추를 한 번 더 눌러야 연다.
        open(el) {
          const type = el.dataset.id;
          if (!el.dataset.sure) {
            const err = openError(type);
            if (err) { toast(err); sfx('err'); return; }
            el.dataset.sure = '1';
            el.textContent = '한 번 더 누르면 가게를 열어요';
            return;
          }
          const name = $('openName').value.trim() || $('openName').placeholder;
          if (!openShop(type, name)) { open(); return; }
          sfx('level');
          closeSheet();
          refresh();
          toast(`${shopNo(type)}호점을 열었어요! ${josa(furnOf('stove').name, '을', '를')} 눌러 처음 팔 것을 만들어 보세요`);
        },
      },
    });
  }
  return { open };
}
