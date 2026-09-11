import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pages } from '../src/pages/pages.mjs';
import { renderPage } from '../src/templates/site.mjs';
import { site } from '../site.config.mjs';
import { applyAnalyticsConsent } from './analytics-consent.mjs';
import { applyShareableCalculations } from './shareable-calculations.mjs';
import { applyCalculationExplanations } from './calculation-explanations.mjs';

const verificationTag = '<meta name="google-site-verification" content="EwTiLP4eMZK5K7W9U_5tpM7cvJsn4ZaLvRwKYrmuuV0">';
const shareableForms = ['fit-form', 'minimum-form', 'weight-form'];
const explanations = {
  'fit-form': {
    formula: 'para cada orientación: unidades por eje = suelo((medida interior + holgura) ÷ (medida de pieza + holgura)); total = largo × ancho × alto; se elige la orientación con mayor total',
    fields: [['containerLength', 'Largo interior', 'cm'], ['containerWidth', 'Ancho interior', 'cm'], ['containerHeight', 'Alto interior', 'cm'], ['itemLength', 'Largo de la pieza', 'cm'], ['itemWidth', 'Ancho de la pieza', 'cm'], ['itemHeight', 'Alto de la pieza', 'cm'], ['clearance', 'Holgura entre piezas', 'cm']],
    note: 'Se prueban todas las orientaciones rectangulares posibles de la pieza y se compara su capacidad.'
  },
  'minimum-form': {
    formula: 'para cada orientación y retícula x×y×z: medida interior por eje = nº celdas × medida de pieza + (nº celdas − 1) × holgura + 2 × protección; se elige el menor volumen que aloja la cantidad pedida',
    fields: [['itemLength', 'Largo de la pieza', 'cm'], ['itemWidth', 'Ancho de la pieza', 'cm'], ['itemHeight', 'Alto de la pieza', 'cm'], ['quantity', 'Cantidad'], ['clearance', 'Holgura entre piezas', 'cm'], ['padding', 'Protección en bordes', 'cm']],
    note: 'Si dos soluciones tienen volumen similar, la herramienta prioriza menos huecos vacíos, menor superficie y una caja menos extrema.'
  },
  'weight-form': {
    formula: 'peso volumétrico por bulto = largo × ancho × alto ÷ divisor; peso facturable = máximo(peso real, peso volumétrico), aplicando después el redondeo configurado; total = por bulto × cantidad',
    fields: [['length', 'Largo', 'cm'], ['width', 'Ancho', 'cm'], ['height', 'Alto', 'cm'], ['actualWeight', 'Peso real por bulto', 'kg'], ['quantity', 'Número de bultos'], ['customDivisor', 'Divisor personalizado'], ['rounding', 'Paso de redondeo', 'kg']],
    note: 'El divisor y la regla de redondeo dependen del transportista y del servicio; confirma siempre sus condiciones vigentes.'
  }
};
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
  html = applyShareableCalculations(html, shareableForms);
  html = applyCalculationExplanations(html, explanations);
  if (page.path === '') html = html.replace('<head>', `<head>\n  ${verificationTag}`);
  await writeFile(destination, html, 'utf8');
}

const urls = pages.filter((page) => !page.noindex && page.path !== '404')
  .map((page) => `  <url><loc>${site.origin}${site.basePath}${page.path ? `${page.path}/` : ''}</loc></url>`)
  .join('\n');
await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, 'utf8');
await writeFile(path.join(dist, '.nojekyll'), '', 'utf8');
console.log(`Built ${pages.length} pages in dist/`);
