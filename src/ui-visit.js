// 놀러 가기 화면: 초대장 보내기와 붙여 넣기, 최신 모습 공유, 다녀온 가게와 차단한 가게 목록, 구경 중 표시와 신고.
import { G } from './game.js';
import {
  makeSnapshot, encode, decode, inviteLink, codeFromText,
  friends, rememberFriend, forgetFriend, startVisit, endVisit,
  sharing, startSharing, stopSharing, pushShop, latestOf, isBlocked, block, unblock, report,
} from './visit.js';
import { VISIT_GIFT, GIFTS_PER_DAY } from './data.js';
import { $, esc, copyText } from './dom.js';
import { share } from './device.js';
import { sfx } from './sfx.js';

const UNREADABLE = '초대장을 읽지 못했어요. 주소를 처음부터 끝까지 복사했는지 봐 주세요';
const BAD_WORDS = '이름에 쓸 수 없는 말이 있어서 서버에 올리지 못했어요. 이름을 바꾸면 다시 올라가요';

export function createVisitUI({ toast, openSheet, closeSheet, refresh, coin }) {
  // 구경 중이면 아래 버튼 대신 '○○ 구경 중'과 신고, 돌아가기 버튼을 보여 준다.
  function showBars() {
    const visiting = !!G.visit;
    $('bar').hidden = visiting;
    $('visitBar').hidden = !visiting;
    $('intro').hidden = visiting || G.state.started;
    if (!visiting) return;
    $('visitText').textContent = `${G.visit.name} 구경 중`;
    $('visitReport').hidden = G.visit.mine;
    $('visitLeave').textContent = G.home.started ? '우리 가게로' : '내 가게 열기';
  }

  // 가게로 구경을 간다. 서버에 더 새로운 모습이 있으면 그 모습으로 간다. 갈 수 없으면 알려 주고 false.
  async function visit(snap) {
    if (isBlocked(snap.s)) { toast('차단한 가게예요. 놀러 가기에서 차단을 풀 수 있어요'); sfx('err'); return false; }
    toast('가게로 가는 중이에요');
    const fresh = await latestOf(snap);
    if (!fresh) { toast('운영자가 가려 둔 가게라서 볼 수 없어요'); sfx('err'); return false; }
    rememberFriend(fresh, await encode(fresh));
    closeSheet();
    startVisit(fresh);
    showBars();
    refresh();
    sfx('level');
    toast(G.visit.mine ? '친구에게 보이는 우리 가게 모습이에요' : `${fresh.n}에 놀러 왔어요`);
    return true;
  }

  // 초대장 글을 읽어 그 가게로 간다. 못 읽으면 알려 주고 false.
  async function follow(code) {
    const snap = code && await decode(code);
    if (!snap) { toast(UNREADABLE); sfx('err'); return false; }
    return visit(snap);
  }

  function leave() {
    const gift = endVisit();
    showBars();
    refresh();
    return gift;
  }

  $('visitLeave').addEventListener('click', () => {
    const gift = leave();
    sfx(gift ? 'coin' : 'tap');
    if (gift) toast(`방문 선물로 코인 ${gift}개를 받았어요`);
  });

  // ── 신고와 차단: 구경 중인 가게에 불쾌한 이름이나 그림이 있을 때 ──
  $('visitReport').addEventListener('click', () => {
    const { snap, name } = G.visit;
    sfx('tap');
    const done = msg => {
      block(snap.s, name); // 선물 계산 전에 목록에서 빼서, 차단한 가게에서는 선물을 받지 않는다
      closeSheet();
      leave();
      toast(msg);
    };
    openSheet('신고하기', `<div class="stack">
        <p><b>${esc(name)}</b>에 불쾌한 이름이나 그림이 있나요?</p>
        <p class="muted">신고하면 운영자가 확인해서 그 가게를 가립니다. 신고한 가게는 내 기기에서 바로 차단돼서 다시 보이지 않아요.</p>
        <label class="field">어떤 점이 문제인가요<textarea id="reportText" rows="2" maxlength="200" placeholder="예) 가게 이름에 욕설이 있어요"></textarea></label>
        <button type="button" class="btn primary big" data-act="report">신고하고 차단하기</button>
        <button type="button" class="btn" data-act="block">신고 없이 차단만 하기</button>
      </div>`, {
      actions: {
        async report(el) {
          el.disabled = true;
          const sent = await report(snap, $('reportText').value);
          done(sent ? '신고를 받았어요. 이 가게는 차단했어요' : '서버에 닿지 않아 신고는 못 보냈어요. 이 가게는 차단했어요');
        },
        block() { done('이 가게를 차단했어요'); },
      },
    });
  });

  // ── 최신 모습 공유 ──
  // 서버에 올린 결과를 알려 줄 일이 있으면 알려 준다. 매번 조용히 부르는 쪽(main.js)과 같이 쓴다.
  function tell(result) {
    if (result === 'words') toast(BAD_WORDS);
    else if (result === 'moved') toast('가게 번호가 새로 정해졌어요. 친구에게 초대장을 다시 보내 주세요');
  }
  const syncShop = keepalive => pushShop(keepalive).then(tell);

  async function sendInvite() {
    const url = inviteLink(await encode(makeSnapshot()));
    const text = `${G.state.shopName}에 놀러 오세요!`;
    if (await share({ text, url })) return;
    if (await copyText(`${text}\n${url}`)) { toast('초대장을 복사했어요. 카톡에 붙여 넣어 보내세요'); return; }
    openNeighbors();
    $('inviteText').value = url;
    toast('복사가 안 돼요. 아래 칸의 주소를 길게 눌러 복사해 주세요');
  }

  // 공유를 켤지 묻는다. 켜면 가게 모습이 서버에 올라가므로, 무엇이 올라가는지와 지켜야 할 것을 먼저 보여 준다.
  function askSharing(then) {
    openSheet('최신 모습 공유', `<div class="stack">
        <p>초대장을 받은 친구가 올 때마다 <b>그때의 우리 가게 모습</b>을 보게 할까요?</p>
        <p class="muted">켜면 가게 이름, 동물 친구의 종류·이름·옷, 가구와 바닥·벽지, 직접 만든 메뉴의 이름과 그림이 서버에 올라가고, 가게를 고칠 때마다 새로 올라가요. 코인, 의견, 액자 사진은 올라가지 않아요.</p>
        <p class="muted">욕설이나 불쾌한 이름·그림은 올리면 안 돼요. 신고가 들어오면 운영자가 확인해서 가게를 가립니다. 놀러 가기에서 언제든 끄고 서버에서 지울 수 있어요.</p>
        <button type="button" class="btn primary big" data-act="on">동의하고 공유 켜기</button>
        <button type="button" class="btn" data-act="off">${then ? '지금 모습만 보내기' : '켜지 않기'}</button>
      </div>`, {
      actions: {
        async on(el) {
          el.disabled = true;
          const result = await startSharing();
          sfx('place');
          if (result === 'ok') toast('공유를 켰어요. 이제 친구가 올 때마다 지금 모습을 봐요');
          else if (result === 'words') toast(BAD_WORDS);
          else toast('공유를 켰어요. 서버에 닿으면 자동으로 올라가요');
          openNeighbors();
          if (then) await then();
        },
        async off() { openNeighbors(); if (then) await then(); },
      },
    });
  }

  function openNeighbors() {
    const f = friends(), list = f.list, on = sharing();
    const rows = list.length
      ? list.map(e => `<li><span><b>${esc(e.name)}</b><br><small class="muted">Lv ${e.lv} · ${esc(e.got)}에 본 모습</small></span>
          <button type="button" class="btn primary" data-act="revisit" data-sid="${esc(e.sid)}">놀러 가기</button>
          <button type="button" class="btn" data-act="forget" data-sid="${esc(e.sid)}">지우기</button></li>`).join('')
      : '<li><span class="muted">아직 다녀온 가게가 없어요</span></li>';
    const blocked = f.blocked.length
      ? `<hr><p><b>차단한 가게</b></p><ul class="list">${f.blocked.map(b => `<li><span>${esc(b.name)}</span>
          <button type="button" class="btn" data-act="unblock" data-sid="${esc(b.sid)}">차단 풀기</button></li>`).join('')}</ul>`
      : '';
    openSheet('놀러 가기', `
      <p class="muted">초대장을 주고받으면 서로의 가게를 구경할 수 있어요. 초대장에는 가게 모습, 동물 친구, 직접 만든 메뉴만 담기고 코인과 의견, 액자 사진은 담기지 않아요.</p>
      <button type="button" class="btn primary big" data-act="invite">우리 가게 초대장 보내기</button>
      <label class="field">받은 초대장 붙여 넣기<textarea id="inviteText" rows="2" placeholder="친구가 보낸 초대장 주소를 붙여 넣어요" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea></label>
      <button type="button" class="btn" data-act="go">이 초대장으로 놀러 가기</button>
      <hr>
      <p><b>최신 모습 공유</b> · ${on ? '켜짐' : '꺼짐'}</p>
      <p class="muted">${on
    ? '가게를 고치면 서버에 새로 올라가서, 친구가 올 때마다 지금 모습을 봐요.'
    : '꺼져 있으면 친구는 초대장을 보낸 때의 모습만 봐요.'}</p>
      <button type="button" class="btn" data-act="sharing">${on ? '공유 끄고 서버에서 지우기' : '공유 켜기'}</button>
      <hr>
      <p><b>다녀온 가게</b></p>
      <ul class="list">${rows}</ul>
      <p class="muted">구경하고 오면 방문 선물로 ${coin(VISIT_GIFT)}개를 받아요. 가게마다 하루 한 번, 하루에 ${GIFTS_PER_DAY}번까지예요. 불쾌한 가게는 구경 중에 신고하거나 차단할 수 있어요.</p>
      ${blocked}`, {
      actions: {
        // 공유가 꺼져 있으면 초대장을 보내기 전에 켤지 먼저 묻는다.
        invite() { if (sharing()) sendInvite(); else askSharing(sendInvite); },
        go() { follow(codeFromText($('inviteText').value)); },
        revisit(el) { follow(list.find(e => e.sid === el.dataset.sid).code); },
        forget(el) { forgetFriend(el.dataset.sid); openNeighbors(); },
        unblock(el) { unblock(el.dataset.sid); openNeighbors(); toast('차단을 풀었어요'); },
        async sharing(el) {
          if (!on) { askSharing(null); return; }
          el.disabled = true;
          const off = await stopSharing();
          toast(off ? '공유를 끄고 서버에서 지웠어요' : '서버에 닿지 않아 지우지 못했어요. 인터넷이 될 때 다시 눌러 주세요');
          openNeighbors();
        },
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
    if (isBlocked(snap.s)) { toast('차단한 가게의 초대장이에요'); return; }
    rememberFriend(snap, code);
    if (!G.state.started) { visit(snap); return; }
    openSheet('초대장이 왔어요', `<div class="center stack">
        <p><b>${esc(snap.n)}</b>에서 초대장을 보냈어요</p>
        <p class="muted">Lv ${snap.l} · 동물 친구 ${snap.p.length}마리</p>
        <button type="button" class="btn primary big" data-act="go">구경하러 가기</button>
        <button type="button" class="btn" data-act="later">나중에</button>
        <p class="muted">나중에 가려면 놀러 가기의 다녀온 가게에서 찾을 수 있어요.</p>
      </div>`, { actions: { go() { visit(snap); }, later: closeSheet } });
  }

  return { openNeighbors, handleInvite, syncShop };
}
