// 창밖 풍경과 가게 안 밝기. 기기 시계의 시각과 달(계절)에 따라 바뀐다. 화면(DOM)은 모르고 캔버스에 그리기만 한다.

const SEASON_OF_MONTH = [
  'winter', 'winter', 'spring', 'spring', 'spring', 'summer',
  'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter',
];
// 계절별 [해 뜨는 시각, 해 지는 시각]
const SUN_HOURS = { spring: [6, 18.5], summer: [5.5, 19.5], autumn: [6.5, 18], winter: [7.5, 17.5] };
const TWILIGHT = 0.75; // 해 뜨고 지는 앞뒤로 밝기가 바뀌는 시간(시간 단위)

const clamp01 = v => Math.max(0, Math.min(1, v));
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const css = c => `rgb(${c[0]},${c[1]},${c[2]})`;

// season: 계절, dark: 0(낮)~1(밤), glow: 노을·새벽빛 0~1, dawn: 오전인지,
// sunT·moonT: 해·달이 하늘을 지나온 정도 0~1 (떠 있지 않으면 null)
export function skyAt(date) {
  const season = SEASON_OF_MONTH[date.getMonth()];
  const h = date.getHours() + date.getMinutes() / 60;
  const [rise, set] = SUN_HOURS[season];
  const day = h >= rise && h <= set;
  return {
    season,
    dark: h < 12 ? 1 - clamp01((h - rise + TWILIGHT) / (TWILIGHT * 2)) : clamp01((h - set + TWILIGHT) / (TWILIGHT * 2)),
    glow: Math.max(0, 1 - Math.abs(h - rise), 1 - Math.abs(h - set)),
    dawn: h < 12,
    sunT: day ? (h - rise) / (set - rise) : null,
    moonT: day ? null : ((h - set + 24) % 24) / (24 - (set - rise)),
  };
}

const SKY = {
  dayTop: rgb('#7fbdee'), dayLow: rgb('#c4e6f8'),
  nightTop: rgb('#141a36'), nightLow: rgb('#2a3766'),
  duskTop: rgb('#e9795c'), duskLow: rgb('#ffcf8f'),
  dawnTop: rgb('#f2a7a6'), dawnLow: rgb('#ffe4b8'),
};
const WHITE = [255, 255, 255];

// 하늘 위쪽 색과 지평선 쪽 색
export function skyColors(sky) {
  const glowTop = sky.dawn ? SKY.dawnTop : SKY.duskTop, glowLow = sky.dawn ? SKY.dawnLow : SKY.duskLow;
  return {
    top: mix(mix(SKY.dayTop, SKY.nightTop, sky.dark), glowTop, sky.glow * 0.8),
    low: mix(mix(SKY.dayLow, SKY.nightLow, sky.dark), glowLow, sky.glow),
  };
}
export const skyCSS = (sky, t = 0.5) => { const c = skyColors(sky); return css(mix(c.top, c.low, t)); };

export const VIEW_W = 24;
export const VIEW_H = 15;
const STARS = [[3, 3, 0], [8, 5, 2.1], [13, 3, 4.2], [17, 6, 1.3], [21, 4, 3.4], [6, 8, 5.2], [19, 9, 0.7]];
const GROUND = { spring: rgb('#9ccf86'), summer: rgb('#5fae56'), autumn: rgb('#d2a35c'), winter: rgb('#f1f5fa') };
// 나무 잎 [기본, 밝은 쪽]. 겨울은 잎이 없다.
const CROWN = {
  spring: [rgb('#f7a8c0'), rgb('#fbd0dc')],
  summer: [rgb('#4f9a4a'), rgb('#7cc46c')],
  autumn: [rgb('#d9622b'), rgb('#f2a23a')],
};
const TRUNK = rgb('#6b4329');
// 떨어지는 것: 꽃잎, 낙엽, 눈 [색, 떨어지는 빠르기(픽셀/초)]
const FALLING = { spring: [rgb('#fbd0dc'), 2.4], autumn: [rgb('#e8852f'), 3], winter: [WHITE, 2] };

