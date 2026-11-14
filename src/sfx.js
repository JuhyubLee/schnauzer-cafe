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
export function audioCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx ||= new AC();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
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
