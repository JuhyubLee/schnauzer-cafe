// 캔버스 밖의 화면: 위쪽 정보, 아래 버튼, 꾸미기 패널, 올라오는 창.
// 친구(옷장), 나만의 메뉴, 주문 화면은 ui-pet.js, ui-menu.js, ui-daily.js에 있다.
import {
  G, on, level, hint, charm, seatCount, stoves, cookState, itemById, recipeOf, allRecipes, josa,
  startCook, collect, costOf, enterEdit, exitEdit, storeItem, upgradeCost, expandCfg,
  askWall, askExpand, askUpgrade, pendingInfo, confirmPending, save, reset, startGame, exportSave, importSave,
  furnOf, levelIn, shopNo, rounds, regulars, setShow, displayed, priceOf,
} from './game.js';
import {
  FURN, FURN_GROUPS, FLOORS, WALLS, SEASONS, EXPAND_DIRS, PETS, BONDS, MAX_CUSTOM, APP_VERSION, PRIVACY_URL,
  SONG_CHOICES, SHOP_TYPES, REGULAR_EVERY, DISPLAY_BONUS, stoveLimit, fmtTime, onSale, shopOf, levelXp,
} from './data.js';
import { $, esc, setText, setHTML, setSrc, copyText } from './dom.js';
import { share, buzz } from './device.js';
import { sfx, voice } from './sfx.js';
import { syncMusic } from './music.js';
import { createPetUI } from './ui-pet.js';
import { createMenuUI } from './ui-menu.js';
import { createVisitUI } from './ui-visit.js';
import { createPhotoUI } from './ui-photo.js';
import { createDailyUI } from './ui-daily.js';
import { createAlleyUI } from './ui-alley.js';
import { goalText } from './daily.js';
import { sharing, stopSharing } from './visit.js';

