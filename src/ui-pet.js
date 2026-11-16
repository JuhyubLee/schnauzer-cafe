// 동물 친구 창: 쓰다듬기, 친밀도 단계, 점장 맡기기, 간식, 옷장, 이름과 모습 바꾸기, 새 친구 데려오기.
import {
  G, bestLevel, petById, petPet, feed, fedToday, wear, renamePet, setSpecies, adopt, adoptSlot, save,
  setPost, isHere, shopOfType, shopNo, josa,
} from './game.js';
import { PETS, PET_NAME_MAX, WEAR, WEAR_SLOTS, SEASONS, BONDS, TREATS, TREATS_PER_DAY, SHOP_TYPES, bondOf, onSale } from './data.js';
import { $, esc, setHTML } from './dom.js';
import { sfx } from './sfx.js';

export function createPetUI({ icon, coin, toast, openSheet, closeSheet, renderer, refresh }) {
  let current = null; // 지금 보고 있는 친구 id
  let trying = null; // 사기 전에 입혀 보는 옷 id. 같은 옷을 한 번 더 눌러야(구매 확정) 산다.
  let treating = null; // 한 번 눌러 둔 간식 id. 한 번 더 눌러야(구매 확정) 사서 준다.

  // 친밀도 단계와 그 단계에서 생기는 일. 창이 열려 있는 동안 바뀌므로 live에서 다시 그린다.
  function bondHTML(pet) {
    const stage = bondOf(pet.love), next = BONDS[stage + 1];
    const lo = BONDS[stage].love;
    const perks = BONDS.slice(1).map((b, i) => (i < stage
      ? `<li><img class="px" src="${icon('heart')}" alt=""><span>${b.perk}</span></li>`
      : `<li class="muted"><span>${b.name}(친밀도 ${b.love})부터: ${b.perk}</span></li>`)).join('');
    return `<p>${PETS[pet.species].name} · <b>${BONDS[stage].name}</b> · 친밀도 <b>${pet.love}</b></p>
      <div class="xpbar"><i style="width:${next ? Math.round(((pet.love - lo) / (next.love - lo)) * 100) : 100}%"></i></div>
      <p class="muted">${next ? `'${next.name}'까지 ${next.love - pet.love} 남았어요` : '더없이 친한 사이예요'}</p>
      <ul class="list">${perks}</ul>`;
  }

  const speciesCards = (picked, worn, act) => Object.entries(PETS).map(([id, p]) =>
    `<button type="button" class="card ${id === picked ? 'on' : ''}" data-act="${act}" data-id="${id}">
      <img class="px" src="${renderer.petURL(id, worn)}" alt=""><b>${p.name}</b></button>`).join('');

  // again: 같은 창을 다시 그리는 중(스크롤 위치를 지킨다)
  function openPets(id = current, again = false) {
    const s = G.state;
    const pet = petById(id) || s.pets[0];
    current = pet.id;
    if (!again) { trying = null; treating = null; }
    const shown = trying ? { ...pet.wear, [WEAR[trying].slot]: trying } : pet.wear;
    const sideScroll = again ? [...document.querySelectorAll('#sheetBody .hscroll')].map(el => el.scrollLeft) : [];

    const chips = s.pets.map(p =>
      `<button type="button" class="chip ${p.id === pet.id ? 'on' : ''}" data-act="pick" data-id="${p.id}">
        <img class="px" src="${renderer.petURL(p.species, p.wear, true)}" alt=""><span>${esc(p.name)}${p.post ? ' · 점장' : ''}</span></button>`).join('')
      + (adoptSlot() ? '<button type="button" class="chip" data-act="adopt"><span>+ 새 친구</span></button>' : '');

    // 점장: 가게가 둘 이상일 때만 보인다. 맡은 가게가 있으면 그만두기, 없으면 가게마다 맡기기 단추.
    const awayNow = !isHere(pet); // 점장으로 다른 가게에 가 있어서 지금 가게에는 없다
    const shops = Object.keys(SHOP_TYPES).filter(shopOfType);
    const postShop = pet.post && shopOfType(pet.post);
    const posts = shops.length < 2 ? '' : `<hr>
      <p><b>점장</b></p>
      <p class="muted">점장은 맡은 가게에 남아요. 내가 다른 가게에 있는 동안 그 가게에 진열된 것을 천천히 팔고, 친할수록 빨리 팔아요. 가게마다 한 마리이고, 데리고 다닐 친구가 한 마리는 있어야 해요.</p>
      ${postShop
    ? `<p>지금 <b>${shopNo(pet.post)}호점 ${esc(postShop.shopName)}</b>의 점장이에요</p>
        <button type="button" class="btn" data-act="unpost">점장 그만두고 데리고 다니기</button>`
    : shops.map(type => `<button type="button" class="btn" data-act="post" data-id="${type}">${shopNo(type)}호점 ${esc(shopOfType(type).shopName)} 점장 맡기기</button>`).join('')}`;

    const closet = Object.entries(WEAR_SLOTS).map(([slot, slotName]) => {
      const cards = Object.entries(WEAR).filter(([, w]) => w.slot === slot).map(([wid, w]) => {
        const wearing = pet.wear[slot] === wid, owned = s.closet.includes(wid), buying = trying === wid;
        const off = !owned && !onSale(w); // 계절 한정 옷은 그 계절에만 살 수 있다
        const sub = wearing ? '입는 중' : owned ? '입히기' : w.stamps ? `도장 ${w.stamps}개` : off ? `${SEASONS[w.season].name} 한정`
          : buying ? `${coin(w.price)}<br>구매 확정` : coin(w.price);
        return `<button type="button" class="card ${wearing ? 'on' : buying ? 'try' : ''}" data-act="wear" data-id="${wid}" ${off ? 'disabled' : ''}>
          <img class="px" src="${renderer.petURL(pet.species, { ...pet.wear, [slot]: wid })}" alt=""><b>${w.name}</b><small>${sub}</small></button>`;
      }).join('');
      return `<p><b>${slotName}</b></p><div class="hscroll">${cards}</div>`;
    }).join('');

    const fed = fedToday(pet), full = fed >= TREATS_PER_DAY;
    const treats = Object.entries(TREATS).map(([tid, t]) => {
      const fav = PETS[pet.species].fav === tid, buying = treating === tid;
      const sub = full ? '오늘은 배불러요' : buying ? `${coin(t.price)}<br>구매 확정`
        : `친밀도 +${t.love * (fav ? 2 : 1)}<br>${coin(t.price)}`;
      return `<button type="button" class="card ${buying ? 'try' : ''}" data-act="treat" data-id="${tid}" ${full ? 'disabled' : ''}>
        <img class="px" src="${icon(t.icon)}" alt=""><b>${t.name}</b><small>${fav ? '좋아해요!<br>' : ''}${sub}</small></button>`;
    }).join('');

    openSheet(pet.name, `
      <div class="chips">${chips}</div>
      <div class="center stack">
        <img class="px hero" src="${renderer.petURL(pet.species, shown)}" alt="">
        <button type="button" class="btn primary big" data-act="pet">${esc(pet.name)} 쓰다듬기</button>
        <p class="muted">쓰다듬으면 창이 닫히고 가게에서 좋아하는 모습이 보여요. 신나서 한동안 더 빨리 서빙하고, 친밀도가 1 올라요. 신나 있는 동안에는 더 쓰다듬어도 오르지 않아요. 가게에서 직접 눌러도 돼요.</p>
      </div>
      <div id="petBond" class="stack"></div>
      ${posts}
      <hr>
      <p><b>간식</b> <small class="muted">오늘 ${fed}/${TREATS_PER_DAY}</small></p>
      <p class="muted">간식을 주면 친밀도가 많이 올라요. 친구마다 하루에 ${TREATS_PER_DAY}개까지 먹어요. 한 번 누르고, 한 번 더 눌러 구매 확정해야 사요. 주고 나면 창이 닫히고 가게에서 먹는 모습이 보여요.</p>
      <div class="hscroll">${treats}</div>
      <hr>
      <p><b>옷장</b></p>
      <p class="muted">없는 옷은 한 번 누르면 입혀 보고, 한 번 더 눌러 구매 확정해야 사요. 산 옷은 모든 친구가 같이 입을 수 있고, 입은 옷을 다시 누르면 벗어요. 도장이 적힌 옷은 주문 창의 도장 가게에서 받아요.</p>
      ${closet}
      <hr>
      <label class="field">이름<input id="petName" maxlength="${PET_NAME_MAX}" value="${esc(pet.name)}" autocomplete="off"></label>
      <button type="button" class="btn" data-act="rename">이름 바꾸기</button>
      <p><b>모습 바꾸기</b></p>
      <div class="hscroll">${speciesCards(pet.species, pet.wear, 'species')}</div>`, {
      keepScroll: again,
      live() { setHTML($('petBond'), bondHTML(pet)); },
      actions: {
        pick(el) { sfx('tap'); openPets(Number(el.dataset.id)); },
        adopt() { sfx('tap'); openAdopt(); },
        // 쓰다듬거나 간식을 주면 창을 닫는다. 창이 가게를 가려서 친구가 좋아하는 모습이 안 보이기 때문이다.
        pet() {
          if (awayNow) { toast(`${josa(pet.name, '은', '는')} 지금 ${shopNo(pet.post)}호점을 맡고 있어요`); return; }
          closeSheet();
          petPet(pet.id);
        },
        post(el) { if (setPost(pet.id, el.dataset.id)) { sfx('place'); changed(); } },
        unpost() { if (setPost(pet.id, null)) { sfx('place'); changed(); } },
        treat(el) {
          const tid = el.dataset.id;
          if (treating !== tid) {
            treating = tid;
            trying = null;
            sfx('tap');
            openPets(pet.id, true);
            return;
          }
          treating = null;
          if (!feed(pet.id, tid)) { openPets(pet.id, true); return; }
          save();
          refresh();
          closeSheet();
        },
        wear(el) {
          const wid = el.dataset.id;
          if (!s.closet.includes(wid) && WEAR[wid].stamps) { toast(`주문 창의 도장 가게에서 도장 ${WEAR[wid].stamps}개로 받을 수 있어요`); return; }
          if (!s.closet.includes(wid) && trying !== wid) {
            trying = wid;
            treating = null;
            sfx('tap');
            openPets(pet.id, true);
            return;
          }
          trying = null;
          if (!wear(pet.id, wid)) { openPets(pet.id, true); return; }
          sfx('place');
          changed();
        },
        species(el) { setSpecies(pet.id, el.dataset.id); sfx('place'); changed(); },
        rename() {
          if (!renamePet(pet.id, $('petName').value)) return;
          toast('이름을 바꿨어요');
          changed();
        },
      },
    });
    document.querySelectorAll('#sheetBody .hscroll').forEach((el, i) => { el.scrollLeft = sideScroll[i] || 0; });

    function changed() {
      save();
      refresh();
      openPets(pet.id, true);
    }
  }

  function openAdopt() {
    const slot = adoptSlot();
    let picked = Object.keys(PETS)[0];
    const locked = bestLevel() < slot.lv;
    const draw = (typed = '') => {
      openSheet('새 친구 데려오기', `
        <p class="muted">친구가 늘면 서빙도 그만큼 빨라져요.</p>
        <div class="hscroll">${speciesCards(picked, {}, 'species')}</div>
        <label class="field">친구 이름<input id="adoptName" maxlength="${PET_NAME_MAX}" value="${esc(typed)}" placeholder="${PETS[picked].nick}" autocomplete="off"></label>
        <button type="button" class="btn primary big" data-act="go" ${locked ? 'disabled' : ''}>${locked ? `레벨 ${slot.lv}부터 데려올 수 있어요` : `데려오기 ${coin(slot.price)}`}</button>
        <button type="button" class="btn" data-act="back">돌아가기</button>`, {
        actions: {
          species(el) {
            const left = document.querySelector('#sheetBody .hscroll').scrollLeft;
            picked = el.dataset.id;
            draw($('adoptName').value);
            document.querySelector('#sheetBody .hscroll').scrollLeft = left;
          },
          go(el) {
            if (slot.price && !el.dataset.sure) {
              el.dataset.sure = '1';
              el.innerHTML = `구매 확정 ${coin(slot.price)}`;
              sfx('tap');
              return;
            }
            const id = adopt(picked, $('adoptName').value.trim() || PETS[picked].nick);
            if (!id) return;
            sfx('level');
            save();
            refresh();
            openPets(id);
          },
          back() { openPets(); },
        },
      });
    };
    draw();
  }

  return { openPets };
}
