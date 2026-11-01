import { NOTATIONS } from '../src/notations/index';
// 从 plugins.ts 里抠出 NOTATION_NAMES（不 import 该文件，避免碰 indexedDB）
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../src/engine/plugins.ts', import.meta.url), 'utf8');
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
