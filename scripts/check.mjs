import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const htmlFiles = await walk(dist, '.html');
const publicPaths = new Set((await walk(dist)).map((file) => `/${path.relative(dist, file).replaceAll('\\', '/')}`));
const failures = [];

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const rel = path.relative(dist, file);
  if ((html.match(/<h1\b/g) || []).length !== 1) failures.push(`${rel}: debe contener un H1`);
  for (const required of ['<title>', 'name="description"', 'rel="canonical"', 'application/ld+json']) {
    if (!html.includes(required)) failures.push(`${rel}: falta ${required}`);
  }
  for (const match of html.matchAll(/(?:href|src)="(\/embala-exacto\/[^"#?]*)/g)) {
    let target = match[1].replace('/embala-exacto', '') || '/index.html';
    if (target.endsWith('/')) target += 'index.html';
    if (!publicPaths.has(target)) failures.push(`${rel}: referencia local ausente ${match[1]}`);
  }
  for (const script of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(script[1]); } catch { failures.push(`${rel}: JSON-LD no válido`); }
  }
}

const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
for (const required of ['cuantas-caben/', 'caja-minima/', 'peso-volumetrico/']) {
  if (!sitemap.includes(required)) failures.push(`sitemap: falta ${required}`);
}
if (sitemap.includes('mi-proyecto/') || sitemap.includes('404')) failures.push('sitemap: contiene una ruta no indexable');
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`Checked ${htmlFiles.length} HTML files, local references, JSON-LD and sitemap.`);

async function walk(directory, extension = null) {
  const files = [];
  for (const name of await readdir(directory)) {
    const full = path.join(directory, name);
    if ((await stat(full)).isDirectory()) files.push(...await walk(full, extension));
    else if (!extension || full.endsWith(extension)) files.push(full);
  }
  return files;
}
