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
  bell: [[2093, 0.06], [2637, 0.3]], // 손님이 들어올 때 문에 달린 종
  miss: [[330, 0.09], [247, 0.16]], // 손님이 끝내 못 받고 나갈 때
};
// 기본은 네모난 소리(square)를 0.05 크기로 낸다. 여기 적은 소리만 다르게 낸다 [소리 결, 크기].
// 종과 놓친 소리는 손님마다 나므로 다른 소리보다 작게 낸다.
const TONES = { bell: ['sine', 0.06], miss: ['square', 0.035] };

// 동물 친구의 목소리. 종마다 다르다. 톱니 소리(목청)를 입 모양의 울림 두 개에 통과시켜 만든다.
// 맨 소리 그대로면 삑 하는 효과음처럼 들리고 폰 스피커에서 잘 안 들려서(2026-11-16 사용자: "짖는 소리가 안 들려") 이렇게 바꿨다.
// f: 목청의 높이(Hz) [처음, 가운데, 끝]. 한 번 우는 동안 미끄러진다(가운데는 길이의 30% 지점).
// mouth: 입 모양의 울림 [[높이(Hz) 또는 [처음, 가운데, 끝], 세기], …]. 폰 스피커가 잘 내는 600~2500Hz에 둔다.
// rough: 첫머리의 거친 숨(개가 짖을 때). attack: 소리가 커지는 시간(초). 개는 탁 터지고 고양이는 천천히 커진다.
// dur: 한 번 우는 길이(초), gap: 다음 울음까지 쉬는 시간(초), times: 우는 횟수, vol: 크기(.omp/voice-check.js로 잰 값에 맞췄다)
const VOICES = {
  schnauzer: { f: [300, 330, 190], mouth: [[650, 1], [1300, 0.6]], rough: 0.5, attack: 0.01, dur: 0.16, gap: 0.09, times: 2, vol: 0.42 }, // 굵게 웡웡
  maltese: { f: [640, 700, 470], mouth: [[1100, 1], [2300, 0.6]], rough: 0.4, attack: 0.008, dur: 0.09, gap: 0.06, times: 2, vol: 0.6 }, // 높고 빠르게 앙앙
  shiba: { f: [430, 470, 290], mouth: [[800, 1], [1700, 0.6]], rough: 0.5, attack: 0.01, dur: 0.18, gap: 0.1, times: 1, vol: 0.5 }, // 짧게 한 번 왕
  poodle: { f: [500, 560, 620], mouth: [[950, 1], [1900, 0.6]], rough: 0.4, attack: 0.008, dur: 0.1, gap: 0.05, times: 2, vol: 0.55 }, // 끝이 올라가는 통통 튀는 소리
  cheese: { f: [520, 780, 540], mouth: [[[800, 1300, 700], 1], [[1700, 2300, 1300], 0.5]], attack: 0.08, dur: 0.45, gap: 0.12, times: 1, vol: 0.5 }, // 야옹
  tuxedo: { f: [400, 610, 390], mouth: [[[700, 1100, 600], 1], [[1500, 2000, 1100], 0.5]], attack: 0.1, dur: 0.55, gap: 0.12, times: 1, vol: 0.48 }, // 낮고 느긋한 야옹
  graycat: { f: [700, 1020, 780], mouth: [[[1000, 1500, 900], 1], [[2000, 2600, 1600], 0.5]], attack: 0.06, dur: 0.3, gap: 0.1, times: 1, vol: 0.52 }, // 높고 짧은 냐옹
};

let ctx = null;
let away = false; // 화면을 떠나 있는 동안. 이때는 장치를 만들지 않는다
let closing = 0; // 버렸지만 아직 닫히는 중인 장치 수
let closed = Promise.resolve(); // 버린 장치가 모두 닫히면 끝난다
let clock = -1, clockAt = 0; // 장치의 시계(currentTime)가 마지막으로 움직였을 때의 값과 그 시각(ms)

const CLOSE_WAIT = 500; // 닫기가 끝나지 않으면 이만큼(ms)만 기다린다
const STUCK_MS = 1200; // 장치의 시계가 이만큼(ms) 멈춰 있으면 먹통으로 본다

// 효과음과 음악이 같이 쓰는 오디오 장치. 지금 소리를 낼 수 없으면 null
// (소리를 못 내는 브라우저, 화면을 떠나 있는 동안, 버린 장치가 아직 닫히는 중).
// 브라우저는 화면을 한 번 누른 뒤에야 소리를 허락한다. 잠들어 있는 장치는 쓸 때마다 다시 깨운다.
export function audioCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC || away || closing) return null;
  if (!ctx || ctx.state === 'closed') {
    ctx = new AC();
    clock = -1;
    clockAt = performance.now();
  }
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  return ctx;
}

