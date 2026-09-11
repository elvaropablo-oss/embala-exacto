import { dimensionalWeight, fitIdentical, minimumBox } from './math/packing.js';

const control = (form, name) => form.elements.namedItem(name);
const read = (form, name) => control(form, name).value;
const fmt = (value, digits = 2) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value);
const dims = (values) => values.map((value) => fmt(value)).join(' × ');
const show = (element, html) => { element.innerHTML = html; element.hidden = false; element.focus(); };
const fail = (form, reason) => {
  const error = form.querySelector('[data-error]');
  error.textContent = reason.message;
  error.hidden = false;
  error.focus();
};
const clearError = (form) => { const error = form.querySelector('[data-error]'); if (error) error.hidden = true; };
const save = (value) => { try { localStorage.setItem('ee:v1:last-result', JSON.stringify(value)); } catch {} };

document.querySelector('#fit-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  clearError(form);
  try {
    const result = fitIdentical(Object.fromEntries(['containerLength', 'containerWidth', 'containerHeight', 'itemLength', 'itemWidth', 'itemHeight', 'clearance'].map((name) => [name, read(form, name)])));
    const best = result.best;
    const alternatives = result.options.filter((option, index) => index === 0 || option.total !== best.total || dims(option.orientation) !== dims(best.orientation)).slice(0, 6);
    const query = new URLSearchParams({ l: read(form, 'containerLength'), w: read(form, 'containerWidth'), h: read(form, 'containerHeight'), q: '1' });
    show(document.querySelector('#fit-result'), `<p class="eyebrow">Mejor retícula recta</p><h2>${best.total} ${best.total === 1 ? 'pieza' : 'piezas'}</h2><div class="axis-grid"><span><strong>${best.counts[0]}</strong> a lo largo</span><span><strong>${best.counts[1]}</strong> a lo ancho</span><span><strong>${best.counts[2]}</strong> en altura</span></div><p>Coloca cada pieza como <strong>${dims(best.orientation)} cm</strong>. Se ocupa el ${fmt(best.utilization, 1)} % del volumen interior.</p><p class="note">Espacio restante por eje: ${dims(best.remainder)} cm.</p><details><summary>Comparar orientaciones</summary><div class="table-wrap"><table><thead><tr><th>Orientación</th><th>Retícula</th><th>Total</th></tr></thead><tbody>${alternatives.map((option) => `<tr><td>${dims(option.orientation)}</td><td>${option.counts.join(' × ')}</td><td>${option.total}</td></tr>`).join('')}</tbody></table></div></details><a class="button" href="../peso-volumetrico/?${query}">Calcular peso volumétrico de esta caja</a>`);
    save({ type: 'fit', ...best, savedAt: new Date().toISOString() });
  } catch (reason) { fail(form, reason); }
});

document.querySelector('#minimum-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  clearError(form);
  try {
    const result = minimumBox(Object.fromEntries(['itemLength', 'itemWidth', 'itemHeight', 'quantity', 'clearance', 'padding'].map((name) => [name, read(form, name)])));
    const best = result.best;
    const query = new URLSearchParams({ l: best.inner[0], w: best.inner[1], h: best.inner[2], q: '1' });
    show(document.querySelector('#minimum-result'), `<p class="eyebrow">Menor volumen encontrado</p><h2>${dims(best.inner)} cm interiores</h2><div class="axis-grid"><span><strong>${best.counts[0]}</strong> a lo largo</span><span><strong>${best.counts[1]}</strong> a lo ancho</span><span><strong>${best.counts[2]}</strong> en altura</span></div><p>Orientación de cada pieza: <strong>${dims(best.orientation)} cm</strong>. La retícula tiene ${best.cells} huecos para ${result.quantity} objetos.</p><details><summary>Ver alternativas compactas</summary><div class="table-wrap"><table><thead><tr><th>Interior</th><th>Retícula</th><th>Huecos libres</th></tr></thead><tbody>${result.alternatives.map((option) => `<tr><td>${dims(option.inner)}</td><td>${option.counts.join(' × ')}</td><td>${option.unused}</td></tr>`).join('')}</tbody></table></div></details><a class="button" href="../peso-volumetrico/?${query}">Estimar peso; revisar exteriores</a><p class="note">Suma grosor del cartón y tolerancias antes de usar estas medidas como exteriores.</p>`);
    save({ type: 'minimum', ...best, quantity: result.quantity, savedAt: new Date().toISOString() });
  } catch (reason) { fail(form, reason); }
});

const weightForm = document.querySelector('#weight-form');
if (weightForm) {
  const params = new URLSearchParams(location.search);
  if (params.has('l')) control(weightForm, 'length').value = params.get('l');
  if (params.has('w')) control(weightForm, 'width').value = params.get('w');
  if (params.has('h')) control(weightForm, 'height').value = params.get('h');
  if (params.has('q')) control(weightForm, 'quantity').value = params.get('q');
  weightForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearError(weightForm);
    try {
      const divisor = weightForm.elements.divisor.value === 'custom' ? read(weightForm, 'customDivisor') : read(weightForm, 'divisor');
      const result = dimensionalWeight({
        length: read(weightForm, 'length'), width: read(weightForm, 'width'), height: read(weightForm, 'height'),
        actualWeight: read(weightForm, 'actualWeight'), quantity: read(weightForm, 'quantity'), divisor,
        rounding: read(weightForm, 'rounding')
      });
      show(document.querySelector('#weight-result'), `<p class="eyebrow">Peso facturable estimado</p><h2>${fmt(result.totalChargeable, 3)} kg en total</h2><div class="metric-grid"><span>Peso real<strong>${fmt(result.totalActual, 3)} kg</strong></span><span>Peso volumétrico<strong>${fmt(result.totalDimensional, 3)} kg</strong></span><span>Por bulto facturable<strong>${fmt(result.chargeableEach, 3)} kg</strong></span></div><p>En este cálculo domina el peso <strong>${result.basis}</strong>. Volumen por bulto: ${fmt(result.volumeEach / 1000, 3)} litros.</p><p class="note">Estimación matemática: confirma divisor, redondeo y reglas con el servicio concreto.</p>`);
      save({ type: 'weight', ...result, divisor: Number(divisor), savedAt: new Date().toISOString() });
    } catch (reason) { fail(weightForm, reason); }
  });
}
