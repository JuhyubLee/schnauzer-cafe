// 액자 화면: 벽의 큰 액자에 걸 사진을 고른다.
// 고른 사진은 기기 안에서 작은 픽셀 그림으로 줄여 저장에 넣는다. 원본은 어디에도 남기거나 보내지 않는다.
import { G, setPhoto } from './game.js';
import { PHOTO_W, PHOTO_H } from './data.js';
import { sfx } from './sfx.js';

const STEP = 4; // 먼저 액자의 4배 크기로 줄인 다음, 4×4칸씩 평균을 내서 한 픽셀로 만든다

function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// 사진 파일 → 액자 크기의 PNG(data URL). 가운데를 액자 비율로 잘라 쓴다.
async function shrink(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const ratio = PHOTO_W / PHOTO_H;
    let sw = img.naturalWidth, sh = img.naturalHeight;
    if (sw / sh > ratio) sw = sh * ratio; else sh = sw / ratio;
    const mid = canvasOf(PHOTO_W * STEP, PHOTO_H * STEP), mg = mid.getContext('2d');
    mg.imageSmoothingQuality = 'high';
    mg.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, mid.width, mid.height);
    const src = mg.getImageData(0, 0, mid.width, mid.height).data;
    const out = canvasOf(PHOTO_W, PHOTO_H), og = out.getContext('2d'), dst = og.createImageData(PHOTO_W, PHOTO_H);
    for (let y = 0; y < PHOTO_H; y++) {
      for (let x = 0; x < PHOTO_W; x++) {
        const sum = [0, 0, 0];
        for (let dy = 0; dy < STEP; dy++) {
          for (let dx = 0; dx < STEP; dx++) {
            const i = ((y * STEP + dy) * mid.width + x * STEP + dx) * 4;
            sum[0] += src[i]; sum[1] += src[i + 1]; sum[2] += src[i + 2];
          }
        }
        const o = (y * PHOTO_W + x) * 4;
        for (let ch = 0; ch < 3; ch++) dst.data[o + ch] = Math.round(sum[ch] / (STEP * STEP));
        dst.data[o + 3] = 255;
      }
    }
    og.putImageData(dst, 0, 0);
    return out.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

// onChange: 사진이 바뀌었을 때 부른다(꾸미기 목록의 그림을 새로 그리려고)
export function createPhotoUI({ icon, toast, openSheet, onChange }) {
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = 'image/*';
  picker.hidden = true;
  document.body.append(picker);

  function change(photo, msg) {
    if (!setPhoto(photo)) return;
    sfx('place');
    toast(msg);
    onChange();
    open();
  }

  picker.addEventListener('change', async () => {
    const file = picker.files[0];
    picker.value = ''; // 같은 사진을 다시 골라도 알 수 있게
    if (!file) return;
    let photo = null;
    try { photo = await shrink(file); } catch { /* 그림이 아니거나 열 수 없는 파일 */ }
    if (photo) change(photo, '액자에 사진을 걸었어요');
    else toast('이 사진은 열 수 없어요. 다른 사진으로 해 주세요');
  });

  function open() {
    const photo = G.state.photo;
    openSheet('액자', `<div class="center stack">
        <img class="px photo" src="${photo || icon('painting')}" alt="">
        <p>좋아하는 사진을 벽에 걸어 보세요.<br>사진은 작은 픽셀 그림으로 바뀌어요.</p>
        <button type="button" class="btn primary big" data-act="pick">${photo ? '다른 사진 고르기' : '사진 고르기'}</button>
        ${photo ? '<button type="button" class="btn" data-act="clear">원래 그림으로</button>' : ''}
        <p class="muted">사진은 이 기기에만 저장돼요. 초대장에는 담기지 않고, 백업 코드에는 들어가요.</p>
      </div>`, {
      actions: {
        pick() { sfx('tap'); picker.click(); },
        clear() { change(null, '원래 그림으로 돌려놨어요'); },
      },
    });
  }

  return { open };
}