// 쓰던 장치를 버린다. 다 닫힌 뒤에야 audioCtx()가 새 장치를 만든다.
// 아이폰은 닫히지 않은 장치가 하나라도 남아 있으면 새로 만든 장치도 소리가 안 나는 일이 있다
// (오디오 세션이 켜져 있다고 잘못 기억하는데, 마지막 장치가 닫혀야 그 기억이 지워진다).
function drop() {
  if (!ctx) return;
  const old = ctx;
  ctx = null;
  closing++;
  const done = Promise.race([old.close().catch(() => {}), new Promise(ok => setTimeout(ok, CLOSE_WAIT))]);
  closed = Promise.all([closed, done.then(() => { closing--; })]);
}

// 화면을 떠난다(다른 앱으로 가거나, 제어 센터·전화처럼 앱이 잠깐 멈출 때). 장치를 닫아 둔다.
// 떠나 있는 동안 살아 있던 장치는 돌아와서 깨워도 소리가 안 나는 일이 있어서, 깨우지 않고 돌아와서 새로 만든다.
export function leaveAudio() {
  away = true;
  drop();
}

// 돌아왔다. 버린 장치가 다 닫히면 끝나는 약속을 돌려준다(그 뒤부터 audioCtx()가 장치를 준다).
// 화면을 누를 때도 부른다. 잠든 장치는 누른 순간에 깨워야 켜 주는 브라우저가 있어서, 켜질 틈을 새로 준다.
export function enterAudio() {
  away = false;
  if (ctx && ctx.state !== 'running') clockAt = performance.now();
  return closed;
}

// 먹통인 장치를 버린다. 다 닫히면 끝나는 약속을 돌려준다.
export function renewAudio() {
  drop();
  return closed;
}

// 장치가 먹통인지(1초에 몇 번 부른다). 켜졌다고 나오는데 시계가 안 가거나, 깨워도 안 켜진 채 STUCK_MS가 지났으면 먹통이다.
export function audioStuck() {
  if (!ctx) return false;
  const now = performance.now();
  if (ctx.state === 'running' && ctx.currentTime !== clock) {
    clock = ctx.currentTime;
    clockAt = now;
    return false;
  }
  return now - clockAt > STUCK_MS;
}

export function sfx(name) {
  if (!G.state.sound) return;
  const ac = audioCtx();
  if (!ac) return;
  let t = ac.currentTime;
  const [wave, vol] = TONES[name] || ['square', 0.05];
  for (const [freq, dur] of SOUNDS[name]) {
    const osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur);
    t += dur;
  }
}

// 0.2초짜리 흰 소음. 짖는 첫머리의 거친 숨에 쓴다. 오디오 장치마다 한 번 만든다.
const noises = new WeakMap();
function noiseOf(ac) {
  if (!noises.has(ac)) {
    const buf = ac.createBuffer(1, Math.round(ac.sampleRate * 0.2), ac.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noises.set(ac, buf);
  }
  return noises.get(ac);
}

// 값을 처음 → 가운데(길이의 30%) → 끝으로 미끄러뜨린다. 숫자 하나면 그 값 그대로다.
function slide(param, value, t, dur) {
  const [from, mid, to] = Array.isArray(value) ? value : [value, value, value];
  param.setValueAtTime(from, t);
  param.exponentialRampToValueAtTime(mid, t + dur * 0.3);
  param.exponentialRampToValueAtTime(to, t + dur);
}

// 한 번 운다(t부터 v.dur초 동안).
function cry(ac, v, t) {
  const end = t + v.dur, out = ac.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.linearRampToValueAtTime(v.vol, t + v.attack);
  out.gain.setValueAtTime(v.vol, t + v.dur * 0.5);
  out.gain.exponentialRampToValueAtTime(0.0001, end);
  out.connect(ac.destination);
  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  slide(osc.frequency, v.f, t, v.dur);
  for (const [freq, amp] of v.mouth) {
    const band = ac.createBiquadFilter(), part = ac.createGain();
    band.type = 'bandpass';
    band.Q.value = 5;
    slide(band.frequency, freq, t, v.dur);
    part.gain.value = amp;
    osc.connect(band).connect(part).connect(out);
  }
  osc.start(t);
  osc.stop(end);
  if (!v.rough) return;
  const src = ac.createBufferSource(), band = ac.createBiquadFilter(), part = ac.createGain();
  src.buffer = noiseOf(ac);
  band.type = 'bandpass';
  band.frequency.value = v.mouth[1][0];
  band.Q.value = 1.5;
  part.gain.setValueAtTime(v.rough, t);
  part.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.06, v.dur));
  src.connect(band).connect(part).connect(out);
  src.start(t);
  src.stop(end);
}

// 동물 친구가 운다. excited면 한 번 더 운다(좋아하는 간식을 먹었을 때).
export function voice(species, excited = false) {
  if (!G.state.sound) return;
  const ac = audioCtx(), v = VOICES[species];
  if (!ac || !v) return;
  let t = ac.currentTime;
  for (let i = 0; i < v.times + (excited ? 1 : 0); i++) {
    cry(ac, v, t);
    t += v.dur + v.gap;
  }
}
