// 앱에 담을 웹 파일만 www/ 폴더로 모은다: npm run www
// 저장소 맨 위에는 도구, 네이티브 프로젝트, node_modules가 같이 있어서 통째로 담을 수 없다.
import { cpSync, rmSync, mkdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const out = new URL('www/', root);
const FILES = ['index.html', 'style.css', 'manifest.webmanifest', 'privacy.html', 'src', 'assets'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const name of FILES) cpSync(new URL(name, root), new URL(name, out), { recursive: true });
console.log(`www/ ← ${FILES.join(', ')}`);
