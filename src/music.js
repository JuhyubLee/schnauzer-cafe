// 배경 음악. 소리 파일 없이 Web Audio로 연주한다.
// 오르골 왈츠와 사계절 곡은 이 게임을 위해 새로 지은 것이다. 크리스마스 곡 둘은 저작권이 끝난 옛 캐럴
// (Jingle Bells, 1857년 James Lord Pierpont 작곡 / We Wish You a Merry Christmas, 영국 전래 캐럴)의
// 가락을 직접 편곡한 것이다. 남의 녹음이나 편곡은 쓰지 않았다.
import { G } from './game.js';
import { SEASONS, SONG_CHOICES } from './data.js';
import { audioCtx } from './sfx.js';

// 화음마다 왼손이 굴리는 세 음 (낮은 음, 가운데, 높은 음)
const CHORDS = {
  C: ['C3', 'G3', 'E4'], 'C/E': ['E3', 'G3', 'C4'], Dm: ['D3', 'A3', 'F4'], Em: ['E3', 'B3', 'G4'],
  F: ['F2', 'C3', 'A3'], Fm: ['F2', 'C3', 'Ab3'], G: ['G2', 'D3', 'B3'], 'G/B': ['B2', 'G3', 'D4'],
  Am: ['A2', 'E3', 'C4'], Bm: ['B2', 'F#3', 'D4'],
  D: ['D3', 'A3', 'F#4'], 'D/F#': ['F#2', 'D3', 'A3'], E: ['E2', 'B2', 'G#3'], A: ['A2', 'E3', 'C#4'], B: ['B2', 'F#3', 'D#4'],
};

// 악기 소리. partials: [배음 배수, 크기], attack: 톡 치는 데 걸리는 시간(초), ring: 울림 길이 배수,
// echo: 메아리 크기, wave: 파형, sparkle: 가락을 한 옥타브 위에서 작게 겹치는 크기,
// level: 소리 크기 배수(짧게 끊기는 악기는 작게 들려서 키운다)
const VOICES = {
  box: { partials: [[1, 1], [2, 0.28], [4, 0.08]], attack: 0.012, ring: 1, echo: 0.3 }, // 오르골
  bell: { partials: [[1, 1], [2, 0.4], [3, 0.12]], attack: 0.008, ring: 0.9, echo: 0.25 }, // 맑은 종
  marimba: { partials: [[1, 1], [4, 0.22]], attack: 0.005, ring: 0.45, echo: 0.15, wave: 'triangle', level: 1.6 }, // 마림바
  felt: { partials: [[1, 1], [2, 0.15]], attack: 0.025, ring: 1.35, echo: 0.35 }, // 부드러운 건반
  celesta: { partials: [[1, 1], [3, 0.12], [5, 0.05]], attack: 0.01, ring: 1.2, echo: 0.4, sparkle: 0.22 }, // 첼레스타
};

// 한 마디 = [화음, 가락]. 가락은 '음:박'을 이어 쓰고 '-'는 쉼표. 한 마디의 박을 더하면 그 곡의 bar가 되어야 한다.
// arp: 왼손이 8분음표마다 치는 화음 음(0 낮은 음, 1 가운데, 2 높은 음, null 쉼). bells: 박마다 썰매 방울

// 오르골 왈츠 (처음부터 있던 곡)
const WALTZ_A1 = [
  ['C', 'E5:2 G5:1'], ['G/B', 'D5:3'], ['Am', 'C5:2 E5:1'], ['F', 'A4:3'],
  ['C/E', 'G4:2 C5:1'], ['Dm', 'F5:2 E5:1'], ['G', 'D5:3'], ['C', 'C5:3'],
];
const WALTZ_A2 = [
  ['C', 'E5:1 G5:1 A5:1'], ['G/B', 'G5:2 D5:1'], ['Am', 'C5:1 E5:1 A5:1'], ['F', 'A5:2 F5:1'],
  ['C/E', 'G5:2 E5:1'], ['Dm', 'F5:1 A5:1 F5:1'], ['G', 'G5:2 B4:1'], ['C', 'C5:3'],
];
const WALTZ_B = [
  ['F', 'A5:1 C6:1 A5:1'], ['G', 'G5:2 D5:1'], ['Em', 'G5:1 E5:1 B4:1'], ['Am', 'E5:2 C5:1'],
  ['Dm', 'F5:1 D5:1 F5:1'], ['G', 'E5:1 D5:1 B4:1'], ['C', 'C5:3'], ['C', '-:3'],
];

