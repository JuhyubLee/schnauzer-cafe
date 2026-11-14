// 아이콘과 시작 화면 그림을 스프라이트에서 만든다: npm run icons
// - assets/icon-*.png      웹(홈 화면에 추가) 아이콘
// - resources/*.png        앱 아이콘·시작 화면의 원본. 이어서 아래 명령으로 기기별 크기를 만든다.
//     npx @capacitor/assets generate --assetPath resources --android --ios
import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { rasterize } from '../src/sprites.js';

const ORANGE = [0xff, 0xb3, 0x5c, 255];

// 한 변이 size인 RGBA 그림. bg가 없으면 투명.
function canvas(size, bg) {
  const px = Buffer.alloc(size * size * 4);
  if (bg) for (let i = 0; i < size * size; i++) px.set(bg, i * 4);
  return { size, px };
}

// 스프라이트를 scale배로 키워 가운데에 찍는다.
function stamp({ size, px }, name, scale) {
  const s = rasterize(name);
  const ox = Math.floor((size - s.w * scale) / 2), oy = Math.floor((size - s.h * scale) / 2);
  for (let y = 0; y < s.h * scale; y++) {
    for (let x = 0; x < s.w * scale; x++) {
      const i = (Math.floor(y / scale) * s.w + Math.floor(x / scale)) * 4;
      if (s.data[i + 3]) px.set(s.data.subarray(i, i + 4), ((oy + y) * size + ox + x) * 4);
    }
  }
}

function png({ size, px }) {
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc32(body), body.length + 4);
    return out;
  };
  const head = Buffer.alloc(13);
  head.writeUInt32BE(size, 0);
  head.writeUInt32BE(size, 4);
  head.set([8, 6, 0, 0, 0], 8); // 8비트 RGBA
  const row = size * 4 + 1;
  const raw = Buffer.alloc(row * size);
  for (let y = 0; y < size; y++) px.copy(raw, y * row + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', head), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

function save(path, size, bg, scale) {
  const c = canvas(size, bg);
  if (scale) stamp(c, 'dog_face', scale);
  writeFileSync(new URL(`../${path}`, import.meta.url), png(c));
  console.log(path);
}

// 웹 아이콘
for (const [size, scale] of [[180, 9], [192, 9], [512, 24]]) save(`assets/icon-${size}.png`, size, ORANGE, scale);

// 앱 아이콘과 시작 화면 원본
mkdirSync(new URL('../resources/', import.meta.url), { recursive: true });
save('resources/icon-only.png', 1024, ORANGE, 44);
save('resources/icon-foreground.png', 1024, null, 32); // 안드로이드 적응형 아이콘: 가운데 2/3 안에 들어가게
save('resources/icon-background.png', 1024, ORANGE, 0);
save('resources/splash.png', 2732, ORANGE, 30);
save('resources/splash-dark.png', 2732, ORANGE, 30);
