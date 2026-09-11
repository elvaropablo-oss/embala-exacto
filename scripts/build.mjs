import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pages } from '../src/pages/pages.mjs';
import { renderPage } from '../src/templates/site.mjs';
import { site } from '../site.config.mjs';
import { applyAnalyticsConsent } from './analytics-consent.mjs';

const verificationTag = '<meta name="google-site-verification" content="EwTiLP4eMZK5K7W9U_5tpM7cvJsn4ZaLvRwKYrmuuV0">';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, 'assets'), { recursive: true });
await cp(path.join(root, 'src/js'), path.join(dist, 'assets'), { recursive: true });
await cp(path.join(root, 'src/styles/site.css'), path.join(dist, 'assets/site.css'));
await cp(path.join(root, 'src/assets/favicon.svg'), path.join(dist, 'assets/favicon.svg'));

for (const page of pages) {
  const destination = page.output
    ? path.join(dist, page.output)
    : page.path ? path.join(dist, page.path, 'index.html') : path.join(dist, 'index.html');
  await mkdir(path.dirname(destination), { recursive: true });
  let html = applyAnalyticsConsent(renderPage(page), {
    measurementId: 'G-GQ2SYEWZ36',
    storageKey: 'ee:v1:analytics-consent'
  });
  if (page.path === '') html = html.replace('<head>', `<head>\n  ${verificationTag}`);
  await writeFile(destination, html, 'utf8');
}

const urls = pages.filter((page) => !page.noindex && page.path !== '404')
  .map((page) => `  <url><loc>${site.origin}${site.basePath}${page.path ? `${page.path}/` : ''}</loc></url>`)
  .join('\n');
await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, 'utf8');
await writeFile(path.join(dist, '.nojekyll'), '', 'utf8');
console.log(`Built ${pages.length} pages in dist/`);