// 봄: 사장조, 통통 튀는 맑은 종
const SPRING_HEAD = [
  ['G', 'D5:1 G5:1 B5:1 A5:0.5 G5:0.5'], ['D/F#', 'A5:1.5 F#5:0.5 D5:2'],
  ['Em', 'E5:1 G5:1 B5:1 A5:0.5 G5:0.5'], ['C', 'E5:3 -:1'],
];
const SPRING_A1 = [
  ...SPRING_HEAD,
  ['Am', 'C5:1 E5:1 A5:1 G5:0.5 E5:0.5'], ['D', 'F#5:1.5 E5:0.5 D5:2'], ['C', 'E5:1 D5:1 C5:1 B4:1'], ['D', 'A4:2 D5:2'],
];
const SPRING_A2 = [
  ...SPRING_HEAD,
  ['Am', 'C5:1 E5:1 A5:1 B5:1'], ['C', 'G5:1.5 E5:0.5 C5:1 E5:1'], ['D', 'A5:1 G5:1 F#5:1 A5:1'], ['G', 'G5:3 -:1'],
];
const SPRING_B = [
  ['C', 'E5:1 G5:1 C6:1 B5:0.5 A5:0.5'], ['G', 'B5:1.5 G5:0.5 D5:2'],
  ['Am', 'C5:1 E5:1 A5:1 G5:0.5 F#5:0.5'], ['Em', 'G5:1.5 E5:0.5 B4:2'],
  ['C', 'E5:1 G5:1 C6:1 B5:0.5 A5:0.5'], ['Bm', 'B5:1 F#5:1 D5:1 F#5:1'],
  ['Am', 'E5:1 C5:1 A4:1 C5:1'], ['D', 'D5:2 F#5:1 A5:1'],
];

// 여름: 다장조, 엇박으로 넘실대는 마림바
const SUMMER_HEAD = [
  ['C', 'E5:1.5 G5:0.5 -:0.5 C6:1 A5:0.5'], ['Am', 'G5:1.5 E5:0.5 -:0.5 C5:1.5'],
  ['F', 'A5:1.5 C6:0.5 -:0.5 A5:1 F5:0.5'], ['G', 'G5:1.5 D5:0.5 -:0.5 B4:1.5'],
  ['C', 'E5:1.5 G5:0.5 -:0.5 C6:1 D6:0.5'], ['Am', 'E6:1.5 C6:0.5 -:0.5 A5:1.5'],
];
const SUMMER_A1 = [...SUMMER_HEAD, ['Dm', 'F5:1 A5:1 D6:1 C6:0.5 A5:0.5'], ['G', 'B5:1 G5:1 D5:2']];
const SUMMER_A2 = [...SUMMER_HEAD, ['G', 'G5:1 A5:1 B5:1 D6:1'], ['C', 'C6:3 -:1']];
const SUMMER_B = [
  ['F', 'C6:1 A5:0.5 F5:1.5 A5:1'], ['C', 'G5:1 E5:0.5 C5:1.5 E5:1'],
  ['F', 'A5:1 F5:0.5 C6:1.5 A5:1'], ['G', 'B5:1 D6:0.5 G5:1.5 -:1'],
  ['Am', 'C6:1 E6:0.5 C6:1.5 A5:1'], ['F', 'A5:1 C6:0.5 A5:1.5 F5:1'],
  ['Dm', 'D5:1 F5:1 A5:1 D6:1'], ['G', 'B5:2 G5:1 D5:1'],
];

// 가을: 가단조, 느리고 쓸쓸한 왈츠
const AUTUMN_A1 = [
  ['Am', 'E5:2 A5:1'], ['F', 'A5:1 G5:1 F5:1'], ['C', 'E5:2 G5:1'], ['G', 'D5:3'],
  ['Am', 'C5:1 E5:1 A5:1'], ['F', 'C6:2 A5:1'], ['E', 'B5:2 G#5:1'], ['Am', 'A5:3'],
];
const AUTUMN_A2 = [
  ['Am', 'E5:1 A5:1 C6:1'], ['F', 'C6:1 B5:1 A5:1'], ['C', 'G5:2 E5:1'], ['G', 'D5:2 B4:1'],
  ['Dm', 'F5:1 A5:1 D6:1'], ['Am', 'C6:2 A5:1'], ['E', 'B5:1 G#5:1 E5:1'], ['Am', 'A5:3'],
];
const AUTUMN_B = [
  ['C', 'G5:1 E5:1 G5:1'], ['G/B', 'D6:2 B5:1'], ['Am', 'C6:1 A5:1 E5:1'], ['Em', 'G5:2 E5:1'],
  ['F', 'A5:1 F5:1 A5:1'], ['C/E', 'G5:2 C6:1'], ['Dm', 'D6:1 A5:1 F5:1'], ['E', 'E5:2 G#5:1'],
];

