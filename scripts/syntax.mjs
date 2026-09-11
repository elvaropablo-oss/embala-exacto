import { readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = await walk(root);
for (const file of files) {
  const check = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (check.status !== 0) {
    process.stderr.write(check.stderr || check.stdout);
    process.exit(check.status || 1);
  }
}
console.log(`Syntax checked ${files.length} JavaScript files.`);

async function walk(directory) {
  const files = [];
  for (const name of await readdir(directory)) {
    if (name === 'dist' || name === 'node_modules' || name === '.git') continue;
    const full = path.join(directory, name);
    if ((await stat(full)).isDirectory()) files.push(...await walk(full));
    else if (full.endsWith('.js') || full.endsWith('.mjs')) files.push(full);
  }
  return files;
}
