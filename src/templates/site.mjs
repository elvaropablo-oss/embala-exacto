import { site } from '../../site.config.mjs';

const base = site.basePath;
const clean = (path = '') => path.replace(/^\/+|\/+$/g, '');
const active = (current, target) => clean(current) === clean(target) || clean(current).startsWith(`${clean(target)}/`);

export function linkButton(path, label, quiet = false) {
  return `<a class="button${quiet ? ' button--quiet' : ''}" href="${base}${path}"><span>${label}</span></a>`;
}

export function breadcrumbs(items) {
  return `<nav class="breadcrumbs" aria-label="Migas de pan">${items.map((item, index) => index === items.length - 1 ? `<span aria-current="page">${item.label}</span>` : `<a href="${base}${item.path}">${item.label}</a>`).join('<span aria-hidden="true">→</span>')}</nav>`;
}

export function hero(kicker, title, intro, actions = '') {
  return `<section class="hero"><div class="hero-copy"><p class="eyebrow">${kicker}</p><h1>${title}</h1><p class="lead">${intro}</p>${actions ? `<div class="actions">${actions}</div>` : ''}</div><div class="parcel" aria-hidden="true"><span class="parcel-tape">FRÁGIL / MEDIR</span><div class="parcel-label"><small>DESTINO</small><b>CAJA<br>IDEAL</b><span>60 × 40 × 30</span><i></i><em>EE 024 / ES</em></div><span class="parcel-axis parcel-axis--x">LARGO</span><span class="parcel-axis parcel-axis--y">ALTO</span><span class="parcel-axis parcel-axis--z">ANCHO</span></div></section>`;
}

export function renderPage(page) {
  const canonical = `${site.origin}${base}${page.path ? `${page.path}/` : ''}`;
  const schema = JSON.stringify(page.schema || {
    '@context': 'https://schema.org', '@type': page.tool ? 'WebApplication' : 'WebPage',
    name: page.h1, url: canonical, description: page.description, inLanguage: 'es-ES',
    ...(page.tool ? { applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' } } : {})
  }).replace(/</g, '\\u003c');
  const pageClass = `page-${clean(page.path).replaceAll('/', '-') || 'inicio'}`;
  const nav = (path, label) => `<a href="${base}${path}"${active(page.path, path) ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${page.title}</title>
  <meta name="description" content="${page.description}">
  ${page.noindex ? '<meta name="robots" content="noindex,follow">' : ''}
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${base}assets/site.css">
  <script type="application/ld+json">${schema}</script>
  <script type="module" src="${base}assets/app.js"></script>
  <script type="module" src="${base}assets/visuals.js"></script>
  <script type="module" src="${base}assets/quality-fixes.js"></script>
</head>
<body class="${pageClass}${page.tool ? ' page-tool' : ''}">
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  <header class="site-header"><a class="brand" href="${base}" aria-label="EmbalaExacto, inicio"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="m4 12 16-8 16 8-16 8zM4 12v18l16 8V20m16-8v18l-16 8"/></svg><span>Embala<br><strong>Exacto</strong></span></a><nav aria-label="Principal">${nav('herramientas/', 'Herramientas')}${nav('guias/medir-caja/', 'Cómo medir')}${nav('metodologia/', 'Fórmulas')}</nav></header>
  <main id="contenido">${page.content}</main>
  <footer><a class="footer-brand" href="${base}">EmbalaExacto</a><p>Medidas claras para cajas que encajan.</p><nav aria-label="Información"><a href="${base}preguntas-frecuentes/">Preguntas</a><a href="${base}sobre/">Sobre</a><a href="${base}privacidad/">Privacidad</a></nav><p class="footer-rule">Comprueba el bulto real antes de comprar o enviar.</p></footer>
</body>
</html>`;
}