// 겨울: 다장조, 눈 오는 밤처럼 느리고 반짝이는 첼레스타
const WINTER_A1 = [
  ['C', 'E5:2 G5:2'], ['Em', 'B5:3 G5:1'], ['F', 'A5:2 C6:2'], ['C', 'G5:4'],
  ['Am', 'E5:2 A5:2'], ['Em', 'G5:3 E5:1'], ['F', 'F5:2 A5:2'], ['G', 'D5:4'],
];
const WINTER_A2 = [
  ['C', 'E5:2 G5:2'], ['Em', 'B5:3 D6:1'], ['F', 'C6:2 A5:2'], ['C', 'G5:3 E5:1'],
  ['Am', 'A5:2 C6:2'], ['F', 'A5:3 F5:1'], ['Fm', 'Ab5:2 F5:2'], ['C', 'E5:4'],
];
const WINTER_B = [
  ['F', 'C6:1 A5:1 F5:2'], ['G', 'D6:1 B5:1 G5:2'], ['Em', 'B5:1 G5:1 E5:2'], ['Am', 'C6:1 A5:1 E5:2'],
  ['Dm', 'D5:1 F5:1 A5:2'], ['G', 'B5:1 A5:1 G5:2'], ['C', 'E5:1 G5:1 C6:2'], ['G', 'D6:2 B5:2'],
];

// 크리스마스 1: Jingle Bells (후렴, 1절, 후렴)
const JINGLE_HEAD = [
  ['C', 'E5:1 E5:1 E5:2'], ['C', 'E5:1 E5:1 E5:2'], ['C', 'E5:1 G5:1 C5:1.5 D5:0.5'], ['C', 'E5:4'],
  ['F', 'F5:1 F5:1 F5:1.5 F5:0.5'], ['C', 'F5:1 E5:1 E5:1 E5:0.5 E5:0.5'],
];
const JINGLE_CHORUS = [
  ...JINGLE_HEAD, ['D', 'E5:1 D5:1 D5:1 E5:1'], ['G', 'D5:2 G5:2'],
  ...JINGLE_HEAD, ['G', 'G5:1 G5:1 F5:1 D5:1'], ['C', 'C5:4'],
];
const JINGLE_VERSE = [
  ['C', 'G4:1 E5:1 D5:1 C5:1'], ['C', 'G4:3 G4:0.5 G4:0.5'], ['C', 'G4:1 E5:1 D5:1 C5:1'], ['F', 'A4:4'],
  ['F', 'A4:1 F5:1 E5:1 D5:1'], ['G', 'B4:4'], ['G', 'G5:1 G5:1 F5:1 D5:1'], ['C', 'E5:4'],
  ['C', 'G4:1 E5:1 D5:1 C5:1'], ['C', 'G4:4'], ['C', 'G4:1 E5:1 D5:1 C5:1'], ['F', 'A4:3 A4:1'],
  ['F', 'A4:1 F5:1 E5:1 D5:1'], ['G', 'G5:1 G5:1 G5:1 G5:1'], ['G', 'A5:1 G5:1 F5:1 D5:1'], ['C', 'C5:2 G5:2'],
];

// 크리스마스 2: We Wish You a Merry Christmas (못갖춘마디로 시작한다)
const WISH_VERSE = [
  ['G', 'G5:1 G5:0.5 A5:0.5 G5:0.5 F#5:0.5'], ['C', 'E5:1 E5:1 E5:1'],
  ['A', 'A5:1 A5:0.5 B5:0.5 A5:0.5 G5:0.5'], ['D', 'F#5:1 D5:1 D5:1'],
  ['B', 'B5:1 B5:0.5 C6:0.5 B5:0.5 A5:0.5'], ['Em', 'G5:1 E5:1 D5:0.5 D5:0.5'],
  ['D', 'E5:1 A5:1 F#5:1'], ['G', 'G5:2 D5:1'],
];
const WISH_CHORUS = [
  ['G', 'G5:1 G5:1 G5:1'], ['D', 'F#5:2 F#5:1'], ['A', 'G5:1 F#5:1 E5:1'], ['D', 'D5:2 A5:1'],
  ['G', 'B5:1 A5:1 G5:1'], ['Em', 'D6:1 D5:1 D5:0.5 D5:0.5'], ['D', 'E5:1 A5:1 F#5:1'],
];

