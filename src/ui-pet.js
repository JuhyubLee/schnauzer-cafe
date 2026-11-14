// 동물 친구 창: 쓰다듬기, 옷장, 이름과 모습 바꾸기, 새 친구 데려오기.
import { G, level, petById, petPet, wear, renamePet, setSpecies, adopt, adoptSlot, save } from './game.js';
import { PETS, PET_NAME_MAX, WEAR, WEAR_SLOTS, SEASONS, onSale } from './data.js';
import { $, esc, setText } from './dom.js';
import { sfx } from './sfx.js';

export function createPetUI({ icon, coin, toast, openSheet, renderer, refresh }) {
  let current = null; // 지금 보고 있는 친구 id
  let trying = null; // 사기 전에 입혀 보는 옷 id. 같은 옷을 한 번 더 눌러야(구매 확정) 산다.

  const speciesCards = (picked, worn, act) => Object.entries(PETS).map(([id, p]) =>
    `<button type="button" class="card ${id === picked ? 'on' : ''}" data-act="${act}" data-id="${id}">
      <img class="px" src="${renderer.petURL(id, worn)}" alt=""><b>${p.name}</b></button>`).join('');

  // again: 같은 창을 다시 그리는 중(스크롤 위치를 지킨다)
  function openPets(id = current, again = false) {
    const s = G.state;
    const pet = petById(id) || s.pets[0];
    current = pet.id;
    if (!again) trying = null;
    const shown = trying ? { ...pet.wear, [WEAR[trying].slot]: trying } : pet.wear;
    const sideScroll = again ? [...document.querySelectorAll('#sheetBody .hscroll')].map(el => el.scrollLeft) : [];

    const chips = s.pets.map(p =>
      `<button type="button" class="chip ${p.id === pet.id ? 'on' : ''}" data-act="pick" data-id="${p.id}">
        <img class="px" src="${renderer.petURL(p.species, p.wear, true)}" alt=""><span>${esc(p.name)}</span></button>`).join('')
      + (adoptSlot() ? '<button type="button" class="chip" data-act="adopt"><span>+ 새 친구</span></button>' : '');

    const closet = Object.entries(WEAR_SLOTS).map(([slot, slotName]) => {
      const cards = Object.entries(WEAR).filter(([, w]) => w.slot === slot).map(([wid, w]) => {
        const wearing = pet.wear[slot] === wid, owned = s.closet.includes(wid), buying = trying === wid;
        const off = !owned && !onSale(w); // 계절 한정 옷은 그 계절에만 살 수 있다
        const sub = wearing ? '입는 중' : owned ? '입히기' : off ? `${SEASONS[w.season].name} 한정`
          : buying ? `${coin(w.price)}<br>구매 확정` : coin(w.price);
        return `<button type="button" class="card ${wearing ? 'on' : buying ? 'try' : ''}" data-act="wear" data-id="${wid}" ${off ? 'disabled' : ''}>
          <img class="px" src="${renderer.petURL(pet.species, { ...pet.wear, [slot]: wid })}" alt=""><b>${w.name}</b><small>${sub}</small></button>`;
      }).join('');
      return `<p><b>${slotName}</b></p><div class="hscroll">${cards}</div>`;
    }).join('');

    openSheet(pet.name, `
      <div class="chips">${chips}</div>
      <div class="center stack">
        <img class="px hero" src="${renderer.petURL(pet.species, shown)}" alt="">
        <p>${PETS[pet.species].name} · <img class="px" src="${icon('heart')}" alt="" width="18" height="16"> 친밀도 <b id="petLove"></b></p>
        <button type="button" class="btn primary big" data-act="pet">${esc(pet.name)} 쓰다듬기</button>
        <p class="muted">쓰다듬으면 신나서 20초 동안 더 빨리 서빙해요. 가게에서 직접 눌러도 돼요.</p>
      </div>
      <hr>
      <p><b>옷장</b></p>
      <p class="muted">없는 옷은 한 번 누르면 입혀 보고, 한 번 더 눌러 구매 확정해야 사요. 산 옷은 모든 친구가 같이 입을 수 있고, 입은 옷을 다시 누르면 벗어요.</p>
      ${closet}
      <hr>
      <label class="field">이름<input id="petName" maxlength="${PET_NAME_MAX}" value="${esc(pet.name)}" autocomplete="off"></label>
      <button type="button" class="btn" data-act="rename">이름 바꾸기</button>
      <p><b>모습 바꾸기</b></p>
      <div class="hscroll">${speciesCards(pet.species, pet.wear, 'species')}</div>`, {
      keepScroll: again,
      live() { setText($('petLove'), pet.love); },
      actions: {
        pick(el) { sfx('tap'); openPets(Number(el.dataset.id)); },
        adopt() { sfx('tap'); openAdopt(); },
        pet() { petPet(pet.id); },
        wear(el) {
          const wid = el.dataset.id;
          if (!s.closet.includes(wid) && trying !== wid) {
            trying = wid;
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
    const locked = level() < slot.lv;
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
