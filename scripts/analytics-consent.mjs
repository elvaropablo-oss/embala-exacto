export function applyAnalyticsConsent(html, { measurementId, storageKey }) {
  const id = JSON.stringify(measurementId);
  const key = JSON.stringify(storageKey);
  const head = `  <style>
    .analytics-consent{position:fixed;z-index:9999;left:1rem;right:1rem;bottom:1rem;max-width:760px;margin:auto;padding:1rem 1.1rem;background:#fff;color:#171717;border:2px solid currentColor;box-shadow:0 8px 30px rgb(0 0 0 / .16);font:inherit}
    .analytics-consent[hidden]{display:none}.analytics-consent p{margin:.35rem 0 .8rem}.analytics-consent__actions{display:flex;gap:.6rem;flex-wrap:wrap}.analytics-consent__settings{font:inherit;background:none;border:0;text-decoration:underline;cursor:pointer;padding:.35rem}
    @media(max-width:560px){.analytics-consent{left:.6rem;right:.6rem;bottom:.6rem}.analytics-consent__actions>*{flex:1 1 9rem}}
  </style>
  <script>
  (() => {
    const measurementId = ${id};
    const storageKey = ${key};
    let loaded = false;
    const readChoice = () => { try { return localStorage.getItem(storageKey); } catch { return null; } };
    const writeChoice = (value) => { try { localStorage.setItem(storageKey, value); } catch {} };
    window['ga-disable-' + measurementId] = readChoice() !== 'granted';
    const updateConsent = (granted) => {
      window['ga-disable-' + measurementId] = !granted;
      if (typeof window.gtag === 'function') window.gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    };
    const loadAnalytics = () => {
      updateConsent(true);
      if (loaded || document.querySelector('script[data-site-analytics]')) return;
      loaded = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      window.gtag('js', new Date());
      window.gtag('config', measurementId);
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
      script.dataset.siteAnalytics = 'true';
      document.head.append(script);
    };
    if (readChoice() === 'granted') loadAnalytics();
    document.addEventListener('DOMContentLoaded', () => {
      const banner = document.querySelector('[data-analytics-consent]');
      if (!banner) return;
      const show = () => { banner.hidden = false; banner.querySelector('[data-analytics-choice="granted"]')?.focus(); };
      const hide = () => { banner.hidden = true; };
      if (!['granted', 'denied'].includes(readChoice())) show();
      banner.querySelectorAll('[data-analytics-choice]').forEach((button) => button.addEventListener('click', () => {
        const choice = button.dataset.analyticsChoice;
        writeChoice(choice);
        if (choice === 'granted') loadAnalytics();
        else updateConsent(false);
        hide();
      }));
      const footer = document.querySelector('footer nav') || document.querySelector('footer');
      if (footer && !document.querySelector('[data-analytics-settings]')) {
        const settings = document.createElement('button');
        settings.type = 'button';
        settings.className = 'analytics-consent__settings';
        settings.dataset.analyticsSettings = '';
        settings.textContent = 'Preferencias de analítica';
        settings.addEventListener('click', show);
        footer.append(settings);
      }
    });
  })();
  </script>`;
  const banner = `<aside class="analytics-consent" data-analytics-consent aria-label="Preferencias de analítica" hidden><strong>Analítica opcional</strong><p>Google Analytics nos ayuda a entender qué herramientas se usan. No se carga hasta que aceptas.</p><div class="analytics-consent__actions"><button class="button" type="button" data-analytics-choice="granted">Aceptar analítica</button><button class="button button--quiet" type="button" data-analytics-choice="denied">Rechazar</button></div></aside>`;
  return html
    .replace('<head>', `<head>\n${head}`)
    .replace('</body>', `${banner}\n</body>`)
    .replace(/Esta versión no instala Google Analytics[^<]*/, `Google Analytics es opcional y solo se carga después de que aceptes. La medición usa el identificador ${measurementId}. Puedes cambiar tu elección desde «Preferencias de analítica» en el pie de página.`);
}
