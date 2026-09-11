export function applyCalculationExplanations(html, specs) {
  const safeSpecs = JSON.stringify(specs).replace(/</g, '\\u003c');
  const style = `  <style data-calculation-explanations>
.calculation-explanation{margin-top:1rem;padding:.85rem 1rem;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:.75rem;background:color-mix(in srgb,currentColor 4%,transparent);text-align:left}.calculation-explanation summary{cursor:pointer;font-weight:700}.calculation-explanation p{margin:.65rem 0}.calculation-explanation dl{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.35rem .9rem;margin:.65rem 0}.calculation-explanation dt{font-weight:600}.calculation-explanation dd{margin:0;text-align:right}.calculation-explanation code{white-space:normal;overflow-wrap:anywhere}
  </style>`;
  const script = `  <script data-calculation-explanations>
(() => {
  const specs = ${safeSpecs};
  const controls = (form, name) => [...form.elements].filter((element) => element.name === name && !element.disabled);
  const rawValue = (form, name) => {
    const items = controls(form, name);
    if (!items.length) return '';
    if (items[0].type === 'radio') return items.find((item) => item.checked)?.value || '';
    if (items[0].type === 'checkbox') return items.length === 1 ? (items[0].checked ? 'Sí' : 'No') : items.filter((item) => item.checked).map((item) => item.value).join(', ');
    return items.map((item) => item.value).filter((value) => value !== '').join(' · ');
  };
  const displayValue = (form, field) => {
    const [name, , unit = ''] = field;
    const value = rawValue(form, name);
    return value === '' ? '' : `${value}${unit ? ` ${unit}` : ''}`;
  };
  const render = (form) => {
    const spec = specs[form.id];
    if (!spec) return;
    const result = document.getElementById(spec.resultId || form.id.replace(/-form$/, '-result'));
    if (!result || result.hidden) return;
    const error = form.querySelector('[data-error]');
    if (error && !error.hidden && error.textContent.trim()) return;
    result.querySelector('[data-calculation-explanation]')?.remove();
    let formula = spec.formula || '';
    if (spec.formulaSwitch) {
      const selected = rawValue(form, spec.formulaSwitch.field);
      formula = spec.formulaSwitch.values?.[selected] || formula;
    }
    const details = document.createElement('details');
    details.className = 'calculation-explanation';
    details.dataset.calculationExplanation = '';
    const summary = document.createElement('summary');
    summary.textContent = '¿Cómo sale este resultado?';
    details.append(summary);
    if (formula) {
      const paragraph = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = 'Fórmula base: ';
      const code = document.createElement('code');
      code.textContent = formula;
      paragraph.append(strong, code);
      details.append(paragraph);
    }
    const rows = (spec.fields || []).map((field) => [field[1], displayValue(form, field)]).filter(([, value]) => value !== '');
    if (rows.length) {
      const lead = document.createElement('p');
      lead.innerHTML = '<strong>Valores usados en este cálculo:</strong>';
      details.append(lead);
      const dl = document.createElement('dl');
      for (const [label, value] of rows) {
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = label;
        dd.textContent = value;
        dl.append(dt, dd);
      }
      details.append(dl);
    }
    if (spec.note) {
      const note = document.createElement('p');
      note.textContent = spec.note;
      details.append(note);
    }
    result.append(details);
  };
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !specs[form.id]) return;
    setTimeout(() => render(form), 0);
  }, true);
})();
  </script>`;
  return html.replace('</head>', `${style}\n</head>`).replace('</body>', `${script}\n</body>`);
}
