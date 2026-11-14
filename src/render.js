// 캔버스 그리기. 논리 해상도(1칸 = 16px)로 그리고, 확대는 CSS가 한다.
import { G, MAX_COLS, cookState, patienceLeft, recipeOf, petById } from './game.js';
import { FURN, FLOORS, WALLS, PETS, PHOTO_W, PHOTO_H, START_DOOR } from './data.js';
import { skyAt, skyCSS, drawView } from './sky.js';

export const TILE = 16;
export const PAD = 4; // 좌우·아래 벽 두께
export const WALL_H = 40;
export const viewW = cols => cols * TILE + PAD * 2;
export const viewH = rows => WALL_H + rows * TILE + PAD;
export const tileAt = (px, py) => ({ x: Math.floor((px - PAD) / TILE), y: Math.floor((py - WALL_H) / TILE) });
// 벽에 걸린 것들의 자리(처음 가게 기준). 가게를 왼쪽으로 넓히면 문과 함께 그만큼 오른쪽으로 밀린다.
const WINDOW_X = PAD + 4, WINDOW_Y = 6, PET_FRAME_X = PAD + 38;
const wallShift = s => (s.door - START_DOOR) * TILE;
// 큰 액자는 누르면 사진을 고를 수 있어서 자리를 밖에서도 쓴다.
export const photoRect = s => ({ x: PAD + 62 + wallShift(s), y: 4, w: 28, h: 24 });
const GLOW_R = 22; // 밤에 조명이 밝히는 둘레의 반지름

const INK = '#3b2b2b';
const HAT_ROOM = 3; // 모자가 동물 그림 위로 올라가는 줄 수
const DIGITS = {
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111',
  4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001010010',
  8: '111101111101111', 9: '111101111001111', '+': '000010111010000', x: '000101010101000',
};

function makeCanvas(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  paint(c.getContext('2d'));
  return c;
}

const FLOOR_PAINT = {
  wood(g) {
    g.fillStyle = '#d9a56c'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#e4b47e'; for (const y of [0, 4, 8, 12]) g.fillRect(0, y, 16, 1);
    g.fillStyle = '#b98450'; for (const y of [3, 7, 11, 15]) g.fillRect(0, y, 16, 1);
    for (const [x, y] of [[5, 0], [12, 4], [2, 8], [9, 12]]) g.fillRect(x, y, 1, 3);
  },
  tile(g) {
    g.fillStyle = '#fbe9cf'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#e3c59a'; g.fillRect(15, 0, 1, 16); g.fillRect(0, 15, 16, 1);
    g.fillStyle = '#fffaf0'; g.fillRect(0, 0, 15, 1); g.fillRect(0, 0, 1, 15);
  },
  check(g) {
    g.fillStyle = '#fff0d6'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#ffb35c'; g.fillRect(0, 0, 8, 8); g.fillRect(8, 8, 8, 8);
    g.fillStyle = '#f59a3a'; g.fillRect(0, 7, 8, 1); g.fillRect(8, 15, 8, 1);
  },
  mint(g) {
    g.fillStyle = '#b7e6da'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#7fc4b3'; g.fillRect(15, 0, 1, 16); g.fillRect(0, 15, 16, 1);
    g.fillStyle = '#e9fbf5'; g.fillRect(7, 6, 2, 4); g.fillRect(6, 7, 4, 2);
  },
};