export function initUI({ atlas, renderer }) {
  const icons = {};
  const icon = name => (icons[name] ||= atlas[name].toDataURL());
  const coin = n => `<span class="coin"><img class="px" src="${icon('coin')}" alt="코인">${n}</span>`;
  const petFace = pet => renderer.petURL(pet.species, pet.wear, true);

  $('coinIcon').src = icon('coin');
  const navIcons = { edit: 'hammer', visit: 'door', daily: 'stamp' }; // 만들기 버튼의 그림과 글(요리, 만들기)은 가게마다 달라서 refresh가 넣는다
  for (const [nav, name] of Object.entries(navIcons)) document.querySelector(`[data-nav="${nav}"] img`).src = icon(name);
  const cookIcon = document.querySelector('[data-nav="cook"] img'), cookLabel = document.querySelector('[data-nav="cook"] span');

  // ── 알림 ──
  // toast: 바로 보여 주고 앞의 것을 덮는다. news: 좋은 소식(단계가 오름, 주문을 끝냄)이라 겹쳐도 하나씩 차례로 보여 준다.
  let toastTimer = 0;
  const newsQueue = [];
  function show(msg, ms) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('show');
      if (newsQueue.length) show(newsQueue.shift(), 2600);
    }, ms);
  }
  const toast = msg => show(msg, 1800);
  function news(msg) {
    if ($('toast').classList.contains('show')) newsQueue.push(msg);
    else show(msg, 2600);
  }

  // ── 올라오는 창 ──
  let sheetLive = null; // 창이 열려 있는 동안 주기적으로 부르는 갱신 함수
  let actions = {};
  // 꼭 읽어야 하는 창(hold): 바깥을 눌러도 닫히지 않고, 뜬 직후 잠깐은 창 안의 단추도 안 먹는다.
  // 다른 것을 연달아 누르던 손가락이 창을 읽기도 전에 닫아 버리지 않게 하려는 것이다.
  const HOLD_MS = 800;
  let held = false, armTimer = 0;
  // opts: live(주기 갱신), actions(data-act → 함수), keepScroll(같은 창을 다시 그릴 때 스크롤 유지), hold(위 설명)
  function openSheet(title, html, opts = {}) {
    $('sheetTitle').textContent = title;
    const body = $('sheetBody');
    const top = opts.keepScroll ? body.scrollTop : 0;
    body.innerHTML = html;
    actions = opts.actions || {};
    sheetLive = opts.live || null;
    held = !!opts.hold;
    clearTimeout(armTimer);
    $('sheet').classList.toggle('arming', held);
    if (held) armTimer = setTimeout(() => $('sheet').classList.remove('arming'), HOLD_MS);
    $('sheetWrap').hidden = false;
    body.scrollTop = top; // 창이 보이는 상태에서만 먹힌다
    sheetLive?.();
  }
  function closeSheet() {
    $('sheetWrap').hidden = true;
    $('sheetBody').innerHTML = '';
    sheetLive = null;
    actions = {};
    held = false;
  }
  const sheetOpen = () => !$('sheetWrap').hidden;
  $('sheetClose').addEventListener('click', () => { sfx('tap'); closeSheet(); });
  $('sheetWrap').addEventListener('click', e => { if (e.target === $('sheetWrap') && !held) closeSheet(); });
  $('sheetBody').addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (el && !el.disabled) actions[el.dataset.act]?.(el);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheetOpen()) closeSheet(); });

  const kit = { icon, coin, toast, news, openSheet, closeSheet, renderer, refresh };
  const petUI = createPetUI(kit);
  const menuUI = createMenuUI(kit);
  const visitUI = createVisitUI(kit);
  const photoUI = createPhotoUI({ ...kit, onChange: () => renderEdit() });
  const dailyUI = createDailyUI(kit);
  const alleyUI = createAlleyUI(kit);

  // ── 요리 ──
  function openCook(stoveId = null) {
    const lv = level(), s = G.state, { make, unit } = SHOP_TYPES[s.type]; // 요리·그릇, 만들기·벌처럼 가게마다 다른 말
    const rows = allRecipes().map(r => {
      const locked = r.lv > lv;
      // 진열해 둔 것(옷가게의 마네킹)은 값을 더 받는다.
      const info = locked ? `레벨 ${r.lv}에 열려요` : `${fmtTime(r.time)} · ${r.n}${unit} · ${unit}당 ${priceOf(r)}${displayed(r.id) ? ' · 진열 중' : ''}`;
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
    const item = SHOP_TYPES[s.type].custom.item; // 메뉴, 옷
    const add = s.custom.length < MAX_CUSTOM
      ? `<button type="button" class="btn big" data-act="create">나만의 ${item} 만들기 (${s.custom.length}/${MAX_CUSTOM})</button>`
      : `<p class="muted center">나만의 ${josa(item, '을', '를')} ${MAX_CUSTOM}개 모두 만들었어요</p>`;
    const maker = furnOf('stove').name; // 화구, 커피 머신처럼 가게마다 다르다
    openSheet(make, `<div>${lines}</div>${rows}${add}`, {
      live() {
        stoves().forEach((st, i) => {
          const el = document.querySelector(`[data-stove="${st.id}"]`);
          if (!el) return;
          const state = cookState(st), name = st.cook && esc(recipeOf(st.cook.r).name);
          setHTML(el, state === 'idle' ? `<span>${maker} ${i + 1} · 비어 있어요</span>`
            : state === 'cooking' ? `<span>${maker} ${i + 1} · ${name} · ${fmtTime((st.cook.end - Date.now()) / 1000)} 남음</span>`
              : `<span>${maker} ${i + 1} · ${name} 완성</span><button type="button" class="btn primary" data-act="collect" data-id="${st.id}">꺼내기</button>`);
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
          if (!target) { toast(`빈 ${josa(maker, '이', '가')} 없어요. 다 될 때까지 기다려 주세요`); sfx('err'); return; }
          if (startCook(target.id, el.dataset.r)) { sfx('cook'); closeSheet(); }
        },
        collect(el) { collect(Number(el.dataset.id)); },
        create() { sfx('tap'); menuUI.openEditor(null, () => openCook(stoveId)); },
        edit(el) { sfx('tap'); menuUI.openEditor(el.dataset.r, () => openCook(stoveId)); },
      },
    });
  }

  // ── 진열: 마네킹을 누르면 입힐 것을 고른다 ──
  function openDisplay(itemId) {
    const it = itemById(itemId), s = G.state, { unit, custom } = SHOP_TYPES[s.type];
    const name = furnOf(it.type).name, lv = level();
    const rows = allRecipes().filter(r => r.lv <= lv).map(r => {
      const mark = it.show === r.id ? '입히는 중' : displayed(r.id) ? '다른 곳에 진열 중' : '';
      return `<button type="button" class="row" data-act="show" data-r="${r.id}">
        <img class="px" src="${icon(r.icon)}" alt="">
        <span class="meta"><b>${esc(r.name)}</b><small>${unit}당 ${r.price} → ${Math.round(r.price * DISPLAY_BONUS)} · 재고 ${s.stock[r.id] || 0}</small></span>
        <span class="right"><small>${mark}</small></span>
      </button>`;
    }).join('');
    openSheet(`${name}에 입힐 ${custom.item}`, `
      <p class="muted">${name}에 입혀 둔 ${josa(custom.item, '은', '는')} 손님이 더 자주 찾고, 값을 ${Math.round((DISPLAY_BONUS - 1) * 100)}% 더 받아요. 넉넉히 만들어 둔 것을 입혀 두면 좋아요.</p>
      ${rows}
      ${it.show ? '<button type="button" class="btn" data-act="clear">벗겨 두기</button>' : ''}`, {
      actions: {
        show(el) {
          if (!setShow(itemId, el.dataset.r)) return;
          save();
          sfx('tap');
          closeSheet();
          toast(`${name}에 ${josa(recipeOf(el.dataset.r).name, '을', '를')} 입혔어요`);
        },
        clear() { if (setShow(itemId, null)) { save(); sfx('tap'); closeSheet(); } },
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
        <button type="button" class="btn big" data-act="alley">골목으로 나가기 (다른 가게)</button>
        <label class="field">가게 이름<input id="setShop" maxlength="12" value="${esc(s.shopName)}" autocomplete="off"></label>
        <button type="button" class="btn primary" data-act="name">이름 바꾸기</button>
        <p class="muted">분위기 ${charm()} · 손님 자리 ${seatCount()}개 · 만든 횟수 ${s.stats.cooked}번${SHOP_TYPES[s.type].stay
    ? `<br>손님마다 ${rounds()}번 주문 · 단골 ${regulars()}명 (${REGULAR_EVERY - regulars() % REGULAR_EVERY}명 더 생기면 감사 선물)` : ''}</p>
        <hr>
        <div class="pair">
          <button type="button" class="btn" data-act="music">${onOff('음악', s.music)}</button>
          <button type="button" class="btn" data-act="sound">${onOff('효과음', s.sound)}</button>
        </div>
        <button type="button" class="btn" data-act="song">노래: ${SONG_CHOICES[s.song] || SONG_CHOICES.auto}</button>
        <p class="muted">노래 버튼을 누를 때마다 다음 노래로 바뀌어요. "계절에 맞춰"는 지금 계절의 노래와 오르골 왈츠를 번갈아 들려주고, 12월 1일부터 25일까지는 캐럴이 나와요.</p>
        <button type="button" class="btn" data-act="dim">${onOff('밤에 가게 어둡게', s.dim)}</button>
        <hr>
        <p><b>가게 백업</b></p>
        <p class="muted">백업 코드를 카톡 '나에게 보내기'에 붙여 두면, 폰을 바꾸거나 저장이 지워져도 가게를 되살릴 수 있어요.</p>
        <button type="button" class="btn" data-act="backup">백업 코드 복사</button>
        <label class="field">백업 코드로 되살리기<textarea id="restoreCode" rows="2" placeholder="받아 둔 백업 코드(CAFE1: 또는 CAFE2:로 시작)를 붙여 넣어요" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea></label>
        <button type="button" class="btn" data-act="restore">이 코드로 되살리기</button>
        <hr>
        <button type="button" class="btn danger" data-act="reset">처음부터 다시 하기</button>
        <hr>
        <button type="button" class="btn" data-act="notes">의견 적어 두기</button>
        <div class="pair">
          <button type="button" class="btn" data-act="privacy">개인정보 처리방침</button>
          <button type="button" class="btn" data-act="licenses">글꼴 라이선스</button>
        </div>
        <p class="muted center">버전 ${APP_VERSION}</p>
      </div>`, {
      actions: {
        alley() { sfx('tap'); alleyUI.open(); },
        name() {
          s.shopName = $('setShop').value.trim() || s.shopName;
          save();
          closeSheet();
          refresh();
          toast('이름을 바꿨어요');
        },
        music(el) { s.music = !s.music; el.textContent = onOff('음악', s.music); save(); syncMusic(); },
        song(el) {
          const ids = Object.keys(SONG_CHOICES);
          s.song = ids[(ids.indexOf(s.song) + 1) % ids.length];
          el.textContent = `노래: ${SONG_CHOICES[s.song]}`;
          save();
          syncMusic();
        },
        sound(el) { s.sound = !s.sound; el.textContent = onOff('효과음', s.sound); save(); sfx('tap'); },
        dim(el) { s.dim = !s.dim; el.textContent = onOff('밤에 가게 어둡게', s.dim); save(); sfx('tap'); },
        async backup() {
          const code = await exportSave();
          if (await copyText(code)) { toast('백업 코드를 복사했어요. 카톡에 붙여 두세요'); return; }
          $('restoreCode').value = code;
          toast('복사가 안 돼요. 아래 칸의 코드를 길게 눌러 복사해 주세요');
        },
        async restore(el) {
          const code = $('restoreCode').value;
          if (!code.trim()) { toast('먼저 백업 코드를 붙여 넣어 주세요'); return; }
          if (!el.dataset.sure) {
            el.dataset.sure = '1';
            el.textContent = '지금 가게를 덮어써요. 한 번 더 누르면 되살려요';
            return;
          }
          if (await importSave(code)) { location.reload(); return; }
          delete el.dataset.sure;
          el.textContent = '이 코드로 되살리기';
        },
        async reset(el) {
          if (!el.dataset.sure) {
            el.dataset.sure = '1';
            el.textContent = '정말요? 한 번 더 누르면 모두 지워져요';
            return;
          }
          el.disabled = true;
          if (sharing()) await stopSharing(); // 서버에 올려 둔 가게 모습도 지운다(서버가 안 닿으면 반년 뒤에 지워진다)
          reset();
          location.reload();
        },
        notes() { sfx('tap'); openNotes(); },
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
  // 안내 창은 하나씩, 다른 창이나 꾸미기·구경이 끝난 뒤에 띄운다(refresh가 차례를 본다). 그동안 오른 레벨은 levelUps에 모아 둔다.
  const levelUps = [];
  function showLevelUp(info) {
    sfx('level');
    levelUps.push(info);
    if (sheetOpen() || G.edit) toast(`레벨 ${info.lv}! 코인 ${info.reward}개를 받았어요`);
    else nextLevelUp();
  }
  function nextLevelUp() {
    if (!levelUps.length || sheetOpen() || G.edit || G.visit) return;
    const { lv, reward, unlocks } = levelUps.shift();
    const items = unlocks.map(u =>
      `<li>${u.icon ? `<img class="px" src="${icon(u.icon)}" alt="">` : ''}<span>${u.text}</span></li>`).join('');
    openSheet(`레벨 ${lv}!`, `<div class="stack">
        <p class="center">축하해요! 선물로 ${coin(reward)}개를 받았어요</p>
        <ul class="list">${items}</ul>
        <button type="button" class="btn primary big" data-act="ok">좋아요</button>
      </div>`, { hold: true, actions: { ok: closeSheet } });
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
    // 가구·바닥·벽지는 그것이 딸린 가게의 레벨로 열린다. 다른 가게 것이면 몇 호점 것인지 같이 적는다.
    const lockedAt = x => x.lv > levelIn(shopOf(x));
    const lvLabel = x => (shopOf(x) === s.type ? `Lv ${x.lv}` : `${shopNo(shopOf(x))}호점 Lv ${x.lv}`);
    if (e.tab === 'furn') {
      const list = Object.entries(FURN).filter(([, f]) => f.group === e.group);
      if (e.group === 'season') list.sort((a, b) => onSale(b[1]) - onSale(a[1])); // 지금 파는 것을 앞에
      return list.map(([id]) => {
        const f = furnOf(id);
        const locked = lockedAt(f), have = s.inv[id] || 0;
        const full = id === 'stove' && stoves().length >= stoveLimit(lv);
        const off = !have && !onSale(f); // 계절이 아니면 새로 살 수 없다. 보관해 둔 것은 놓을 수 있다.
        const stampOnly = !have && f.stamps; // 도장 가게에서 받아야 놓을 수 있다
        const sub = off ? `${SEASONS[f.season].name} 한정` : locked ? lvLabel(f) : have ? `보관 ${have}개`
          : stampOnly ? `도장 ${f.stamps}개` : full ? '지금은 최대' : coin(f.price);
        return `<button type="button" class="card ${e.place === id ? 'on' : ''}" data-act="furn" data-id="${id}" ${locked || full || off || stampOnly ? 'disabled' : ''}>
          <img class="px" src="${icon(f.sprite)}" alt=""><b>${f.name}</b><small>${sub}</small></button>`;
      }).join('');
    }
    if (e.tab === 'floor') {
      return Object.entries(FLOORS).map(([id, f]) => {
        const locked = lockedAt(f);
        const sub = locked ? lvLabel(f) : f.price ? `칸당 ${coin(f.price)}` : '무료';
        return `<button type="button" class="card ${e.floor === id ? 'on' : ''}" data-act="floor" data-id="${id}" ${locked ? 'disabled' : ''}>
          <img class="px" src="${renderer.floorURL(id)}" alt=""><b>${f.name}</b><small>${sub}</small></button>`;
      }).join('');
    }
    if (e.tab === 'wall') {
      const photoCard = `<button type="button" class="card" data-act="photo">
          <img class="px" src="${s.photo || icon('painting')}" alt=""><b>액자 사진</b><small>${s.photo ? '바꾸기' : '사진 걸기'}</small></button>`;
      return photoCard + Object.entries(WALLS).map(([id, w]) => {
        const locked = lockedAt(w) && !s.walls.includes(id);
        const trying = e.pending?.kind === 'wall' && e.pending.id === id; // 사기 전에 벽에 미리 대 보는 중
        const sub = s.wall === id ? '사용 중' : s.walls.includes(id) ? '바꾸기' : locked ? lvLabel(w) : coin(w.price);
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
      const it = itemById(e.sel), f = furnOf(it.type);
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
    // 머무는 가게(카페)에서는 분위기가 손님이 시키는 횟수를 정하므로 같이 보여 준다.
    const stay = SHOP_TYPES[G.state.type].stay ? ` · 주문 ${rounds()}번` : '';
    return `<span class="grow">가구를 누르면 옮기거나 보관할 수 있어요</span><span>분위기 ${charm()} · 자리 ${seatCount()}개${stay}</span>`;
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
    const lo = levelXp(lv), hi = levelXp(lv + 1);
    $('xpFill').style.width = `${Math.round(((s.xp - lo) / (hi - lo)) * 100)}%`;
    const first = s.pets[0];
    if (first) {
      setText($('petLabel'), s.pets.length > 1 ? '친구들' : first.name);
      setSrc($('petIcon'), petFace(first));
      setSrc($('shopIcon'), petFace(first));
    }
    setSrc(cookIcon, icon(SHOP_TYPES[s.type].icon));
    setText(cookLabel, SHOP_TYPES[s.type].make);
    setText($('dailyLabel'), dailyUI.label());
    const h = s.started ? hint() : '';
    $('hint').hidden = !h;
    setText($('hint'), h);
    sheetLive?.();
    nextLevelUp();
  }

  // ── 아래 버튼 ──
  $('bar').addEventListener('click', ev => {
    const btn = ev.target.closest('[data-nav]');
    if (!btn) return;
    sfx('tap');
    ({ cook: openCook, edit: openEdit, pet: () => petUI.openPets(), visit: visitUI.openNeighbors, daily: () => dailyUI.openDaily() })[btn.dataset.nav]();
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
  on('enter', () => sfx('bell'));
  on('miss', () => sfx('miss'));
  on('collect', r => { sfx('done'); toast(`${r.name} ${r.n}${josa(SHOP_TYPES[G.state.type].unit, '을', '를')} 진열했어요`); });
  on('manager', ({ pet, n, coins }) => { sfx('coin'); news(`점장 ${josa(pet.name, '이', '가')} 그동안 ${n}번 팔아서 코인 ${coins}개를 벌어 놨어요`); });
  // 단골: 열 명마다 받는 감사 선물과 첫 단골만 알린다(한 명마다 알리면 너무 잦다).
  on('regular', ({ n, gift }) => {
    if (gift) { sfx('level'); news(`단골이 ${n}명이 됐어요! 감사 선물로 코인 ${gift}개를 받았어요`); }
    else if (n === 1) news('첫 단골이 생겼어요! 시킨 것을 끝까지 챙겨 주면 단골이 돼요');
  });
  on('pet', pet => { voice(pet.species); buzz(); });
  // 간식: 먼저 먹는 소리가 나고, 다 먹으면(cheer) 그 종의 목소리로 운다.
  on('feed', ({ pet, fav }) => {
    sfx('eat');
    toast(fav ? `${josa(pet.name, '이', '가')} 제일 좋아하는 간식이에요!` : `${josa(pet.name, '이', '가')} 맛있게 먹었어요`);
  });
  on('cheer', ({ pet, fav }) => voice(pet.species, fav));
  on('gift', ({ pet, coins }) => { sfx('coin'); toast(`${josa(pet.name, '이', '가')} 선물을 물어 왔어요! 코인 ${coins}개`); });
  on('bond', ({ pet, stage }) => {
    sfx('level');
    news(`${josa(pet.name, '과', '와')} '${BONDS[stage].name}' 사이가 됐어요! 이제 ${BONDS[stage].perk}`);
  });
  on('daily', ({ goal, all }) => {
    sfx('done');
    news(all ? `오늘의 주문을 다 끝냈어요! 도장 2개를 받았어요` : `주문 완료: ${goalText(goal)}. 도장 1개를 받았어요`);
  });
  on('place', () => sfx('place'));
  on('levelup', showLevelUp);
  on('custom', id => { delete icons[`custom_${id}`]; });

  refresh();
  return {
    refresh, renderEdit, openCook, openDisplay, toast, back, openAlley: alleyUI.open,
    handleInvite: visitUI.handleInvite, syncShop: visitUI.syncShop, openPhoto: photoUI.open,
  };
}
