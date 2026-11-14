// 캔버스 밖의 화면: 위쪽 정보, 아래 버튼, 꾸미기 패널, 올라오는 창.
import {
  G, on, level, hint, josa, charm, seatCount, stoves, cookState, itemById,
  startCook, collect, costOf, petDog, enterEdit, exitEdit, storeItem, upgradeStove, upgradeCost,
  setWall, expand, save, reset,
} from './game.js';
import { RECIPES, RECIPE, FURN, FLOORS, WALLS, EXPANSIONS, LEVEL_XP, stoveLimit, fmtTime } from './data.js';
import { sfx } from './sfx.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const setText = (el, text) => { if (el.textContent !== String(text)) el.textContent = text; };
const setHTML = (el, html) => { if (el._html !== html) { el._html = html; el.innerHTML = html; } };

export function initUI({ atlas, renderer }) {
  const icons = {};
  const icon = name => (icons[name] ||= atlas[name].toDataURL());
  const coin = n => `<span class="coin"><img class="px" src="${icon('coin')}" alt="코인">${n}</span>`;

  $('shopIcon').src = $('introDog').src = icon('dog_face');
  $('coinIcon').src = icon('coin');
  const navIcons = { cook: 'f_tteok', edit: 'hammer', dog: 'dog_face', notes: 'note' };
  for (const btn of document.querySelectorAll('#bar button')) btn.querySelector('img').src = icon(navIcons[btn.dataset.nav]);

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
  function openSheet(title, html, opts = {}) {
    $('sheetTitle').textContent = title;
    const body = $('sheetBody');
    body.innerHTML = html;
    actions = opts.actions || {};
    sheetLive = opts.live || null;
    $('sheetWrap').hidden = false;
    body.scrollTop = 0; // 창이 보이는 상태에서만 먹힌다
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

  // ── 요리 ──
  function openCook(stoveId = null) {
    const lv = level();
    const rows = RECIPES.map(r => {
      const locked = r.lv > lv;
      const info = locked ? `레벨 ${r.lv}에 열려요` : `${fmtTime(r.time)} · ${r.n}그릇 · 그릇당 ${r.price}`;
      return `<button type="button" class="row" data-act="cook" data-r="${r.id}" ${locked ? 'disabled' : ''}>
        <img class="px" src="${icon(r.icon)}" alt="">
        <span class="meta"><b>${r.name}</b><small>${info}</small></span>
        <span class="right"><span class="coin"><img class="px" src="${icon('coin')}" alt="코인"><span data-cost="${r.id}"></span></span><small data-stock="${r.id}"></small></span>
      </button>`;
    }).join('');
    const lines = stoves().map(st => `<div class="stove-line" data-stove="${st.id}"></div>`).join('');
    openSheet('요리', `<div>${lines}</div>${rows}`, {
      live() {
        const s = G.state;
        stoves().forEach((st, i) => {
          const el = document.querySelector(`[data-stove="${st.id}"]`);
          if (!el) return;
          const state = cookState(st), name = st.cook && RECIPE[st.cook.r].name;
          setHTML(el, state === 'idle' ? `<span>화구 ${i + 1} · 비어 있어요</span>`
            : state === 'cooking' ? `<span>화구 ${i + 1} · ${name} · ${fmtTime((st.cook.end - Date.now()) / 1000)} 남음</span>`
              : `<span>화구 ${i + 1} · ${name} 완성</span><button type="button" class="btn primary" data-act="collect" data-id="${st.id}">꺼내기</button>`);
        });
        for (const el of document.querySelectorAll('[data-stock]')) {
          const r = RECIPE[el.dataset.stock];
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
      },
    });
  }

  // ── 강아지 ──
  function openDog() {
    const s = G.state, name = esc(s.dogName);
    openSheet(s.dogName, `<div class="center stack">
        <img class="px hero" src="${icon('dog_face')}" alt="">
        <p><img class="px" src="${icon('heart')}" alt="" width="18" height="16"> 친밀도 <b id="dogLove"></b></p>
        <p class="muted">쓰다듬으면 신나서 20초 동안 더 빨리 서빙해요.<br>가게에서 ${esc(josa(s.dogName, '을', '를'))} 직접 눌러도 돼요.</p>
        <button type="button" class="btn primary big" data-act="pet">${name} 쓰다듬기</button>
        <p class="muted">지금까지 손님 <b id="dogSold"></b>명을 대접했어요</p>
      </div>`, {
      live() { setText($('dogLove'), s.dog.love); setText($('dogSold'), s.stats.sold); },
      actions: { pet: petDog },
    });
  }

  // ── 의견 ──
  function openNotes() {
    const s = G.state;
    const list = () => s.notes.length
      ? s.notes.map((n, i) => `<li><span>${esc(n.text)}</span><small class="muted">${esc(n.date)}</small>
          <button type="button" class="btn" data-act="del" data-i="${i}">지우기</button></li>`).join('')
      : '<li><span class="muted">아직 적어 둔 의견이 없어요</span></li>';
    openSheet('의견', `<p class="muted">이런 게 있으면 좋겠다 싶은 걸 적어 두세요. 다음 버전에 넣을게요.</p>
      <textarea id="noteText" rows="3" maxlength="200" placeholder="예) 마라탕도 팔고 싶어, 강아지 옷 입히고 싶어"></textarea>
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
          if (navigator.share) {
            try { await navigator.share({ text }); } catch { /* 공유 창을 닫은 경우 */ }
            return;
          }
          toast(await copyText(text) ? '복사했어요. 카톡에 붙여 넣어 보내세요' : '복사가 안 돼요. 목록을 길게 눌러 복사해 주세요');
        },
      },
    });
  }

  // https가 아닌 주소(집 와이파이 테스트)에서는 clipboard API가 없어서 옛 방식으로 복사한다.
  async function copyText(text) {
    if (navigator.clipboard) {
      try { await navigator.clipboard.writeText(text); return true; } catch { /* 아래 방식으로 */ }
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }

  // ── 설정 ──
  function openSettings() {
    const s = G.state;
    const soundLabel = () => `소리 ${s.sound ? '켜짐' : '꺼짐'}`;
    openSheet('가게 설정', `<div class="stack">
        <label class="field">가게 이름<input id="setShop" maxlength="12" value="${esc(s.shopName)}" autocomplete="off"></label>
        <label class="field">강아지 이름<input id="setDog" maxlength="6" value="${esc(s.dogName)}" autocomplete="off"></label>
        <button type="button" class="btn primary" data-act="names">이름 바꾸기</button>
        <p class="muted">분위기 ${charm()} · 손님 자리 ${seatCount()}개 · 만든 요리 ${s.stats.cooked}번</p>
        <hr>
        <button type="button" class="btn" data-act="sound">${soundLabel()}</button>
        <hr>
        <button type="button" class="btn danger" data-act="reset">처음부터 다시 하기</button>
      </div>`, {
      actions: {
        names() {
          s.shopName = $('setShop').value.trim() || s.shopName;
          s.dogName = $('setDog').value.trim() || s.dogName;
          save();
          closeSheet();
          refresh();
          toast('이름을 바꿨어요');
        },
        sound(el) { s.sound = !s.sound; el.textContent = soundLabel(); save(); sfx('tap'); },
        reset(el) {
          if (!el.dataset.sure) {
            el.dataset.sure = '1';
            el.textContent = '정말요? 한 번 더 누르면 모두 지워져요';
            return;
          }
          reset();
          location.reload();
        },
      },
    });
  }

  // ── 레벨 업, 다녀왔을 때 ──
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

  function showWelcome({ sold, coins, elapsed }) {
    const s = G.state;
    openSheet('다녀오셨어요', `<div class="center stack">
        <img class="px hero" src="${icon('dog_face')}" alt="">
        <p>${esc(josa(s.dogName, '이', '가'))} ${fmtTime(Math.floor(elapsed / 60) * 60)} 동안<br><b>${sold}그릇</b>을 팔았어요</p>
        <p>${coin('+' + coins)}</p>
        <button type="button" class="btn primary big" data-act="ok">잘했어!</button>
      </div>`, { actions: { ok() { petDog(); closeSheet(); } } });
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
      return Object.entries(FURN).map(([id, f]) => {
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
      return Object.entries(WALLS).map(([id, w]) => {
        const locked = w.lv > lv && !s.walls.includes(id);
        const sub = s.wall === id ? '사용 중' : s.walls.includes(id) ? '바꾸기' : locked ? `Lv ${w.lv}` : coin(w.price);
        return `<button type="button" class="card ${s.wall === id ? 'on' : ''}" data-act="wall" data-id="${id}" ${locked ? 'disabled' : ''}>
          <img class="px" src="${renderer.wallURL(id)}" alt=""><b>${w.name}</b><small>${sub}</small></button>`;
      }).join('');
    }
    const cfg = EXPANSIONS[s.rows];
    if (!cfg) return '<div class="card wide"><b>가게를 끝까지 넓혔어요</b></div>';
    return lv < cfg.lv
      ? `<button type="button" class="card wide" disabled><b>가게 한 줄 넓히기</b><small>레벨 ${cfg.lv}부터</small></button>`
      : `<button type="button" class="card wide" data-act="expand"><b>가게 한 줄 넓히기</b><small>${coin(cfg.price)}</small></button>`;
  }

  function editInfo() {
    const e = G.edit;
    const stop = '<button type="button" class="btn" data-act="stop">그만</button>';
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
    return `<span class="grow">가구를 누르면 옮기거나 보관할 수 있어요</span><span>분위기 ${charm()} · 자리 ${seatCount()}개</span>`;
  }

  function renderEdit() {
    const e = G.edit;
    if (!e) return;
    for (const tab of document.querySelectorAll('.tabs button')) tab.setAttribute('aria-selected', tab.dataset.tab === e.tab);
    const list = $('editList'), left = list.scrollLeft;
    setHTML(list, editCards());
    list.scrollLeft = left;
    setHTML($('editInfo'), editInfo());
  }

  document.querySelector('.tabs').addEventListener('click', ev => {
    const tab = ev.target.closest('[data-tab]');
    if (!tab) return;
    Object.assign(G.edit, { tab: tab.dataset.tab, place: null, floor: null, sel: null });
    $('editList').scrollLeft = 0;
    sfx('tap');
    renderEdit();
  });
  $('editList').addEventListener('click', ev => {
    const el = ev.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const e = G.edit, id = el.dataset.id;
    if (el.dataset.act === 'furn') Object.assign(e, { place: e.place === id ? null : id, sel: null });
    else if (el.dataset.act === 'floor') Object.assign(e, { floor: e.floor === id ? null : id, sel: null });
    else if (el.dataset.act === 'wall') setWall(id);
    else if (el.dataset.act === 'expand') expand();
    sfx('tap');
    renderEdit();
  });
  $('editInfo').addEventListener('click', ev => {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const e = G.edit;
    if (el.dataset.act === 'stop') Object.assign(e, { place: null, floor: null });
    else if (el.dataset.act === 'store') storeItem(e.sel);
    else if (el.dataset.act === 'upgrade') upgradeStove(e.sel);
    renderEdit();
  });
  $('editDone').addEventListener('click', () => { sfx('tap'); closeEdit(); });

  // ── 위쪽 정보 ──
  function refresh() {
    const s = G.state, lv = level();
    setText($('shopName'), s.shopName);
    setText($('dogLabel'), s.dogName);
    setText($('coinNum'), s.coins);
    setText($('lvNum'), `Lv ${lv}`);
    const lo = LEVEL_XP[lv - 1], hi = LEVEL_XP[lv];
    $('xpFill').style.width = hi ? `${Math.round(((s.xp - lo) / (hi - lo)) * 100)}%` : '100%';
    const h = s.started ? hint() : '';
    $('hint').hidden = !h;
    setText($('hint'), h);
    sheetLive?.();
  }

  // ── 아래 버튼, 첫 화면 ──
  $('bar').addEventListener('click', ev => {
    const btn = ev.target.closest('[data-nav]');
    if (!btn) return;
    sfx('tap');
    ({ cook: openCook, edit: openEdit, dog: openDog, notes: openNotes })[btn.dataset.nav]();
  });
  $('shopBtn').addEventListener('click', () => { sfx('tap'); openSettings(); });

  const intro = $('intro');
  intro.hidden = G.state.started;
  intro.addEventListener('submit', ev => {
    ev.preventDefault();
    const s = G.state;
    s.shopName = $('introShop').value.trim() || $('introShop').placeholder;
    s.dogName = $('introDogName').value.trim() || $('introDogName').placeholder;
    s.started = true;
    s.lastSeen = Date.now();
    save();
    intro.hidden = true;
    sfx('level');
    refresh();
  });

  on('toast', msg => { toast(msg); sfx('err'); });
  on('sale', () => sfx('coin'));
  on('serve', () => sfx('serve'));
  on('collect', r => { sfx('done'); toast(`${r.name} ${r.n}그릇을 진열했어요`); });
  on('pet', () => sfx('bark'));
  on('place', () => sfx('place'));
  on('levelup', showLevelUp);

  refresh();
  return { refresh, renderEdit, openCook, showWelcome, toast };
}