const WALL_PAINT = {
  cream(g, w, h) {
    g.fillStyle = '#fbe9cf'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f3d6ae'; for (let x = 3; x < w; x += 8) g.fillRect(x, 0, 1, h);
  },
  orange(g, w, h) {
    g.fillStyle = '#ffd9a0'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffb35c'; for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 4, h);
  },
  brick(g, w, h) {
    g.fillStyle = '#c9553c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f0d2b0';
    for (let y = 5, row = 0; y < h; y += 6, row++) {
      g.fillRect(0, y, w, 1);
      for (let x = row % 2 ? 6 : 0; x < w; x += 12) g.fillRect(x, y - 5, 1, 5);
    }
  },
  mint(g, w, h) {
    g.fillStyle = '#b7e6da'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e9fbf5';
    for (let y = 3, row = 0; y < h; y += 6, row++) for (let x = row % 2 ? 6 : 2; x < w; x += 8) g.fillRect(x, y, 2, 2);
  },
  gingham(g, w, h) {
    g.fillStyle = '#fff1ee'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f9cdc8';
    for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 4, h);
    for (let y = 0; y < h; y += 8) g.fillRect(0, y, w, 4);
    g.fillStyle = '#f2a09c';
    for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) g.fillRect(x, y, 4, 4);
  },
  tile(g, w, h) {
    g.fillStyle = '#f8fafc'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#cfd6de';
    for (let y = 5, row = 0; y < h; y += 6, row++) {
      g.fillRect(0, y, w, 1);
      for (let x = row % 2 ? 5 : 0; x < w; x += 10) g.fillRect(x, y - 5, 1, 5);
    }
  },
  plank(g, w, h) {
    g.fillStyle = '#c98f5a'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) {
      g.fillStyle = '#d9a56c'; g.fillRect(x, 0, 1, h);
      g.fillStyle = '#a56f3f'; g.fillRect(x + 7, 0, 1, h);
      g.fillStyle = '#b47b46'; g.fillRect(x + 3, (x * 5) % (h - 6), 1, 4); // 나뭇결
    }
  },
  flower(g, w, h) {
    g.fillStyle = '#fff4dc'; g.fillRect(0, 0, w, h);
    for (let y = 3, row = 0; y < h; y += 8, row++) {
      for (let x = row % 2 ? 9 : 3; x < w; x += 12) {
        g.fillStyle = '#f58a1f'; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3);
        g.fillStyle = '#ffd34d'; g.fillRect(x, y, 1, 1);
        g.fillStyle = '#66ad5c'; g.fillRect(x + 1, y + 2, 1, 1);
      }
    }
  },
  navy(g, w, h) {
    g.fillStyle = '#2c3a66'; g.fillRect(0, 0, w, h);
    for (let y = 4, row = 0; y < h; y += 7, row++) {
      for (let x = row % 2 ? 10 : 3; x < w; x += 14) {
        g.fillStyle = '#ffd34d'; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3);
        g.fillStyle = '#5b6ea3'; g.fillRect(x + 6, y + 3, 1, 1);
      }
    }
  },
};