const SONGS = {
  main: { bpm: 84, bar: 3, arp: [0, 1, 2, 1, 2, 1], voice: 'box', bars: [...WALTZ_A1, ...WALTZ_A2, ...WALTZ_B, ...WALTZ_A2] },
  spring: { bpm: 100, bar: 4, arp: [0, 2, 1, 2, 0, 2, 1, 2], voice: 'bell', bars: [...SPRING_A1, ...SPRING_A2, ...SPRING_B, ...SPRING_A2] },
  summer: { bpm: 116, bar: 4, arp: [0, null, 2, 0, null, 2, 1, 2], voice: 'marimba', bars: [...SUMMER_A1, ...SUMMER_A2, ...SUMMER_B, ...SUMMER_A2] },
  autumn: { bpm: 72, bar: 3, arp: [0, 1, 2, null, 1, null], voice: 'felt', bars: [...AUTUMN_A1, ...AUTUMN_A2, ...AUTUMN_B, ...AUTUMN_A2] },
  winter: { bpm: 72, bar: 4, arp: [0, 1, 2, null, 1, 2, null, null], voice: 'celesta', bars: [...WINTER_A1, ...WINTER_A2, ...WINTER_B, ...WINTER_A2] },
  jingle: { bpm: 116, bar: 4, arp: [0, 2, 1, 2, 0, 2, 1, 2], voice: 'box', bells: true, bars: [...JINGLE_CHORUS, ...JINGLE_VERSE, ...JINGLE_CHORUS] },
  wish: {
    bpm: 138, bar: 3, arp: [0, null, 1, 2, 1, null], voice: 'box', bells: true,
    bars: [
      ['G', '-:2 D5:1'], ...WISH_VERSE, ...WISH_CHORUS, ['G', 'G5:2 D5:1'],
      ...WISH_VERSE, ...WISH_CHORUS, ['G', 'G5:3'], ['G', '-:3'],
    ],
  },
};

const SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
// 'E5', 'F#5', 'Ab3' 같은 음 이름을 주파수로
function freq(note) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(note);
  if (!m) throw new Error(`음 이름을 읽을 수 없어요: ${note}`);
  const semi = SEMITONE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * 2 ** ((semi + 12 * (Number(m[3]) + 1) - 69) / 12);
}

// 곡을 연주할 순서대로 펼친다: { events: [{beat, freq, vol, ring} 또는 {beat, shake}], beat(한 박의 초), seconds, voice }
// ring은 음이 울리다 사라지는 시간(초), shake는 썰매 방울의 크기. 박자가 안 맞는 마디가 있으면 오류를 낸다.
const compiled = {};
export function compile(id) {
  if (compiled[id]) return compiled[id];
  const song = SONGS[id], beat = 60 / song.bpm, voice = VOICES[song.voice], events = [];
  song.bars.forEach(([chord, melody], bar) => {
    const start = bar * song.bar;
    song.arp.forEach((tone, i) => {
      if (tone != null) events.push({ beat: start + i / 2, freq: freq(CHORDS[chord][tone]), vol: i ? 0.3 : 0.45, ring: 1.2 * voice.ring });
    });
    let at = start;
    for (const part of melody.split(' ')) {
      const [note, beats] = part.split(':');
      if (note !== '-') {
        const ring = Math.max(1.5, beats * beat * 1.4) * voice.ring;
        events.push({ beat: at, freq: freq(note), vol: 0.8, ring });
        if (voice.sparkle) events.push({ beat: at, freq: freq(note) * 2, vol: voice.sparkle, ring: ring * 0.7 });
      }
      at += Number(beats);
    }
    if (Math.abs(at - start - song.bar) > 1e-9) throw new Error(`${id}의 ${bar + 1}번째 마디가 ${song.bar}박이 아니에요`);
    if (song.bells) for (let b = 0; b < song.bar; b++) events.push({ beat: start + b, shake: b ? 0.3 : 0.5 });
  });
  events.sort((a, b) => a.beat - b.beat);
  return (compiled[id] = { events, beat, seconds: song.bars.length * song.bar * beat, voice });
}
export const SONG_IDS = Object.keys(SONGS);

// 설정에서 고른 값(data.js의 SONG_CHOICES)과 날짜로, 이어서 들려줄 곡들을 정한다.
// '계절에 맞춰'는 지금 계절의 곡과 오르골 왈츠를 번갈아, 12월 1일~25일에는 캐럴과 겨울 곡을 들려준다.
export function playlist(choice, date = new Date()) {
  if (choice === 'xmas') return ['jingle', 'wish'];
  if (SONGS[choice]) return [choice];
  const month = date.getMonth() + 1;
  if (month === 12 && date.getDate() <= 25) return ['jingle', 'winter', 'wish'];
  return [['spring', 'summer', 'autumn', 'winter'].find(s => SEASONS[s].months.includes(month)), 'main'];
}

