export function applyShareableCalculations(html, formIds) {
  const allowed = JSON.stringify(formIds).replace(/</g, '\\u003c');
  const script = `  <script data-shareable-calculations>
(() => {
  const allowed = new Set(${allowed});
  const param = 'calc';
  const rowSelector = '.ingredient-row,.baker-row';
  const eligible = (form) => form instanceof HTMLFormElement && allowed.has(form.id);
  const rowsIn = (container) => [...container.children].filter((element) => element.matches?.(rowSelector));
  const rowPosition = (row) => row?.parentElement ? rowsIn(row.parentElement).indexOf(row) : -1;
  const plainOccurrence = (form, element) => [...form.elements]
    .filter((candidate) => candidate.name === element.name && !candidate.closest(rowSelector))
    .indexOf(element);
  const encode = (form) => ({
    v: 1,
    f: form.id,
    x: [...form.elements]
      .filter((element) => element.name && !['button', 'submit', 'reset', 'file'].includes(element.type) && !element.disabled)
      .map((element) => {
        const row = element.closest(rowSelector);
        const group = row?.parentElement?.id || '';
        return [element.name, element.value, element.type || element.tagName.toLowerCase(), element.checked ? 1 : 0, group, row ? rowPosition(row) : -1, group ? -1 : plainOccurrence(form, element)];
      })
  });
  const ensureRows = (form, fields) => {
    const needs = new Map();
    for (const field of fields) {
      const group = field[4];
      const index = field[5];
      if (group && index >= 0) needs.set(group, Math.max(needs.get(group) ?? -1, index));
    }
    for (const [groupId, maxIndex] of needs) {
      const group = document.getElementById(groupId);
      if (!group || !form.contains(group)) continue;
      let rows = rowsIn(group);
      while (rows.length <= maxIndex && rows.length) {
        const clone = rows.at(-1).cloneNode(true);
        clone.querySelectorAll('input,select,textarea').forEach((element) => {
          if (element.type === 'checkbox' || element.type === 'radio') element.checked = false;
          else element.value = '';
        });
        clone.querySelectorAll('.remove-row').forEach((button) => button.addEventListener('click', () => clone.remove()));
        group.append(clone);
        rows = rowsIn(group);
      }
    }
  };
  const locate = (form, field) => {
    const [name, , , , groupId, rowIndex, occurrence] = field;
    if (groupId) {
      const group = document.getElementById(groupId);
      if (!group || !form.contains(group)) return null;
      const row = rowsIn(group)[rowIndex];
      return row ? [...row.querySelectorAll('[name]')].find((element) => element.name === name) || null : null;
    }
    return [...form.elements].filter((element) => element.name === name && !element.closest(rowSelector))[occurrence] || null;
  };
  const writeUrl = (form) => {
    const url = new URL(location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set(param, JSON.stringify(encode(form)));
    history.replaceState(null, '', url);
  };
  const copyButton = (form) => {
    const resultId = form.id.replace(/-form$/, '-result');
    const result = document.getElementById(resultId);
    if (!result || result.hidden || result.querySelector('[data-copy-calc-link]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button button--quiet';
    button.dataset.copyCalcLink = '';
    button.textContent = 'Copiar enlace a este cálculo';
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(location.href);
      } catch {
        const field = document.createElement('textarea');
        field.value = location.href;
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.append(field);
        field.select();
        document.execCommand('copy');
        field.remove();
      }
      button.textContent = 'Enlace copiado';
      setTimeout(() => { button.textContent = 'Copiar enlace a este cálculo'; }, 1800);
    });
    result.append(button);
  };
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!eligible(form)) return;
    writeUrl(form);
    setTimeout(() => copyButton(form), 0);
  }, true);
  window.addEventListener('load', () => {
    const raw = new URL(location.href).searchParams.get(param);
    if (!raw) return;
    let state;
    try { state = JSON.parse(raw); } catch { return; }
    if (state?.v !== 1 || !allowed.has(state.f) || !Array.isArray(state.x)) return;
    const form = document.getElementById(state.f);
    if (!eligible(form)) return;
    ensureRows(form, state.x);
    const touched = [];
    for (const field of state.x) {
      const element = locate(form, field);
      if (!element) continue;
      if (field[2] === 'checkbox' || field[2] === 'radio') element.checked = field[3] === 1;
      else element.value = field[1];
      touched.push(element);
    }
    touched.forEach((element) => {
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    });
    setTimeout(() => form.requestSubmit(), 0);
  });
})();
  </script>`;
  return html.replace('</body>', `${script}\n</body>`);
}
