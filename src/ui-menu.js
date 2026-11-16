// 나만의 메뉴 만들기: 이름과 등급을 정하고, 16×16 아이콘을 직접 그린다.
import { G, level, saveCustom, deleteCustom, save } from './game.js';
import { CUSTOM_TIERS, CUSTOM_NAME_MAX, SHOP_TYPES, fmtTime } from './data.js';
import { PAL, ICON_COLORS, ICON_SIZE, ICON_TEMPLATES, setSprite } from './sprites.js';
import { $, esc } from './dom.js';
import { sfx } from './sfx.js';

const ERASER = '.';
const COLOR_NAMES = {
  w: '흰색', c: '크림색', y: '노랑', a: '살구색', o: '주황', r: '빨강', R: '진한 빨강', p: '분홍',
  n: '초록', N: '진한 초록', u: '하늘색', b: '갈색', B: '진한 갈색', l: '연한 회색', g: '회색', K: '검정',
};
const MAX_UNDO = 30;

export function createMenuUI({ toast, openSheet }) {
  // id가 없으면 새 메뉴. 저장하거나 지우면 onDone을 부른다.
  function openEditor(id, onDone) {
    const existing = G.state.custom.find(c => c.id === id);
    let px = (existing ? existing.px : ICON_TEMPLATES.bowl.rows).map(row => [...row]);
    let tier = existing ? existing.tier : 'quick';
    let color = 'r';
    const undo = [];
    const scratch = {}; // 미리보기를 그릴 임시 그림판
    const lv = level(), { unit } = SHOP_TYPES[G.state.type];

    const tiers = Object.entries(CUSTOM_TIERS).map(([tid, t]) => {
      const locked = t.lv > lv;
      return `<button type="button" class="card" data-act="tier" data-id="${tid}" ${locked ? 'disabled' : ''}>
        <b>${t.name}</b>${locked ? `<small>Lv ${t.lv}</small>`
    : `<small>${fmtTime(t.time)} · ${t.n}${unit}</small><small>재료 ${t.cost}</small><small>${unit}당 ${t.price}</small>`}</button>`;
    }).join('');
    const swatches = `<button type="button" class="swatch eraser" data-act="color" data-c="${ERASER}" aria-label="지우개"></button>`
      + ICON_COLORS.map(c => `<button type="button" class="swatch" data-act="color" data-c="${c}" style="background:${PAL[c]}" aria-label="${COLOR_NAMES[c]}"></button>`).join('');
    const templates = Object.entries(ICON_TEMPLATES).map(([tid, t]) =>
      `<button type="button" class="btn" data-act="template" data-id="${tid}">${t.name}</button>`).join('');

    openSheet(existing ? '메뉴 고치기' : '나만의 메뉴 만들기', `
      <label class="field">메뉴 이름<input id="menuName" maxlength="${CUSTOM_NAME_MAX}" value="${esc(existing ? existing.name : '')}" placeholder="예) 마라탕" autocomplete="off"></label>
      <p><b>등급</b></p>
      <div class="tiers">${tiers}</div>
      <p><b>아이콘 그리기</b></p>
      <div class="draw">
        <div class="paper"><canvas id="iconCanvas" width="${ICON_SIZE}" height="${ICON_SIZE}" aria-label="아이콘을 그리는 칸"></canvas></div>
        <div class="draw-side">
          <img class="px" id="iconPreview" alt="가게에서 보이는 모습">
          <small class="muted">가게에서 보이는 모습</small>
          <button type="button" class="btn" data-act="undo">되돌리기</button>
        </div>
      </div>
      <div class="swatches" role="group" aria-label="색">${swatches}</div>
      <p class="muted">밑그림을 고르면 지금 그림이 바뀌어요. 잘못 눌렀으면 되돌리기를 누르세요.</p>
      <div class="wrap">${templates}</div>
      <hr>
      <div class="pair">
        <button type="button" class="btn primary" data-act="keep">저장</button>
        ${existing ? '<button type="button" class="btn danger" data-act="remove">메뉴 지우기</button>' : ''}
      </div>`, {
      actions: {
        tier(el) { tier = el.dataset.id; mark(); },
        color(el) { color = el.dataset.c; mark(); },
        template(el) { remember(); px = ICON_TEMPLATES[el.dataset.id].rows.map(row => [...row]); redraw(); },
        undo() { if (undo.length) { px = undo.pop(); redraw(); } },
        keep() {
          const name = $('menuName').value;
          if (!saveCustom({ id, name, tier, px: px.map(row => row.join('')) })) return;
          save();
          sfx('done');
          toast(`${name.trim()} 메뉴를 저장했어요`);
          onDone();
        },
        remove(el) {
          if (!el.dataset.sure) {
            el.dataset.sure = '1';
            el.textContent = '한 번 더 누르면 지워져요';
            return;
          }
          if (!deleteCustom(id)) return;
          save();
          onDone();
        },
      },
    });

    const canvas = $('iconCanvas'), g = canvas.getContext('2d');
    function redraw() {
      g.clearRect(0, 0, ICON_SIZE, ICON_SIZE);
      px.forEach((row, y) => row.forEach((ch, x) => {
        if (ch === ERASER) return;
        g.fillStyle = PAL[ch];
        g.fillRect(x, y, 1, 1);
      }));
      setSprite(scratch, 'preview', px.map(row => row.join('')));
      $('iconPreview').src = scratch.preview.toDataURL();
    }
    // 고른 등급과 색에 표시를 한다.
    function mark() {
      for (const el of document.querySelectorAll('#sheetBody [data-act="tier"]')) el.classList.toggle('on', el.dataset.id === tier);
      for (const el of document.querySelectorAll('#sheetBody .swatch')) el.classList.toggle('on', el.dataset.c === color);
    }
    function remember() {
      undo.push(px.map(row => [...row]));
      if (undo.length > MAX_UNDO) undo.shift();
    }
    function paintAt(e) {
      const r = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - r.left) / r.width * ICON_SIZE), y = Math.floor((e.clientY - r.top) / r.height * ICON_SIZE);
      if (x < 0 || y < 0 || x >= ICON_SIZE || y >= ICON_SIZE || px[y][x] === color) return;
      px[y][x] = color;
      redraw();
    }
    let drawing = false;
    canvas.addEventListener('pointerdown', e => {
      canvas.setPointerCapture(e.pointerId);
      remember();
      drawing = true;
      paintAt(e);
    });
    canvas.addEventListener('pointermove', e => { if (drawing) paintAt(e); });
    canvas.addEventListener('pointerup', () => { drawing = false; });
    canvas.addEventListener('pointercancel', () => { drawing = false; });

    mark();
    redraw();
  }

  return { openEditor };
}
