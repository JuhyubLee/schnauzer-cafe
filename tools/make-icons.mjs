// 홈 화면 아이콘을 스프라이트에서 만든다: node tools/make-icons.mjs
import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { rasterize } from '../src/sprites.js';

const BG = [0xff, 0xb3, 0x5c];

function png(size, pixels) {
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
  head.set([8, 2, 0, 0, 0], 8); // 8비트 RGB
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) pixels.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', head), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

function icon(size, scale) {
  const s = rasterize('dog_face');
  const pixels = Buffer.alloc(size * size * 3);
  for (let i = 0; i < size * size; i++) pixels.set(BG, i * 3);
  const ox = Math.floor((size - s.w * scale) / 2), oy = Math.floor((size - s.h * scale) / 2);
  for (let y = 0; y < s.h * scale; y++) {
    for (let x = 0; x < s.w * scale; x++) {
      const i = (Math.floor(y / scale) * s.w + Math.floor(x / scale)) * 4;
      if (s.data[i + 3]) pixels.set(s.data.subarray(i, i + 3), ((oy + y) * size + ox + x) * 3);
    }
  }
  return png(size, pixels);
}

for (const [size, scale] of [[180, 9], [192, 9], [512, 24]]) {
  writeFileSync(new URL(`../assets/icon-${size}.png`, import.meta.url), icon(size, scale));
  console.log(`assets/icon-${size}.png`);
}
