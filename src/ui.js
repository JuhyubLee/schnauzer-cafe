// 캔버스 밖의 화면: 위쪽 정보, 아래 버튼, 꾸미기 패널, 올라오는 창.
// 친구(옷장)와 나만의 메뉴 화면은 ui-pet.js, ui-menu.js에 있다.
import {
  G, on, level, hint, charm, seatCount, stoves, cookState, itemById, recipeOf, allRecipes,
  startCook, collect, costOf, enterEdit, exitEdit, storeItem, upgradeCost, expandCfg,
  askWall, askExpand, askUpgrade, pendingInfo, confirmPending, save, reset, startGame, exportSave, importSave,
} from './game.js';
import {
  FURN, FURN_GROUPS, FLOORS, WALLS, EXPAND_DIRS, LEVEL_XP, PETS, MAX_CUSTOM, APP_VERSION, PRIVACY_URL, stoveLimit, fmtTime,
} from './data.js';
import { $, esc, setText, setHTML, setSrc, copyText } from './dom.js';
import { share } from './device.js';
import { sfx } from './sfx.js';
import { syncMusic } from './music.js';
import { createPetUI } from './ui-pet.js';
import { createMenuUI } from './ui-menu.js';
import { createVisitUI } from './ui-visit.js';
import { createPhotoUI } from './ui-photo.js';