// 음 하나: 기본음에 배음을 조금 섞고, 톡 치고 길게 사라지게 한다.
function pluck(ctx, out, { freq: f, vol, ring }, voice, t) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol * (voice.level || 1), t + voice.attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + ring);
  gain.connect(out);
  for (const [mult, amp] of voice.partials) {
    const osc = ctx.createOscillator(), part = ctx.createGain();
    osc.type = voice.wave || 'sine';
    osc.frequency.value = f * mult;
    part.gain.value = amp;
    osc.connect(part).connect(gain);
    osc.start(t);
    osc.stop(t + ring + 0.05);
  }
}

// 썰매 방울: 높은 쪽만 남긴 잡음을 짧게 흔든다.
const noises = new WeakMap();
function shake(ctx, out, vol, t) {
  let noise = noises.get(ctx);
  if (!noise) {
    noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.2), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noises.set(ctx, noise);
  }
  const src = ctx.createBufferSource(), band = ctx.createBiquadFilter(), gain = ctx.createGain();
  src.buffer = noise;
  band.type = 'bandpass';
  band.frequency.value = 7500;
  band.Q.value = 4;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  src.connect(band).connect(gain).connect(out);
  src.start(t);
  src.stop(t + 0.15);
}

// ctx에 곡을 이어 붙여 주는 연주기. pick(n)은 n번째로 들려줄 곡의 이름을 돌려준다(곡이 끝날 때마다 다시 묻는다).
// fill(until)을 부를 때마다 그 시각까지의 음을 예약한다.
export function createPlayer(ctx, pick, startAt = ctx.currentTime + 0.1) {
  const master = ctx.createGain();
  master.gain.value = 0.16;
  master.connect(ctx.destination);
  // 은은한 메아리: 곡의 빠르기에 맞춰 반 박 뒤에 울린다
  const delay = ctx.createDelay(1), feedback = ctx.createGain(), wet = ctx.createGain();
  feedback.gain.value = 0.28;
  master.connect(delay);
  delay.connect(feedback).connect(delay);
  delay.connect(wet).connect(ctx.destination);

  let count = 0, index = 0, loopStart = startAt, song = null;
  function next() {
    song = compile(pick(count++));
    index = 0;
    delay.delayTime.setValueAtTime(song.beat / 2, loopStart);
    wet.gain.setValueAtTime(song.voice.echo, loopStart);
  }
  next();
  return {
    fill(until) {
      while (loopStart + song.events[index].beat * song.beat < until) {
        const ev = song.events[index], t = loopStart + ev.beat * song.beat;
        if (ev.shake) shake(ctx, master, ev.shake, t);
        else pluck(ctx, master, ev, song.voice, t);
        if (++index === song.events.length) { loopStart += song.seconds; next(); }
      }
    },
    stop() {
      try {
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
        wet.gain.cancelScheduledValues(ctx.currentTime);
        wet.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
      } catch { /* 이미 닫힌 장치 */ }
      setTimeout(() => { master.disconnect(); wet.disconnect(); }, 600);
    },
  };
}

let player = null, playerCtx = null, playerChoice = null, timer = 0;

function stopPlayer() {
  clearInterval(timer);
  player.stop();
  player = null;
}

// 설정과 화면 상태에 맞춰 음악을 켜거나 끈다. 켜는 건 화면을 한 번 누른 뒤에만 된다.
// 설정에서 노래를 바꾸면 그 곡의 처음부터 다시 들려준다.
export function syncMusic() {
  const want = G.state.started && G.state.music && !document.hidden;
  const choice = SONG_CHOICES[G.state.song] ? G.state.song : 'auto';
  const ctx = want ? audioCtx() : null; // 잠들어 있던 장치도 여기서 깨운다
  if (want && !ctx) return;
  // 장치가 새로 만들어졌거나 고른 노래가 바뀌었으면 연주기도 새로 만든다
  if (player && (!want || playerCtx !== ctx || playerChoice !== choice)) stopPlayer();
  if (want && !player) {
    player = createPlayer(ctx, n => { const list = playlist(choice); return list[n % list.length]; });
    playerCtx = ctx;
    playerChoice = choice;
    const pump = () => player.fill(ctx.currentTime + 0.6);
    pump();
    timer = setInterval(pump, 200);
  }
}