export function createRenderer(canvas, atlas) {
  const g = canvas.getContext('2d');
  const floors = Object.fromEntries(Object.keys(FLOORS).map(id => [id, makeCanvas(16, 16, FLOOR_PAINT[id])]));
  // 벽지는 가장 넓은 가게 폭으로 만들어 두고 왼쪽부터 필요한 만큼만 쓴다.
  const walls = Object.fromEntries(Object.keys(WALLS).map(id =>
    [id, makeCanvas(viewW(MAX_COLS), WALL_H - 5, c => WALL_PAINT[id](c, viewW(MAX_COLS), WALL_H - 5))]));
  // 밤에 조명 둘레를 밝히는 빛. 원을 세 겹 겹쳐서 가운데가 더 밝다. 빛 색마다 한 장씩 만들어 둔다.
  const glows = new Map();
  function glowOf(color) {
    if (!glows.has(color)) {
      const [red, green, blue] = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
      glows.set(color, makeCanvas(GLOW_R * 2 + 1, GLOW_R * 2 + 1, c => {
        for (const [r, alpha] of [[GLOW_R, 0.08], [14, 0.1], [7, 0.1]]) {
          c.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
          for (let y = -r; y <= r; y++) {
            const half = Math.floor(Math.sqrt(r * r - y * y));
            c.fillRect(GLOW_R - half, GLOW_R + y, half * 2 + 1, 1);
          }
        }
      }));
    }
    return glows.get(color);
  }

  // 하늘 모습은 1초에 한 번만 다시 계산한다.
  let sky = skyAt(new Date()), skyMs = Date.now();

  // 액자 사진은 저장에 글(data URL)로 들어 있어서, 바뀔 때만 그림으로 풀어 둔다. 풀리기 전에는 null.
  let photoSrc = null, photoImg = null;
  function photoOf(s) {
    const src = s.photo || null;
    if (src !== photoSrc) {
      photoSrc = src;
      photoImg = null;
      if (src) {
        const img = new Image();
        img.onload = () => { if (photoSrc === src) photoImg = img; };
        img.src = src;
      }
    }
    return photoImg;
  }

  const spr = (name, x, y) => g.drawImage(atlas[name], Math.round(x), Math.round(y));
  // 스프라이트를 칸 아래쪽 가운데에 맞춰 그린다. (tx, ty)는 소수여도 된다.
  const sprOnTile = (name, tx, ty, dy = 0) => {
    const s = atlas[name];
    spr(name, PAD + tx * TILE + (TILE - s.width) / 2, WALL_H + (ty + 1) * TILE - s.height + dy);
  };

  // 동물 한 마리를 옷과 함께 그린다. (x, y)는 동물 그림의 왼쪽 위. 모자는 그 위로 올라간다.
  function petAt(ctx, x, y, species, frame, worn, flip = false) {
    const f = flip ? '~' : '';
    ctx.drawImage(atlas[`pet_${species}_${frame}${f}`], x, y);
    if (worn.body) ctx.drawImage(atlas[`wear_${worn.body}${f}`], x, y);
    if (worn.neck) ctx.drawImage(atlas[`wear_${worn.neck}${f}`], x, y);
    if (worn.hat) ctx.drawImage(atlas[`wear_${worn.hat}${f}`], x, y - HAT_ROOM + PETS[species].hatDy);
  }

  function num(text, x, y, color = '#fff7ea') {
    for (const pass of [INK, color]) {
      g.fillStyle = pass;
      let cx = x;
      for (const ch of String(text)) {
        const bits = DIGITS[ch];
        for (let i = 0; i < 15; i++) {
          if (bits[i] !== '1') continue;
          const px = cx + (i % 3), py = y + Math.floor(i / 3);
          if (pass === INK) g.fillRect(px - 1, py - 1, 3, 3); else g.fillRect(px, py, 1, 1);
        }
        cx += 4;
      }
    }
  }
  const numWidth = text => String(text).length * 4 - 1;

  // 말풍선: (cx, bottom)이 꼬리 끝. 안에 16×13 아이콘이 들어간다.
  function bubble(cx, bottom, icon, alpha = 1) {
    const x = Math.round(cx - 9), y = Math.round(bottom - 19);
    g.fillStyle = INK;
    g.fillRect(x + 1, y, 16, 17); g.fillRect(x, y + 1, 18, 15);
    g.fillRect(x + 7, y + 17, 4, 1); g.fillRect(x + 8, y + 18, 2, 1);
    g.fillStyle = '#fff7ea';
    g.fillRect(x + 1, y + 1, 16, 15);
    g.fillRect(x + 8, y + 16, 2, 1);
    g.globalAlpha = alpha;
    g.drawImage(atlas[icon], 0, 2, 16, 13, x + 1, y + 2, 16, 13);
    g.globalAlpha = 1;
    return { x, y };
  }

  function bar(x, y, w, ratio, color) {
    g.fillStyle = INK; g.fillRect(x, y, w, 4);
    g.fillStyle = '#fff7ea'; g.fillRect(x + 1, y + 1, w - 2, 2);
    g.fillStyle = color; g.fillRect(x + 1, y + 1, Math.round((w - 2) * Math.max(0, Math.min(1, ratio))), 2);
  }

  function drawRoom(s, time) {
    const W = canvas.width, h = canvas.height, shift = wallShift(s);
    // 꾸미기에서 구매 확정을 기다리는 벽지와 바닥은 산 것처럼 미리 보여 준다.
    const pending = G.edit?.pending;
    g.drawImage(walls[pending?.kind === 'wall' ? pending.id : s.wall], 0, 0);
    g.fillStyle = '#6b4329'; g.fillRect(0, WALL_H - 5, W, 5);
    g.fillStyle = '#9a6842'; g.fillRect(0, WALL_H - 5, W, 1);

    const winX = WINDOW_X + shift;
    drawView(g, winX + 2, WINDOW_Y + 2, sky, time);
    spr('window', winX, WINDOW_Y);
    g.fillStyle = 'rgba(255,255,255,0.4)'; // 유리에 비친 빛
    g.fillRect(winX + 9, WINDOW_Y + 5, 1, 1); g.fillRect(winX + 8, WINDOW_Y + 6, 1, 1);

    const frameX = PET_FRAME_X + shift;
    spr('frame', frameX, 8);
    if (s.pets[0]) {
      // 작은 액자 안쪽에 첫 번째 친구 얼굴
      g.save();
      g.beginPath();
      g.rect(frameX + 2, 10, 14, 12);
      g.clip();
      g.drawImage(atlas[`pet_${s.pets[0].species}_a`], frameX - 1, 10);
      g.restore();
    }

    const photo = photoOf(s), at = photoRect(s);
    if (photo) g.drawImage(photo, at.x + 3, at.y + 3, PHOTO_W, PHOTO_H);
    else spr('painting', at.x + 3, at.y + 3);
    spr('photoframe', at.x, at.y);

    const doorX = PAD + s.door * TILE, doorY = WALL_H - 24;
    spr('door', doorX, doorY);
    g.fillStyle = skyCSS(sky); g.fillRect(doorX + 4, doorY + 4, 8, 4); // 문 유리에도 바깥 하늘이 비친다
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(doorX + 6, doorY + 5, 1, 1); g.fillRect(doorX + 5, doorY + 6, 1, 1);
    const trying = pending?.kind === 'floor' ? pending : null;
    for (let y = 0; y < s.rows; y++) {
      for (let x = 0; x < s.cols; x++) {
        const i = y * s.cols + x;
        g.drawImage(floors[trying?.tiles.includes(i) ? trying.id : s.floor[i]], PAD + x * TILE, WALL_H + y * TILE);
      }
    }
    // 문 앞 발매트
    g.fillStyle = '#cf6410'; g.fillRect(doorX + 2, WALL_H, 12, 3);
    g.fillStyle = '#f58a1f'; g.fillRect(doorX + 3, WALL_H, 10, 2);
    g.fillStyle = '#6b4329';
    g.fillRect(0, WALL_H, PAD, h); g.fillRect(W - PAD, WALL_H, PAD, h); g.fillRect(0, h - PAD, W, PAD);
    g.fillStyle = '#9a6842';
    g.fillRect(PAD - 1, WALL_H, 1, h - WALL_H - PAD + 1); g.fillRect(W - PAD, WALL_H, 1, h - WALL_H - PAD + 1);
    g.fillRect(PAD - 1, h - PAD, W - PAD * 2 + 2, 1);
  }

  // 시각에 맞춰 가게 안을 물들인다. 해 뜨고 질 때는 노을빛, 밤에는 어둡게. 밤에는 조명 둘레가 밝다.
  function drawLight(s) {
    const W = canvas.width, h = canvas.height;
    if (sky.glow > 0.02) {
      g.fillStyle = sky.dawn ? `rgba(255,170,150,${sky.glow * 0.08})` : `rgba(255,130,60,${sky.glow * 0.1})`;
      g.fillRect(0, 0, W, h);
    }
    if (sky.dark < 0.02) return;
    g.fillStyle = `rgba(18,22,58,${sky.dark * 0.3})`;
    g.fillRect(0, 0, W, h);
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = sky.dark;
    for (const it of s.items) {
      const f = FURN[it.type];
      if (!f.light) continue;
      // 빛은 그림 윗부분(전등갓, 불꽃)에서 퍼진다.
      const top = WALL_H + (it.y + 1) * TILE - atlas[f.sprite].height;
      g.drawImage(glowOf(f.light), PAD + it.x * TILE + 8 - GLOW_R, top + 5 - GLOW_R);
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }

  function drawItem(it, time) {
    const f = FURN[it.type];
    if (it.type !== 'stove') {
      sprOnTile(f.blink && Math.floor(time * 1.5) % 2 ? f.blink : f.sprite, it.x, it.y);
      return;
    }
    const state = cookState(it);
    sprOnTile(state === 'cooking' ? 'stove_on' : 'stove', it.x, it.y);
    if (state === 'cooking') {
      // 김
      const px = PAD + it.x * TILE, py = WALL_H + (it.y + 1) * TILE - 24;
      g.fillStyle = '#fff7ea';
      for (let i = 0; i < 3; i++) {
        const t = (time * 0.8 + i / 3) % 1;
        g.globalAlpha = 1 - t;
        g.fillRect(px + 5 + i * 3 + Math.round(Math.sin(time * 3 + i) * 1), Math.round(py + 3 - t * 7), 1, 2);
      }
      g.globalAlpha = 1;
    }
    for (let i = 1; i < it.lv; i++) spr('star', PAD + it.x * TILE + 1 + (i - 1) * 6, WALL_H + it.y * TILE + 1);
  }

  function drawCustomer(c, time) {
    const seated = c.state === 'wait' || c.state === 'eat';
    const frame = seated ? 'sit' : Math.floor(c.walk * 6) % 2 ? 'a' : 'b';
    const bob = c.state === 'eat' && Math.floor(time * 4) % 2 ? 1 : 0;
    sprOnTile(`cust${c.look}_${c.up ? 'back_' : ''}${frame}`, c.x, c.y, seated ? -5 + bob : 0);
  }

  function drawPet(p, time) {
    const pet = petById(p.id);
    const napping = p.state === 'nap';
    const moving = p.state === 'walk' || p.state === 'serve';
    const frame = napping ? 'sleep' : moving && Math.floor(p.walk * 8) % 2 ? 'b' : 'a';
    const hop = p.boost > 0 && !moving && !napping && Math.floor(time * 6) % 2 ? -1 : 0;
    const h = atlas[`pet_${pet.species}_${frame}`].height;
    const x = Math.round(PAD + p.x * TILE), y = Math.round(WALL_H + (p.y + 1) * TILE - h - 1 + hop);
    petAt(g, x, y, pet.species, frame, pet.wear, p.dir < 0);
    if (napping) {
      const t = time % 1.6 / 1.6;
      g.globalAlpha = 1 - t;
      spr('zzz', x + 11, y - 2 - t * 6);
      g.globalAlpha = 1;
    }
  }

  function drawOverlays(s, w, time) {
    for (const it of s.items) {
      if (it.type !== 'stove' || !it.cook) continue;
      const px = PAD + it.x * TILE, top = WALL_H + (it.y + 1) * TILE - 24;
      if (cookState(it) === 'done') {
        bubble(px + 8, top + 3 + (Math.floor(time * 3) % 2), recipeOf(it.cook.r).icon);
      } else {
        bar(px + 1, top - 2, 14, (Date.now() - it.cook.start) / (it.cook.end - it.cook.start), '#f58a1f');
      }
    }
    for (const c of [...w.customers].sort((a, b) => a.y - b.y)) {
      if (c.state !== 'wait') continue;
      const cx = PAD + c.x * TILE + 8, headTop = WALL_H + (c.y + 1) * TILE - 5 - 17;
      const have = s.stock[c.order] > 0;
      const left = patienceLeft(c);
      const shake = left < 0.25 && Math.floor(time * 10) % 2 ? 1 : 0;
      const b = bubble(cx + shake, headTop - 1, recipeOf(c.order).icon, have ? 1 : 0.4);
      g.fillStyle = left < 0.25 ? '#e2432c' : '#f58a1f';
      g.fillRect(b.x + 2, b.y + 14, Math.max(1, Math.round(14 * left)), 1);
    }
    for (const f of w.floats) {
      const px = PAD + f.x * TILE + 8, py = WALL_H + f.y * TILE - 6 - f.t * 12;
      g.globalAlpha = f.t > 0.9 ? Math.max(0, (1.2 - f.t) / 0.3) : 1;
      if (f.kind === 'heart') spr('heart', px - 4, py);
      else if (f.kind === 'coin') {
        const text = '+' + f.n, tw = numWidth(text);
        spr('coin', px - (tw + 10) / 2, py);
        num(text, Math.round(px - (tw + 10) / 2 + 10), Math.round(py + 2), '#ffd34d');
      } else {
        const text = 'x' + f.n;
        g.drawImage(atlas[f.icon], Math.round(px - 12), Math.round(py - 6));
        num(text, Math.round(px + 5), Math.round(py + 2));
      }
      g.globalAlpha = 1;
    }
  }

  // 칸 둘레에 주황 테두리를 그린다(고른 가구, 사려는 가구 자리).
  function tileMark(tx, ty) {
    const x = PAD + tx * TILE, y = WALL_H + ty * TILE;
    g.fillStyle = '#fff7ea';
    g.fillRect(x - 1, y - 1, 18, 2); g.fillRect(x - 1, y + 15, 18, 2);
    g.fillRect(x - 1, y - 1, 2, 18); g.fillRect(x + 15, y - 1, 2, 18);
    g.fillStyle = '#f58a1f';
    g.fillRect(x, y, 16, 1); g.fillRect(x, y + 15, 16, 1);
    g.fillRect(x, y, 1, 16); g.fillRect(x + 15, y, 1, 16);
  }

  function drawEdit(s, e, time) {
    const roomW = s.cols * TILE, roomH = s.rows * TILE;
    g.fillStyle = 'rgba(59,43,43,0.28)';
    for (let x = 0; x <= s.cols; x++) g.fillRect(PAD + x * TILE - (x === s.cols ? 1 : 0), WALL_H, 1, roomH);
    for (let y = 0; y <= s.rows; y++) g.fillRect(PAD, WALL_H + y * TILE - (y === s.rows ? 1 : 0), roomW, 1);
    const blink = Math.floor(time * 3) % 2 === 0;
    const sel = s.items.find(i => i.id === e.sel);
    if (sel && blink) tileMark(sel.x, sel.y);
    // 구매 확정을 기다리는 것: 가구는 놓일 자리에 흐리게, 바닥은 칠할 칸을 깜빡여서 보여 준다.
    const p = e.pending;
    if (p?.kind === 'furn') {
      tileMark(p.x, p.y);
      g.globalAlpha = blink ? 0.9 : 0.6;
      sprOnTile(FURN[p.type].sprite, p.x, p.y);
      g.globalAlpha = 1;
    } else if (p?.kind === 'floor' && blink) {
      g.fillStyle = 'rgba(255,255,255,0.35)';
      for (const i of p.tiles) g.fillRect(PAD + (i % s.cols) * TILE, WALL_H + Math.floor(i / s.cols) * TILE, TILE, TILE);
    } else if (p?.kind === 'expand' && blink) {
      // 넓어질 쪽 가장자리를 주황 띠로 알려 준다.
      g.fillStyle = '#f58a1f';
      if (p.dir === 'up') g.fillRect(PAD, WALL_H, roomW, 3);
      else if (p.dir === 'down') g.fillRect(PAD, WALL_H + roomH - 3, roomW, 3);
      else if (p.dir === 'left') g.fillRect(PAD, WALL_H, 3, roomH);
      else g.fillRect(PAD + roomW - 3, WALL_H, 3, roomH);
    }
  }

  function draw() {
    const s = G.state, w = G.world, time = w.time;
    if (canvas.width !== viewW(s.cols) || canvas.height !== viewH(s.rows)) {
      canvas.width = viewW(s.cols); canvas.height = viewH(s.rows);
    }
    g.imageSmoothingEnabled = false;
    const nowMs = Date.now();
    if (nowMs - skyMs > 1000) { sky = skyAt(new Date(nowMs)); skyMs = nowMs; }
    drawRoom(s, time);

    const list = [];
    for (const it of s.items) {
      if (FURN[it.type].block) list.push({ key: it.y + 0.5, draw: () => drawItem(it, time) });
      else sprOnTile(FURN[it.type].sprite, it.x, it.y);
    }
    if (!G.edit) {
      for (const c of w.customers) {
        const seated = c.state === 'wait' || c.state === 'eat';
        list.push({ key: c.y + (seated ? 0.6 : 0.55), draw: () => drawCustomer(c, time) });
        if (c.state === 'eat') {
          const dx = (c.seat.x - c.seat.tx) * 4, dy = (c.seat.y - c.seat.ty) * 2;
          list.push({
            key: c.seat.ty + 0.7,
            draw: () => g.drawImage(atlas[recipeOf(c.order).icon], PAD + c.seat.tx * TILE + dx, WALL_H + c.seat.ty * TILE - 6 + dy),
          });
        }
      }
    }
    for (const p of w.pets) list.push({ key: p.y + 0.56, draw: () => drawPet(p, time) });
    list.sort((a, b) => a.key - b.key);
    for (const d of list) d.draw();

    if (G.edit) drawEdit(s, G.edit, time);
    else {
      // 밝기 설정은 구경 중에도 내 가게의 것을 따른다.
      if ((G.home || s).dim !== false) drawLight(s);
      drawOverlays(s, w, time);
    }
  }

  // 화면 좌표의 가구를 찾는다. 키 큰 가구는 윗부분 8px까지 눌린다.
  function pickItem(px, py) {
    let best = null;
    for (const it of G.state.items) {
      const x = PAD + it.x * TILE, y = WALL_H + it.y * TILE;
      const extra = atlas[FURN[it.type].sprite].height > TILE ? 8 : 0;
      if (px >= x && px < x + TILE && py >= y - extra && py < y + TILE && (!best || it.y > best.y)) best = it;
    }
    return best;
  }

  const floorURL = id => floors[id].toDataURL();
  const wallURL = id => makeCanvas(16, 16, c => c.drawImage(walls[id], 0, 0)).toDataURL();

  // 화면 밖(버튼, 옷장)에 쓸 동물 그림. worn을 주면 그 옷차림으로, face면 얼굴 쪽만 잘라서.
  const petURLs = new Map();
  function petURL(species, worn = {}, face = false) {
    const key = [species, worn.hat, worn.neck, worn.body, face].join('|');
    if (!petURLs.has(key)) {
      const full = makeCanvas(16, 14 + HAT_ROOM, c => petAt(c, 0, HAT_ROOM, species, 'a', worn));
      petURLs.set(key, (face ? makeCanvas(11, 14, c => c.drawImage(full, -5, 0)) : full).toDataURL());
    }
    return petURLs.get(key);
  }

  return { draw, pickItem, floorURL, wallURL, petURL };
}