// 창밖 풍경을 (x, y)에서 VIEW_W×VIEW_H 크기로 그린다. time은 흘러간 시간(초)이고 움직임에만 쓴다.
export function drawView(g, x, y, sky, time) {
  const { top, low } = skyColors(sky);
  const shade = c => css(mix(c, SKY.nightTop, sky.dark * 0.65)); // 밤에는 바깥 것들이 어두워진다
  const dot = (dx, dy, w = 1, h = 1) => g.fillRect(x + dx, y + dy, w, h);

  g.save();
  g.beginPath();
  g.rect(x, y, VIEW_W, VIEW_H);
  g.clip();

  g.fillStyle = css(top); dot(0, 0, VIEW_W, 6);
  g.fillStyle = css(mix(top, low, 0.5)); dot(0, 6, VIEW_W, 3);
  g.fillStyle = css(low); dot(0, 9, VIEW_W, 6);

  if (sky.dark > 0.3) {
    g.fillStyle = '#fff7d6';
    for (const [sx, sy, phase] of STARS) {
      g.globalAlpha = sky.dark * (0.6 + 0.4 * Math.sin(time * 1.5 + phase));
      dot(sx, sy);
    }
    g.globalAlpha = 1;
  }

  // 해와 달은 왼쪽에서 떠서 오른쪽으로 진다.
  const arc = t => [Math.round(2 + t * 18), Math.round(10 - Math.sin(t * Math.PI) * 8)];
  if (sky.sunT != null) {
    const [sx, sy] = arc(sky.sunT);
    g.fillStyle = '#ffd34d'; dot(sx, sy - 1, 3, 5); dot(sx - 1, sy, 5, 3);
    g.fillStyle = '#fff3b0'; dot(sx, sy, 3, 3);
  } else {
    const [mx, my] = arc(sky.moonT);
    g.fillStyle = '#fff2c2'; dot(mx, my, 3, 3);
    g.fillStyle = css(top); dot(mx + 1, my, 2, 2); // 초승달 모양으로 파낸다
  }

  if (sky.dark < 0.8) {
    g.fillStyle = css(mix(WHITE, low, sky.glow * 0.6));
    g.globalAlpha = 1 - sky.dark;
    for (const [offset, cy] of [[0, 4], [17, 7]]) {
      const cx = Math.floor((time * 0.5 + offset) % (VIEW_W + 10)) - 8;
      dot(cx, cy, 6, 2); dot(cx + 1, cy - 1, 3, 1);
    }
    g.globalAlpha = 1;
  }

  // 언덕과 나무
  g.fillStyle = shade(GROUND[sky.season]);
  dot(0, 12, VIEW_W, 3); dot(12, 11, 10, 1); dot(14, 10, 6, 1);
  g.fillStyle = shade(TRUNK);
  const crown = CROWN[sky.season];
  if (crown) {
    dot(6, 9, 1, 3);
    g.fillStyle = shade(crown[0]); dot(5, 4, 3, 1); dot(4, 5, 5, 3); dot(5, 8, 3, 1);
    g.fillStyle = shade(crown[1]); dot(5, 5); dot(7, 6); dot(4, 6);
  } else {
    dot(6, 5, 1, 7); dot(5, 7); dot(4, 6); dot(7, 8); dot(8, 7); dot(7, 5);
    g.fillStyle = shade(WHITE); dot(4, 5); dot(8, 6); dot(6, 4); dot(7, 4);
  }

  const falling = FALLING[sky.season];
  if (falling) {
    g.fillStyle = shade(falling[0]);
    for (let i = 0; i < 6; i++) {
      const fx = (i * 4.3 + Math.sin(time * 0.8 + i * 1.7) * 1.5 + VIEW_W) % VIEW_W;
      dot(Math.floor(fx), Math.floor((time * falling[1] + i * 5.3) % VIEW_H));
    }
  } else if (sky.dark > 0.5) {
    // 여름밤 반딧불이
    g.fillStyle = '#f2ff8a';
    for (let i = 0; i < 3; i++) {
      g.globalAlpha = sky.dark * clamp01(Math.sin(time * 1.2 + i * 2.1));
      dot(10 + i * 4 + Math.round(Math.sin(time * 0.5 + i) * 1.5), 9 + (i % 2) * 2);
    }
    g.globalAlpha = 1;
  }

  g.restore();
}
