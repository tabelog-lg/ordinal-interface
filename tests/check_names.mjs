import { NOTATIONS } from '../src/notations/index';
// 从 plugins.ts 里抠出 NOTATION_NAMES（不 import 该文件，避免碰 indexedDB）
import { readFileSync } from 'node:fs';
// 用 cwd 而不是 import.meta.url：本脚本是被 esbuild 打包后执行的
// （见 package.json 的 check-names），打包产物在 node_modules/.cache/ 下，
// 那时 import.meta.url 指向那里，相对路径会解析错。
// npm run 保证 cwd 是项目根，所以按 cwd 拼路径才对。
const src = readFileSync(process.cwd() + '/src/engine/plugins.ts', 'utf8');
const m = src.match(/const NOTATION_NAMES: Record<string, string> = \{([\s\S]*?)\n\};/);
const names = {};
for (const line of m[1].split('\n')) {
  const mm = line.match(/^\s*([a-z0-9_]+):\s*'([^']*)',\s*$/);
  if (mm) names[mm[1]] = mm[2];
}
let bad = 0;
for (const [id, p] of Object.entries(NOTATIONS)) {
  if (names[id] !== p.name) { console.log(`不一致 ${id}: 表=${names[id]} 实现=${p.name}`); bad++; }
}
console.log(`记号 ${Object.keys(NOTATIONS).length} 个，名字不一致 ${bad} 个`);
process.exit(bad ? 1 : 0);
