// 짧은 8비트 효과음. 소리 파일 없이 Web Audio로 만든다.
import { G } from './game.js';

// [주파수(Hz), 길이(초)]를 이어서 낸다.
const SOUNDS = {
  tap: [[660, 0.04]],
  cook: [[330, 0.06], [440, 0.08]],
  done: [[784, 0.07], [988, 0.07], [1175, 0.12]],
  serve: [[880, 0.05]],
  coin: [[988, 0.05], [1319, 0.09]],
  place: [[440, 0.05], [554, 0.05]],
  bark: [[240, 0.05], [190, 0.08]],
  level: [[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.22]],
  err: [[160, 0.12]],
};

let ctx = null;

// 효과음과 음악이 같이 쓰는 오디오 장치. 소리를 못 내는 브라우저면 null.
// 브라우저는 화면을 한 번 누른 뒤에야 소리를 허락한다.
// 다른 앱에 다녀오면 장치가 잠들거나(suspended) 끊긴다(아이폰에서는 interrupted). 그래서 쓸 때마다 깨운다.
export function audioCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx || ctx.state === 'closed') ctx = new AC();
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  return ctx;
}

// 화면으로 돌아왔을 때 부른다. 장치를 깨워 보고, 잠깐 기다려도 안 깨어나면 버린다(다음에 쓸 때 새로 만든다).
// 끊겼던 장치가 다시는 소리를 내지 않는 일이 아이폰에서 있어서다. 새 장치는 화면을 한 번 누르면 켜진다.
const WAKE_WAIT = 300;
export async function wakeAudio() {
  if (!ctx || ctx.state === 'running') return;
  const stale = ctx;
  // 누르지 않은 상태에서는 깨우기가 끝나지 않고 계속 기다리게 될 수 있어서 시간을 정해 둔다.
  await Promise.race([stale.resume().catch(() => {}), new Promise(done => setTimeout(done, WAKE_WAIT))]);
  if (stale.state === 'running' || ctx !== stale) return;
  ctx = null;
  stale.close().catch(() => {});
}

export function sfx(name) {
  if (!G.state.sound) return;
  const ac = audioCtx();
  if (!ac) return;
  let t = ac.currentTime;
  for (const [freq, dur] of SOUNDS[name]) {
    const osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur);
    t += dur;
  }
}
