// 배경 음악. 소리 파일 없이 Web Audio로 연주하는 3박자 오르골 곡이다.
// 곡은 이 게임을 위해 새로 지은 것이라 저작권 걱정 없이 쓸 수 있다.
import { G } from './game.js';
import { audioCtx } from './sfx.js';

const BPM = 84;
const BEAT = 60 / BPM;
const BAR = 3; // 한 마디 3박

// 화음마다 왼손이 굴리는 세 음 (낮은 음, 가운데, 높은 음)
const CHORDS = {
  C: ['C3', 'G3', 'E4'], 'G/B': ['B2', 'G3', 'D4'], Am: ['A2', 'E3', 'C4'], F: ['F2', 'C3', 'A3'],
  'C/E': ['E3', 'G3', 'C4'], Dm: ['D3', 'A3', 'F4'], G: ['G2', 'D3', 'B3'], Em: ['E3', 'B3', 'G4'],
};
const ARP = [0, 1, 2, 1, 2, 1]; // 한 마디를 8분음표 여섯 개로

// 한 마디 = [화음, 멜로디]. 멜로디는 '음:박'을 이어 쓰고, '-'는 쉼표.
const A1 = [
  ['C', 'E5:2 G5:1'], ['G/B', 'D5:3'], ['Am', 'C5:2 E5:1'], ['F', 'A4:3'],
  ['C/E', 'G4:2 C5:1'], ['Dm', 'F5:2 E5:1'], ['G', 'D5:3'], ['C', 'C5:3'],
];
const A2 = [
  ['C', 'E5:1 G5:1 A5:1'], ['G/B', 'G5:2 D5:1'], ['Am', 'C5:1 E5:1 A5:1'], ['F', 'A5:2 F5:1'],
  ['C/E', 'G5:2 E5:1'], ['Dm', 'F5:1 A5:1 F5:1'], ['G', 'G5:2 B4:1'], ['C', 'C5:3'],
];
const B = [
  ['F', 'A5:1 C6:1 A5:1'], ['G', 'G5:2 D5:1'], ['Em', 'G5:1 E5:1 B4:1'], ['Am', 'E5:2 C5:1'],
  ['Dm', 'F5:1 D5:1 F5:1'], ['G', 'E5:1 D5:1 B4:1'], ['C', 'C5:3'], ['C', '-:3'],
];
const SONG = [...A1, ...A2, ...B, ...A2];

const SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const freq = note => 440 * 2 ** ((SEMITONE[note[0]] + 12 * (Number(note.slice(1)) + 1) - 69) / 12);

// 곡을 [{beat, freq, vol, ring}]으로 펼친다. ring은 음이 울리다 사라지는 시간(초).
const EVENTS = [];
SONG.forEach(([chord, melody], bar) => {
  const start = bar * BAR;
  ARP.forEach((tone, i) => EVENTS.push({ beat: start + i / 2, freq: freq(CHORDS[chord][tone]), vol: i ? 0.3 : 0.45, ring: 1.2 }));
  let at = start;
  for (const part of melody.split(' ')) {
    const [note, beats] = part.split(':');
    if (note !== '-') EVENTS.push({ beat: at, freq: freq(note), vol: 0.8, ring: Math.max(1.5, beats * BEAT * 1.4) });
    at += Number(beats);
  }
});
EVENTS.sort((a, b) => a.beat - b.beat);
export const LOOP_SECONDS = SONG.length * BAR * BEAT;

// 오르골 같은 음 하나: 기본음에 배음을 조금 섞고, 톡 치고 길게 사라지게 한다.
function pluck(ctx, out, { freq, vol, ring }, t) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + ring);
  gain.connect(out);
  for (const [mult, amp] of [[1, 1], [2, 0.28], [4, 0.08]]) {
    const osc = ctx.createOscillator(), part = ctx.createGain();
    osc.frequency.value = freq * mult;
    part.gain.value = amp;
    osc.connect(part).connect(gain);
    osc.start(t);
    osc.stop(t + ring + 0.05);
  }
}

// ctx에 곡을 이어 붙여 주는 연주기. fill(until)을 부를 때마다 그 시각까지의 음을 예약한다.
export function createPlayer(ctx, startAt = ctx.currentTime + 0.1) {
  const master = ctx.createGain();
  master.gain.value = 0.16;
  master.connect(ctx.destination);
  // 은은한 메아리
  const delay = ctx.createDelay(1), feedback = ctx.createGain(), wet = ctx.createGain();
  delay.delayTime.value = BEAT / 2;
  feedback.gain.value = 0.28;
  wet.gain.value = 0.3;
  master.connect(delay);
  delay.connect(feedback).connect(delay);
  delay.connect(wet).connect(ctx.destination);

  let index = 0, loopStart = startAt;
  return {
    fill(until) {
      while (loopStart + EVENTS[index].beat * BEAT < until) {
        pluck(ctx, master, EVENTS[index], loopStart + EVENTS[index].beat * BEAT);
        if (++index === EVENTS.length) { index = 0; loopStart += LOOP_SECONDS; }
      }
    },
    stop() {
      try {
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
        wet.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
      } catch { /* 이미 닫힌 장치 */ }
      setTimeout(() => { master.disconnect(); wet.disconnect(); }, 600);
    },
  };
}

let player = null, playerCtx = null, timer = 0;

function stopPlayer() {
  clearInterval(timer);
  player.stop();
  player = null;
}

// 설정과 화면 상태에 맞춰 음악을 켜거나 끈다. 켜는 건 화면을 한 번 누른 뒤에만 된다.
export function syncMusic() {
  const want = G.state.started && G.state.music && !document.hidden;
  const ctx = want ? audioCtx() : null; // 잠들어 있던 장치도 여기서 깨운다
  if (want && !ctx) return;
  if (player && (!want || playerCtx !== ctx)) stopPlayer(); // 장치가 새로 만들어졌으면 연주기도 새로 만든다
  if (want && !player) {
    player = createPlayer(ctx);
    playerCtx = ctx;
    const pump = () => player.fill(ctx.currentTime + 0.6);
    pump();
    timer = setInterval(pump, 200);
  }
}
