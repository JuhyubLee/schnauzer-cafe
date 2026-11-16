// 압축하거나 푸는 도우미. 초대장(visit.js)과 백업 코드(game.js)가 같이 쓴다.

// bytes를 stream(CompressionStream 또는 DecompressionStream)에 통과시킨 결과를 돌려준다.
// 결과가 max 바이트를 넘으면 그만두고 오류를 낸다(작게 압축된 아주 큰 글을 막는다).
export async function through(bytes, stream, max) {
  const reader = new Blob([bytes]).stream().pipeThrough(stream).getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > max) { await reader.cancel(); throw new Error('too big'); }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.length; }
  return out;
}