export function initUI({ atlas, renderer }) {
  const icons = {};
  const icon = name => (icons[name] ||= atlas[name].toDataURL());
  const coin = n => `<span class="coin"><img class="px" src="${icon('coin')}" alt="코인">${n}</span>`;
  const petFace = pet => renderer.petURL(pet.species, pet.wear, true);

  $('coinIcon').src = icon('coin');
  const navIcons = { cook: 'f_tteok', edit: 'hammer', visit: 'door', notes: 'note' };
  for (const [nav, name] of Object.entries(navIcons)) document.querySelector(`[data-nav="${nav}"] img`).src = icon(name);

  // ── 알림 ──
  let toastTimer = 0;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  // ── 올라오는 창 ──
  let sheetLive = null; // 창이 열려 있는 동안 주기적으로 부르는 갱신 함수
  let actions = {};
  // opts: live(주기 갱신), actions(data-act → 함수), keepScroll(같은 창을 다시 그릴 때 스크롤 유지)
  function openSheet(title, html, opts = {}) {
    $('sheetTitle').textContent = title;
    const body = $('sheetBody');
    const top = opts.keepScroll ? body.scrollTop : 0;
    body.innerHTML = html;
    actions = opts.actions || {};
    sheetLive = opts.live || null;
    $('sheetWrap').hidden = false;
    body.scrollTop = top; // 창이 보이는 상태에서만 먹힌다
    sheetLive?.();
  }
  function closeSheet() {
    $('sheetWrap').hidden = true;
    $('sheetBody').innerHTML = '';
    sheetLive = null;
    actions = {};
  }
  const sheetOpen = () => !$('sheetWrap').hidden;
  $('sheetClose').addEventListener('click', () => { sfx('tap'); closeSheet(); });
  $('sheetWrap').addEventListener('click', e => { if (e.target === $('sheetWrap')) closeSheet(); });
  $('sheetBody').addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (el && !el.disabled) actions[el.dataset.act]?.(el);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheetOpen()) closeSheet(); });

  const kit = { icon, coin, toast, openSheet, closeSheet, renderer, refresh };
  const petUI = createPetUI(kit);
  const menuUI = createMenuUI(kit);
  const visitUI = createVisitUI(kit);
  const photoUI = createPhotoUI({ ...kit, onChange: () => renderEdit() });

  // ── 요리 ──
  function openCook(stoveId = null) {
    const lv = level(), s = G.state;
    const rows = allRecipes().map(r => {
      const locked = r.lv > lv;
      const info = locked ? `레벨 ${r.lv}에 열려요` : `${fmtTime(r.time)} · ${r.n}그릇 · 그릇당 ${r.price}`;
      const row = `<button type="button" class="row" data-act="cook" data-r="${r.id}" ${locked ? 'disabled' : ''}>
        <img class="px" src="${icon(r.icon)}" alt="">
        <span class="meta"><b>${esc(r.name)}</b><small>${info}</small></span>
        <span class="right"><span class="coin"><img class="px" src="${icon('coin')}" alt="코인"><span data-cost="${r.id}"></span></span><small data-stock="${r.id}"></small></span>
      </button>`;
      return r.custom
        ? `<div class="row-pair">${row}<button type="button" class="btn" data-act="edit" data-r="${r.id}">고치기</button></div>`
        : row;
    }).join('');
    const lines = stoves().map(st => `<div class="stove-line" data-stove="${st.id}"></div>`).join('');
    const add = s.custom.length < MAX_CUSTOM
      ? `<button type="button" class="btn big" data-act="create">나만의 메뉴 만들기 (${s.custom.length}/${MAX_CUSTOM})</button>`
      : `<p class="muted center">나만의 메뉴를 ${MAX_CUSTOM}개 모두 만들었어요</p>`;
    openSheet('요리', `<div>${lines}</div>${rows}${add}`, {
      live() {
        stoves().forEach((st, i) => {
          const el = document.querySelector(`[data-stove="${st.id}"]`);
          if (!el) return;
          const state = cookState(st), name = st.cook && esc(recipeOf(st.cook.r).name);
          setHTML(el, state === 'idle' ? `<span>화구 ${i + 1} · 비어 있어요</span>`
            : state === 'cooking' ? `<span>화구 ${i + 1} · ${name} · ${fmtTime((st.cook.end - Date.now()) / 1000)} 남음</span>`
              : `<span>화구 ${i + 1} · ${name} 완성</span><button type="button" class="btn primary" data-act="collect" data-id="${st.id}">꺼내기</button>`);
        });
        for (const el of document.querySelectorAll('[data-stock]')) {
          const r = recipeOf(el.dataset.stock);
          setText(el, `재고 ${s.stock[r.id] || 0}`);
          const cost = costOf(r), row = el.closest('.row');
          setText(row.querySelector('[data-cost]'), cost);
          row.classList.toggle('poor', s.coins < cost);
        }
      },
      actions: {
        cook(el) {
          const picked = stoveId != null && itemById(stoveId);
          const target = picked && !picked.cook ? picked : stoves().find(st => !st.cook);
          if (!target) { toast('빈 화구가 없어요. 요리가 끝나길 기다려 주세요'); sfx('err'); return; }
          if (startCook(target.id, el.dataset.r)) { sfx('cook'); closeSheet(); }
        },
        collect(el) { collect(Number(el.dataset.id)); },
        create() { sfx('tap'); menuUI.openEditor(null, () => openCook(stoveId)); },
        edit(el) { sfx('tap'); menuUI.openEditor(el.dataset.r, () => openCook(stoveId)); },
      },
    });
  }

  // ── 의견 ──
  function openNotes() {
    const s = G.state;
    const list = () => s.notes.length
      ? s.notes.map((n, i) => `<li><span>${esc(n.text)}</span><small class="muted">${esc(n.date)}</small>
          <button type="button" class="btn" data-act="del" data-i="${i}">지우기</button></li>`).join('')
      : '<li><span class="muted">아직 적어 둔 의견이 없어요</span></li>';
    openSheet('의견', `<p class="muted">이런 게 있으면 좋겠다 싶은 걸 적어 두세요. 모아서 보내기로 만든 사람에게 전할 수 있어요.</p>
      <textarea id="noteText" rows="3" maxlength="200" placeholder="예) 마라탕도 팔고 싶어, 가구가 더 많았으면 좋겠어"></textarea>
      <div class="pair">
        <button type="button" class="btn primary" data-act="add">적어 두기</button>
        <button type="button" class="btn" data-act="share">모아서 보내기</button>
      </div>
      <ul class="list" id="noteList">${list()}</ul>`, {
      actions: {
        add() {
          const text = $('noteText').value.trim();
          if (!text) { toast('먼저 의견을 적어 주세요'); return; }
          const d = new Date();
          s.notes.unshift({ text, date: `${d.getMonth() + 1}/${d.getDate()}` });
          save();
          $('noteText').value = '';
          $('noteList').innerHTML = list();
          sfx('place');
        },
        del(el) {
          s.notes.splice(Number(el.dataset.i), 1);
          save();
          $('noteList').innerHTML = list();
        },
        async share() {
          if (!s.notes.length) { toast('먼저 의견을 적어 주세요'); return; }
          const text = `[${s.shopName} 의견]\n` + s.notes.map(n => `- ${n.text}`).join('\n');
          if (await share({ text })) return;
          toast(await copyText(text) ? '복사했어요. 카톡에 붙여 넣어 보내세요' : '복사가 안 돼요. 목록을 길게 눌러 복사해 주세요');
        },
      },
    });
  }

  // ── 설정 ──
  function openSettings() {
    const s = G.state;
    const onOff = (label, on) => `${label} ${on ? '켜짐' : '꺼짐'}`;
    openSheet('가게 설정', `<div class="stack">
        <label class="field">가게 이름<input id="setShop" maxlength="12" value="${esc(s.shopName)}" autocomplete="off"></label>
        <button type="button" class="btn primary" data-act="name">이름 바꾸기</button>
        <p class="muted">분위기 ${charm()} · 손님 자리 ${seatCount()}개 · 만든 요리 ${s.stats.cooked}번</p>
        <hr>
        <div class="pair">
          <button type="button" class="btn" data-act="music">${onOff('음악', s.music)}</button>
          <button type="button" class="btn" data-act="sound">${onOff('효과음', s.sound)}</button>
        </div>
        <button type="button" class="btn" data-act="dim">${onOff('밤에 가게 어둡게', s.dim)}</button>
        <hr>
        <p><b>가게 백업</b></p>
        <p class="muted">백업 코드를 카톡 '나에게 보내기'에 붙여 두면, 폰을 바꾸거나 저장이 지워져도 가게를 되살릴 수 있어요.</p>
        <button type="button" class="btn" data-act="backup">백업 코드 복사</button>
        <label class="field">백업 코드로 되살리기<textarea id="restoreCode" rows="2" placeholder="CAFE1:로 시작하는 코드를 붙여 넣어요" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea></label>
        <button type="button" class="btn" data-act="restore">이 코드로 되살리기</button>
        <hr>
        <button type="button" class="btn danger" data-act="reset">처음부터 다시 하기</button>
        <hr>
        <div class="pair">
          <button type="button" class="btn" data-act="privacy">개인정보 처리방침</button>
          <button type="button" class="btn" data-act="licenses">글꼴 라이선스</button>
        </div>
        <p class="muted center">버전 ${APP_VERSION}</p>
      </div>`, {
      actions: {
        name() {
          s.shopName = $('setShop').value.trim() || s.shopName;
          save();
          closeSheet();
          refresh();
          toast('이름을 바꿨어요');
        },
        music(el) { s.music = !s.music; el.textContent = onOff('음악', s.music); save(); syncMusic(); },
        sound(el) { s.sound = !s.sound; el.textContent = onOff('효과음', s.sound); save(); sfx('tap'); },
        dim(el) { s.dim = !s.dim; el.textContent = onOff('밤에 가게 어둡게', s.dim); save(); sfx('tap'); },
        async backup() {
          const code = exportSave();
          if (await copyText(code)) { toast('백업 코드를 복사했어요. 카톡에 붙여 두세요'); return; }
          $('restoreCode').value = code;
          toast('복사가 안 돼요. 아래 칸의 코드를 길게 눌러 복사해 주세요');
        },
        restore(el) {
          const code = $('restoreCode').value;
          if (!code.trim()) { toast('먼저 백업 코드를 붙여 넣어 주세요'); return; }
          if (!el.dataset.sure) {
            el.dataset.sure = '1';
            el.textContent = '지금 가게를 덮어써요. 한 번 더 누르면 되살려요';
            return;
          }
          if (importSave(code)) { location.reload(); return; }
          delete el.dataset.sure;
          el.textContent = '이 코드로 되살리기';
        },
        reset(el) {
          if (!el.dataset.sure) {
            el.dataset.sure = '1';
            el.textContent = '정말요? 한 번 더 누르면 모두 지워져요';
            return;
          }
          reset();
          location.reload();
        },
        privacy() { window.open(PRIVACY_URL, '_blank', 'noopener'); },
        async licenses() {
          let text = '';
          try { text = (await (await fetch('assets/Galmuri-OFL.md')).text()).replace(/&copy;/g, '©'); } catch { /* 아래 안내로 대신한다 */ }
          openSheet('글꼴 라이선스', `<p>이 게임은 Galmuri 글꼴을 씁니다. SIL Open Font License 1.1에 따라 쓸 수 있는 글꼴이에요.</p>
            <pre class="license">${esc(text || '라이선스 글을 불러오지 못했어요. https://openfontlicense.org 에서 볼 수 있어요.')}</pre>`);
        },
      },
    });
  }

  // 안드로이드 뒤로 가기 버튼: 열린 것부터 하나씩 닫는다. 닫을 게 없으면 false.
  function back() {
    if (sheetOpen()) { closeSheet(); return true; }
    if (G.edit) { closeEdit(); return true; }
    if (G.visit) { $('visitLeave').click(); return true; }
    return false;
  }

  // ── 레벨 업 ──
  function showLevelUp({ lv, reward, unlocks }) {
    sfx('level');
    if (sheetOpen() || G.edit) { toast(`레벨 ${lv}! 코인 ${reward}개를 받았어요`); return; }
    const items = unlocks.map(u =>
      `<li>${u.icon ? `<img class="px" src="${icon(u.icon)}" alt="">` : ''}<span>${u.text}</span></li>`).join('');
    openSheet(`레벨 ${lv}!`, `<div class="stack">
        <p class="center">축하해요! 선물로 ${coin(reward)}개를 받았어요</p>
        <ul class="list">${items}</ul>
        <button type="button" class="btn primary big" data-act="ok">좋아요</button>
      </div>`, { actions: { ok: closeSheet } });
  }

  // ── 꾸미기 ──
  function openEdit() {
    enterEdit();
    $('bar').hidden = true;
    $('editPanel').hidden = false;
    renderEdit();
  }
  function closeEdit() {
    exitEdit();
    $('editPanel').hidden = true;
    $('bar').hidden = false;
  }

  function editCards() {
    const s = G.state, e = G.edit, lv = level();
    if (e.tab === 'furn') {
      return Object.entries(FURN).filter(([, f]) => f.group === e.group).map(([id, f]) => {
        const locked = f.lv > lv, have = s.inv[id] || 0;
        const full = id === 'stove' && stoves().length >= stoveLimit(lv);
        const sub = locked ? `Lv ${f.lv}` : have ? `보관 ${have}개` : full ? '지금은 최대' : coin(f.price);
        return `<button type="button" class="card ${e.place === id ? 'on' : ''}" data-act="furn" data-id="${id}" ${locked || full ? 'disabled' : ''}>
          <img class="px" src="${icon(f.sprite)}" alt=""><b>${f.name}</b><small>${sub}</small></button>`;
      }).join('');
    }
    if (e.tab === 'floor') {
      return Object.entries(FLOORS).map(([id, f]) => {
        const locked = f.lv > lv;
        const sub = locked ? `Lv ${f.lv}` : f.price ? `칸당 ${coin(f.price)}` : '무료';
        return `<button type="button" class="card ${e.floor === id ? 'on' : ''}" data-act="floor" data-id="${id}" ${locked ? 'disabled' : ''}>
          <img class="px" src="${renderer.floorURL(id)}" alt=""><b>${f.name}</b><small>${sub}</small></button>`;
      }).join('');
    }
    if (e.tab === 'wall') {
      const photoCard = `<button type="button" class="card" data-act="photo">
          <img class="px" src="${s.photo || icon('painting')}" alt=""><b>액자 사진</b><small>${s.photo ? '바꾸기' : '사진 걸기'}</small></button>`;
      return photoCard + Object.entries(WALLS).map(([id, w]) => {
        const locked = w.lv > lv && !s.walls.includes(id);
        const trying = e.pending?.kind === 'wall' && e.pending.id === id; // 사기 전에 벽에 미리 대 보는 중
        const sub = s.wall === id ? '사용 중' : s.walls.includes(id) ? '바꾸기' : locked ? `Lv ${w.lv}` : coin(w.price);
        return `<button type="button" class="card ${trying || (s.wall === id && e.pending?.kind !== 'wall') ? 'on' : ''}" data-act="wall" data-id="${id}" ${locked ? 'disabled' : ''}>
          <img class="px" src="${renderer.wallURL(id)}" alt=""><b>${w.name}</b><small>${sub}</small></button>`;
      }).join('');
    }
    // 넓힐 쪽을 고른다. 위·아래는 줄 수, 왼쪽·오른쪽은 칸 수가 늘어난다.
    const arrows = { up: 'arrow_up', down: 'arrow_down', left: 'arrow_right~', right: 'arrow_right' };
    return Object.entries(EXPAND_DIRS).map(([dir, name]) => {
      const cfg = expandCfg(dir);
      const sub = !cfg ? '다 넓혔어요' : lv < cfg.lv ? `Lv ${cfg.lv}` : coin(cfg.price);
      const picked = e.pending?.kind === 'expand' && e.pending.dir === dir;
      return `<button type="button" class="card ${picked ? 'on' : ''}" data-act="expand" data-id="${dir}" ${!cfg || lv < cfg.lv ? 'disabled' : ''}>
        <img class="px" src="${icon(arrows[dir])}" alt=""><b>${name}</b><small>${sub}</small></button>`;
    }).join('');
  }

  function editInfo() {
    const e = G.edit;
    const stop = '<button type="button" class="btn" data-act="stop">그만</button>';
    // 돈이 드는 일은 여기서 구매 확정을 눌러야 이루어진다.
    const pending = pendingInfo();
    if (pending) {
      return `<span class="grow"><b>${pending.name}</b> · ${coin(pending.cost)}</span>
        <button type="button" class="btn primary" data-act="buy">구매 확정</button>
        <button type="button" class="btn" data-act="cancel">취소</button>`;
    }
    if (e.sel != null) {
      const it = itemById(e.sel), f = FURN[it.type];
      const cost = it.type === 'stove' ? upgradeCost(it) : null;
      const buttons = it.type === 'stove'
        ? (cost != null ? `<button type="button" class="btn" data-act="upgrade">강화 ${coin(cost)}</button>` : '')
        : '<button type="button" class="btn" data-act="store">보관</button>';
      const title = it.type === 'stove' ? `${f.name} ${it.lv}단계` : f.name;
      return `<span class="grow"><b>${title}</b> · 옮길 칸을 누르세요</span>${buttons}`;
    }
    if (e.place) return `<span class="grow"><b>${FURN[e.place].name}</b> · 놓을 칸을 누르세요</span>${stop}`;
    if (e.floor) return `<span class="grow"><b>${FLOORS[e.floor].name}</b> · 칠할 칸을 누르거나 문질러요</span>${stop}`;
    if (e.tab === 'expand') return `<span class="grow">넓힐 쪽을 골라 주세요</span><span>가로 ${G.state.cols}칸 · 세로 ${G.state.rows}줄</span>`;
    return `<span class="grow">가구를 누르면 옮기거나 보관할 수 있어요</span><span>분위기 ${charm()} · 자리 ${seatCount()}개</span>`;
  }

  function renderEdit() {
    const e = G.edit;
    if (!e) return;
    for (const tab of document.querySelectorAll('.tabs button')) tab.setAttribute('aria-selected', tab.dataset.tab === e.tab);
    const groups = $('editGroups');
    groups.hidden = e.tab !== 'furn';
    setHTML(groups, Object.entries(FURN_GROUPS).map(([id, name]) =>
      `<button type="button" class="chip ${e.group === id ? 'on' : ''}" data-group="${id}">${name}</button>`).join(''));
    const list = $('editList'), left = list.scrollLeft;
    setHTML(list, editCards());
    list.scrollLeft = left;
    setHTML($('editInfo'), editInfo());
  }

  document.querySelector('.tabs').addEventListener('click', ev => {
    const tab = ev.target.closest('[data-tab]');
    if (!tab) return;
    Object.assign(G.edit, { tab: tab.dataset.tab, place: null, floor: null, sel: null, pending: null });
    $('editList').scrollLeft = 0;
    sfx('tap');
    renderEdit();
  });
  $('editGroups').addEventListener('click', ev => {
    const chip = ev.target.closest('[data-group]');
    if (!chip) return;
    Object.assign(G.edit, { group: chip.dataset.group, place: null, pending: null });
    $('editList').scrollLeft = 0;
    sfx('tap');
    renderEdit();
  });
  $('editList').addEventListener('click', ev => {
    const el = ev.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const e = G.edit, id = el.dataset.id;
    if (el.dataset.act === 'furn') Object.assign(e, { place: e.place === id ? null : id, sel: null, pending: null });
    else if (el.dataset.act === 'floor') Object.assign(e, { floor: e.floor === id ? null : id, sel: null, pending: null });
    else if (el.dataset.act === 'wall') askWall(id);
    else if (el.dataset.act === 'expand') askExpand(id);
    else if (el.dataset.act === 'photo') { e.pending = null; photoUI.open(); }
    sfx('tap');
    renderEdit();
  });
  $('editInfo').addEventListener('click', ev => {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const e = G.edit;
    if (el.dataset.act === 'stop') Object.assign(e, { place: null, floor: null, pending: null });
    else if (el.dataset.act === 'store') storeItem(e.sel);
    else if (el.dataset.act === 'upgrade') askUpgrade(e.sel);
    else if (el.dataset.act === 'buy') confirmPending();
    else if (el.dataset.act === 'cancel') e.pending = null;
    renderEdit();
  });
  $('editDone').addEventListener('click', () => { sfx('tap'); closeEdit(); });

  // ── 위쪽 정보 ──
  function refresh() {
    const s = G.state, lv = level();
    setText($('shopName'), s.shopName);
    setText($('coinNum'), s.coins);
    // 구경 중에는 남의 가게라서 코인과 설정을 가린다.
    $('coinBox').hidden = !!G.visit;
    $('shopBtn').disabled = !!G.visit;
    setText($('lvNum'), `Lv ${lv}`);
    const lo = LEVEL_XP[lv - 1], hi = LEVEL_XP[lv];
    $('xpFill').style.width = hi ? `${Math.round(((s.xp - lo) / (hi - lo)) * 100)}%` : '100%';
    const first = s.pets[0];
    if (first) {
      setText($('petLabel'), s.pets.length > 1 ? '친구들' : first.name);
      setSrc($('petIcon'), petFace(first));
      setSrc($('shopIcon'), petFace(first));
    }
    const h = s.started ? hint() : '';
    $('hint').hidden = !h;
    setText($('hint'), h);
    sheetLive?.();
  }

  // ── 아래 버튼 ──
  $('bar').addEventListener('click', ev => {
    const btn = ev.target.closest('[data-nav]');
    if (!btn) return;
    sfx('tap');
    ({ cook: openCook, edit: openEdit, pet: () => petUI.openPets(), visit: visitUI.openNeighbors, notes: openNotes })[btn.dataset.nav]();
  });
  $('shopBtn').addEventListener('click', () => { sfx('tap'); openSettings(); });

  // ── 첫 화면: 가게 이름, 함께할 친구 ──
  const intro = $('intro');
  let introSpecies = Object.keys(PETS)[0];
  function renderIntro() {
    $('introPets').innerHTML = Object.entries(PETS).map(([id, p]) =>
      `<button type="button" class="card ${id === introSpecies ? 'on' : ''}" role="radio" aria-checked="${id === introSpecies}" data-id="${id}">
        <img class="px" src="${renderer.petURL(id)}" alt=""><b>${p.name}</b></button>`).join('');
    $('introPet').src = renderer.petURL(introSpecies, {}, true);
    $('introPetName').placeholder = PETS[introSpecies].nick;
  }
  $('introPets').addEventListener('click', ev => {
    const el = ev.target.closest('[data-id]');
    if (!el) return;
    introSpecies = el.dataset.id;
    renderIntro();
  });
  intro.hidden = G.state.started;
  if (!G.state.started) renderIntro();
  intro.addEventListener('submit', ev => {
    ev.preventDefault();
    startGame({
      shopName: $('introShop').value.trim() || $('introShop').placeholder,
      petName: $('introPetName').value.trim() || $('introPetName').placeholder,
      species: introSpecies,
    });
    intro.hidden = true;
    sfx('level');
    syncMusic();
    refresh();
  });

  on('toast', msg => { toast(msg); sfx('err'); });
  on('sale', () => sfx('coin'));
  on('serve', () => sfx('serve'));
  on('collect', r => { sfx('done'); toast(`${r.name} ${r.n}그릇을 진열했어요`); });
  on('pet', () => sfx('bark'));
  on('place', () => sfx('place'));
  on('levelup', showLevelUp);
  on('custom', id => { delete icons[`custom_${id}`]; });

  refresh();
  return {
    refresh, renderEdit, openCook, toast, back,
    handleInvite: visitUI.handleInvite, openPhoto: photoUI.open,
  };
}
