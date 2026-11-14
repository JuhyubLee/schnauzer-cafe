// 캔버스 그리기. 논리 해상도(1칸 = 16px)로 그리고, 확대는 CSS가 한다.
import { G, COLS, DOOR_X, cookState, patienceLeft } from './game.js';
import { FURN, FLOORS, WALLS, RECIPE } from './data.js';

export const TILE = 16;
export const PAD = 4; // 좌우·아래 벽 두께
export const WALL_H = 40;
export const VIEW_W = COLS * TILE + PAD * 2;
export const viewH = rows => WALL_H + rows * TILE + PAD;
export const tileAt = (px, py) => ({ x: Math.floor((px - PAD) / TILE), y: Math.floor((py - WALL_H) / TILE) });

const INK = '#3b2b2b';
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
};

export function createRenderer(canvas, atlas) {
  const g = canvas.getContext('2d');
  const floors = Object.fromEntries(Object.keys(FLOORS).map(id => [id, makeCanvas(16, 16, FLOOR_PAINT[id])]));
  const walls = Object.fromEntries(Object.keys(WALLS).map(id =>
    [id, makeCanvas(VIEW_W, WALL_H - 5, c => WALL_PAINT[id](c, VIEW_W, WALL_H - 5))]));

  const spr = (name, x, y) => g.drawImage(atlas[name], Math.round(x), Math.round(y));
  // 스프라이트를 칸 아래쪽 가운데에 맞춰 그린다. (tx, ty)는 소수여도 된다.
  const sprOnTile = (name, tx, ty, dy = 0) => {
    const s = atlas[name];
    spr(name, PAD + tx * TILE + (TILE - s.width) / 2, WALL_H + (ty + 1) * TILE - s.height + dy);
  };

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

  function drawRoom(s) {
    const h = canvas.height;
    g.drawImage(walls[s.wall], 0, 0);
    g.fillStyle = '#6b4329'; g.fillRect(0, WALL_H - 5, VIEW_W, 5);
    g.fillStyle = '#9a6842'; g.fillRect(0, WALL_H - 5, VIEW_W, 1);
    spr('window', PAD + 6, 8);
    spr('frame', PAD + 54, 8);
    spr('door', PAD + DOOR_X * TILE, WALL_H - 24);
    for (let y = 0; y < s.rows; y++) {
      for (let x = 0; x < COLS; x++) g.drawImage(floors[s.floor[y * COLS + x]], PAD + x * TILE, WALL_H + y * TILE);
    }
    // 문 앞 발매트
    g.fillStyle = '#cf6410'; g.fillRect(PAD + DOOR_X * TILE + 2, WALL_H, 12, 3);
    g.fillStyle = '#f58a1f'; g.fillRect(PAD + DOOR_X * TILE + 3, WALL_H, 10, 2);
    g.fillStyle = '#6b4329';
    g.fillRect(0, WALL_H, PAD, h); g.fillRect(VIEW_W - PAD, WALL_H, PAD, h); g.fillRect(0, h - PAD, VIEW_W, PAD);
    g.fillStyle = '#9a6842';
    g.fillRect(PAD - 1, WALL_H, 1, h - WALL_H - PAD + 1); g.fillRect(VIEW_W - PAD, WALL_H, 1, h - WALL_H - PAD + 1);
    g.fillRect(PAD - 1, h - PAD, VIEW_W - PAD * 2 + 2, 1);
  }

  function drawItem(it, time) {
    const f = FURN[it.type];
    if (it.type !== 'stove') { sprOnTile(f.sprite, it.x, it.y); return; }
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

  function drawDog(d, time) {
    const flip = d.dir < 0 ? '~' : '';
    if (d.state === 'nap') {
      sprOnTile('dog_sleep' + flip, d.x, d.y, -3);
      const t = time % 1.6 / 1.6;
      g.globalAlpha = 1 - t;
      spr('zzz', PAD + d.x * TILE + 11, WALL_H + d.y * TILE - 2 - t * 6);
      g.globalAlpha = 1;
      return;
    }
    const moving = d.state === 'walk' || d.state === 'serve';
    const frame = moving && Math.floor(d.walk * 8) % 2 ? 'dog_b' : 'dog_a';
    const hop = d.boost > 0 && !moving && Math.floor(time * 6) % 2 ? -1 : 0;
    sprOnTile(frame + flip, d.x, d.y, -1 + hop);
  }

  function drawOverlays(s, w, time) {
    for (const it of s.items) {
      if (it.type !== 'stove' || !it.cook) continue;
      const px = PAD + it.x * TILE, top = WALL_H + (it.y + 1) * TILE - 24;
      if (cookState(it) === 'done') {
        bubble(px + 8, top + 3 + (Math.floor(time * 3) % 2), RECIPE[it.cook.r].icon);
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
      const b = bubble(cx + shake, headTop - 1, RECIPE[c.order].icon, have ? 1 : 0.4);
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

  function drawEdit(s, e, time) {
    g.fillStyle = 'rgba(59,43,43,0.28)';
    for (let x = 0; x <= COLS; x++) g.fillRect(PAD + x * TILE - (x === COLS ? 1 : 0), WALL_H, 1, s.rows * TILE);
    for (let y = 0; y <= s.rows; y++) g.fillRect(PAD, WALL_H + y * TILE - (y === s.rows ? 1 : 0), COLS * TILE, 1);
    const sel = s.items.find(i => i.id === e.sel);
    if (sel && Math.floor(time * 3) % 2 === 0) {
      const x = PAD + sel.x * TILE, y = WALL_H + sel.y * TILE;
      g.fillStyle = '#fff7ea';
      g.fillRect(x - 1, y - 1, 18, 2); g.fillRect(x - 1, y + 15, 18, 2);
      g.fillRect(x - 1, y - 1, 2, 18); g.fillRect(x + 15, y - 1, 2, 18);
      g.fillStyle = '#f58a1f';
      g.fillRect(x, y, 16, 1); g.fillRect(x, y + 15, 16, 1);
      g.fillRect(x, y, 1, 16); g.fillRect(x + 15, y, 1, 16);
    }
  }

  function draw() {
    const s = G.state, w = G.world, time = w.time;
    if (canvas.width !== VIEW_W || canvas.height !== viewH(s.rows)) {
      canvas.width = VIEW_W; canvas.height = viewH(s.rows);
    }
    g.imageSmoothingEnabled = false;
    drawRoom(s);

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
            draw: () => g.drawImage(atlas[RECIPE[c.order].icon], PAD + c.seat.tx * TILE + dx, WALL_H + c.seat.ty * TILE - 6 + dy),
          });
        }
      }
    }
    list.push({ key: w.dog.y + 0.56, draw: () => drawDog(w.dog, time) });
    list.sort((a, b) => a.key - b.key);
    for (const d of list) d.draw();

    if (G.edit) drawEdit(s, G.edit, time);
    else drawOverlays(s, w, time);
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

  return { draw, pickItem, floorURL, wallURL };
}
