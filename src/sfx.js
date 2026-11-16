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
  eat: [[220, 0.04], [165, 0.05], [220, 0.04], [165, 0.06]],
  level: [[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.22]],
  err: [[160, 0.12]],
};

// 동물 친구의 목소리. 종마다 다르다. 한 번 우는 동안 음 높이가 f의 처음 → 가운데 → 끝으로 미끄러진다(가운데는 길이의 30% 지점).
// wave: 소리 결, dur: 한 번 우는 길이(초), gap: 다음 울음까지 쉬는 시간(초), times: 우는 횟수, vol: 크기
const VOICES = {
  schnauzer: { wave: 'sawtooth', f: [210, 300, 150], dur: 0.11, gap: 0.08, times: 2, vol: 0.07 }, // 굵게 두 번
  maltese: { wave: 'square', f: [820, 1050, 760], dur: 0.055, gap: 0.045, times: 2, vol: 0.04 }, // 높고 빠르게 앙앙
  shiba: { wave: 'sawtooth', f: [380, 520, 300], dur: 0.13, gap: 0.1, times: 1, vol: 0.06 }, // 짧게 한 번
  poodle: { wave: 'square', f: [520, 700, 880], dur: 0.07, gap: 0.05, times: 2, vol: 0.04 }, // 끝이 올라가는 통통 튀는 소리
  cheese: { wave: 'triangle', f: [560, 840, 600], dur: 0.4, gap: 0.12, times: 1, vol: 0.12 }, // 야옹
  tuxedo: { wave: 'triangle', f: [430, 640, 420], dur: 0.5, gap: 0.12, times: 1, vol: 0.13 }, // 낮고 느긋한 야옹
  graycat: { wave: 'triangle', f: [760, 1080, 820], dur: 0.28, gap: 0.1, times: 1, vol: 0.11 }, // 높고 짧은 냐옹
};

let ctx = null;

// 효과음과 음악이 같이 쓰는 오디오 장치. 소리를 못 내는 브라우저면 null.
// 브라우저는 화면을 한 번 누른 뒤에야 소리를 허락한다.
// 전화가 오는 등으로 장치가 잠들거나(suspended) 끊기면(아이폰에서는 interrupted) 쓸 때마다 다시 깨운다.
export function audioCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx || ctx.state === 'closed') ctx = new AC();
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  return ctx;
}

// 다른 앱에 다녀와서 화면으로 돌아왔을 때 부른다. 쓰던 장치를 버려서 다음에 쓸 때 새로 만들게 한다.
// 아이폰에서는 다른 앱에 다녀오면 장치가 끊기는데, 깨워도 소리가 돌아오지 않거나 켜져 있다고 나오면서
// 소리만 안 나는 일이 있어서, 깨우는 대신 새로 만든다. 새 장치는 앱에서는 바로, 브라우저에서는 화면을 한 번 누르면 켜진다.
export function resetAudio() {
  if (!ctx) return;
  const old = ctx;
  ctx = null;
  old.close().catch(() => {});
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

// 동물 친구가 운다. excited면 한 번 더 운다(좋아하는 간식을 먹었을 때).
export function voice(species, excited = false) {
  if (!G.state.sound) return;
  const ac = audioCtx(), v = VOICES[species];
  if (!ac || !v) return;
  const [from, mid, to] = v.f;
  let t = ac.currentTime;
  for (let i = 0; i < v.times + (excited ? 1 : 0); i++) {
    const osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = v.wave;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(mid, t + v.dur * 0.3);
    osc.frequency.exponentialRampToValueAtTime(to, t + v.dur);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(v.vol, t + v.dur * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + v.dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + v.dur);
    t += v.dur + v.gap;
  }
}
