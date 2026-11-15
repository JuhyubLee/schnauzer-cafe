// 서버(Supabase)와 주고받는 부분. 서버 쪽 함수는 server/schema.sql에 있다.
// 서버가 안 닿아도 게임은 그대로 돌아가야 하므로, 모든 함수는 실패하면 던지지 않고 undefined를 돌려준다.
import { SERVER_URL, SERVER_KEY } from './data.js';

const TIMEOUT = 4000; // 구경하러 갈 때 이보다 오래 기다리게 하지 않는다

// keepalive: 화면을 떠나는 순간에 보내는 요청(브라우저가 끝까지 보내 준다)
async function rpc(name, args, keepalive = false) {
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), TIMEOUT);
  try {
    const res = await fetch(`${SERVER_URL}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: SERVER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
      signal: stop.signal,
      keepalive,
    });
    return res.ok ? await res.json() : undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

// 가게 모습을 올린다. 'ok', 'words'(이름에 욕설), 'denied'(열쇠가 다름), 'big', 'bad', 'full'
export const putShop = (id, key, snap, keepalive) => rpc('kk_put_shop', { p_id: id, p_key: key, p_snap: snap }, keepalive);
// 가게의 최신 모습. { snap, at }, 가려진 가게면 { hidden: true }, 올린 적이 없으면 null
export const getShop = id => rpc('kk_get_shop', { p_id: id });
// 올려 둔 모습을 지운다. 'ok' 또는 'none'
export const deleteShop = (id, key) => rpc('kk_delete_shop', { p_id: id, p_key: key });
// 신고한다. reporter는 신고하는 쪽 가게 번호, snap은 보고 있던 모습. 'ok', 'busy', 'bad'
export const reportShop = (id, reason, reporter, snap) =>
  rpc('kk_report_shop', { p_id: id, p_reason: reason, p_reporter: reporter, p_snap: snap });
