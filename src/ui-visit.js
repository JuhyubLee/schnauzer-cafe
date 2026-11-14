// 놀러 가기 화면: 초대장 보내기와 붙여 넣기, 다녀온 가게 목록, 구경 중 표시.
import { G } from './game.js';
import {
  makeSnapshot, encode, decode, inviteLink, codeFromText,
  friends, rememberFriend, forgetFriend, startVisit, endVisit,
} from './visit.js';
import { VISIT_GIFT, GIFTS_PER_DAY } from './data.js';
import { $, esc, copyText } from './dom.js';
import { sfx } from './sfx.js';

const UNREADABLE = '초대장을 읽지 못했어요. 주소를 처음부터 끝까지 복사했는지 봐 주세요';

export function createVisitUI({ toast, openSheet, closeSheet, refresh, coin }) {
  // 구경 중이면 아래 버튼 대신 '○○ 구경 중'과 돌아가기 버튼을 보여 준다.
  function showBars() {
    const visiting = !!G.visit;
    $('bar').hidden = visiting;
    $('visitBar').hidden = !visiting;
    $('intro').hidden = visiting || G.state.started;
    if (!visiting) return;
    $('visitText').textContent = `${G.visit.name} 구경 중`;
    $('visitLeave').textContent = G.home.started ? '우리 가게로' : '내 가게 열기';
  }

  function begin(snap) {
    closeSheet();
    startVisit(snap);
    showBars();
    refresh();
    sfx('level');
    toast(G.visit.mine ? '친구에게 보이는 우리 가게 모습이에요' : `${snap.n}에 놀러 왔어요`);
  }

  // 초대장 글을 읽어 그 가게로 간다. 못 읽으면 알려 주고 false.
  async function follow(code) {
    const snap = code && await decode(code);
    if (!snap) { toast(UNREADABLE); sfx('err'); return false; }
    rememberFriend(snap, code);
    begin(snap);
    return true;
  }

  $('visitLeave').addEventListener('click', () => {
    const gift = endVisit();
    showBars();
    refresh();
    sfx(gift ? 'coin' : 'tap');
    if (gift) toast(`방문 선물로 코인 ${gift}개를 받았어요`);
  });

  function openNeighbors() {
    const list = friends().list;
    const rows = list.length
      ? list.map(e => `<li><span><b>${esc(e.name)}</b><br><small class="muted">Lv ${e.lv} · ${esc(e.got)}에 받은 모습</small></span>
          <button type="button" class="btn primary" data-act="revisit" data-sid="${esc(e.sid)}">놀러 가기</button>
          <button type="button" class="btn" data-act="forget" data-sid="${esc(e.sid)}">지우기</button></li>`).join('')
      : '<li><span class="muted">아직 다녀온 가게가 없어요</span></li>';
    openSheet('놀러 가기', `
      <p class="muted">초대장을 주고받으면 서로의 가게를 구경할 수 있어요. 초대장에는 가게 모습, 동물 친구, 직접 만든 메뉴만 담기고 코인과 의견은 담기지 않아요.</p>
      <button type="button" class="btn primary big" data-act="invite">우리 가게 초대장 보내기</button>
      <label class="field">받은 초대장 붙여 넣기<textarea id="inviteText" rows="2" placeholder="친구가 보낸 초대장 주소를 붙여 넣어요" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea></label>
      <button type="button" class="btn" data-act="go">이 초대장으로 놀러 가기</button>
      <hr>
      <p><b>다녀온 가게</b></p>
      <ul class="list">${rows}</ul>
      <p class="muted">구경하고 오면 방문 선물로 ${coin(VISIT_GIFT)}개를 받아요. 가게마다 하루 한 번, 하루에 ${GIFTS_PER_DAY}번까지예요.</p>`, {
      actions: {
        async invite() {
          const url = inviteLink(await encode(makeSnapshot()));
          const text = `${G.state.shopName}에 놀러 오세요!`;
          if (navigator.share) {
            try { await navigator.share({ text, url }); } catch { /* 공유 창을 닫은 경우 */ }
            return;
          }
          if (await copyText(`${text}\n${url}`)) { toast('초대장을 복사했어요. 카톡에 붙여 넣어 보내세요'); return; }
          $('inviteText').value = url;
          toast('복사가 안 돼요. 아래 칸의 주소를 길게 눌러 복사해 주세요');
        },
        go() { follow(codeFromText($('inviteText').value)); },
        revisit(el) { follow(list.find(e => e.sid === el.dataset.sid).code); },
        forget(el) { forgetFriend(el.dataset.sid); openNeighbors(); },
      },
    });
  }

  // 초대장 링크(주소 뒤 #visit=...)로 들어왔을 때. 내 가게가 있으면 갈지 물어보고, 없으면 바로 구경한다.
  async function handleInvite(text) {
    const code = codeFromText(text);
    if (!code) return;
    history.replaceState(null, '', location.pathname + location.search); // 새로고침해도 다시 묻지 않게
    const snap = await decode(code);
    if (!snap) { toast(UNREADABLE); return; }
    rememberFriend(snap, code);
    if (!G.state.started) { begin(snap); return; }
    openSheet('초대장이 왔어요', `<div class="center stack">
        <p><b>${esc(snap.n)}</b>에서 초대장을 보냈어요</p>
        <p class="muted">Lv ${snap.l} · 동물 친구 ${snap.p.length}마리</p>
        <button type="button" class="btn primary big" data-act="go">구경하러 가기</button>
        <button type="button" class="btn" data-act="later">나중에</button>
        <p class="muted">나중에 가려면 놀러 가기의 다녀온 가게에서 찾을 수 있어요.</p>
      </div>`, { actions: { go() { begin(snap); }, later: closeSheet } });
  }

  return { openNeighbors, handleInvite };
}
