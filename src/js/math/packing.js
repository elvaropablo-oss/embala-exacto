export function positive(value, label = 'El valor') {
  const number = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(number) || number <= 0) throw new Error(`${label} debe ser mayor que cero.`);
  return number;
}

export function nonNegative(value, label = 'El valor') {
  const number = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} no puede ser negativo.`);
  return number;
}

export function orientations(length, width, height) {
  const values = [positive(length, 'El largo'), positive(width, 'El ancho'), positive(height, 'El alto')];
  const raw = [
    [values[0], values[1], values[2]], [values[0], values[2], values[1]],
    [values[1], values[0], values[2]], [values[1], values[2], values[0]],
    [values[2], values[0], values[1]], [values[2], values[1], values[0]]
  ];
  return raw.filter((item, index) => raw.findIndex((other) => other.every((value, axis) => value === item[axis])) === index);
}

export function fitIdentical({ containerLength, containerWidth, containerHeight, itemLength, itemWidth, itemHeight, clearance = 0 }) {
  const container = [positive(containerLength, 'El largo interior'), positive(containerWidth, 'El ancho interior'), positive(containerHeight, 'El alto interior')];
  const gap = nonNegative(clearance, 'La holgura');
  const itemVolume = positive(itemLength, 'El largo del objeto') * positive(itemWidth, 'El ancho del objeto') * positive(itemHeight, 'El alto del objeto');
  const containerVolume = container.reduce((total, value) => total * value, 1);
  const options = orientations(itemLength, itemWidth, itemHeight).map((orientation) => {
    const pitch = orientation.map((value) => value + gap);
    const counts = container.map((value, axis) => Math.max(0, Math.floor((value + gap) / pitch[axis])));
    const total = counts.reduce((sum, value) => sum * value, 1);
    const occupied = orientation.map((value, axis) => counts[axis] ? counts[axis] * value + (counts[axis] - 1) * gap : 0);
    return {
      orientation, counts, total, occupied,
      remainder: container.map((value, axis) => value - occupied[axis]),
      utilization: total * itemVolume / containerVolume * 100
    };
  }).sort((a, b) => b.total - a.total || Math.max(...a.remainder) - Math.max(...b.remainder));
  return { best: options[0], options, containerVolume, itemVolume };
}

export function minimumBox({ itemLength, itemWidth, itemHeight, quantity, clearance = 0, padding = 0 }) {
  const qty = positive(quantity, 'La cantidad');
  if (!Number.isInteger(qty)) throw new Error('La cantidad debe ser un número entero.');
  if (qty > 1000) throw new Error('La cantidad máxima para este cálculo es 1.000.');
  const gap = nonNegative(clearance, 'La separación');
  const edge = nonNegative(padding, 'La protección exterior');
  const candidates = [];
  for (const orientation of orientations(itemLength, itemWidth, itemHeight)) {
    for (let x = 1; x <= qty; x += 1) {
      for (let y = 1; y <= Math.ceil(qty / x); y += 1) {
        const z = Math.ceil(qty / (x * y));
        const cells = x * y * z;
        const inner = [x, y, z].map((count, axis) => count * orientation[axis] + (count - 1) * gap + edge * 2);
        const volume = inner.reduce((total, value) => total * value, 1);
        const surface = 2 * (inner[0] * inner[1] + inner[0] * inner[2] + inner[1] * inner[2]);
        candidates.push({ orientation, counts: [x, y, z], cells, unused: cells - qty, inner, volume, surface });
      }
    }
  }
  candidates.sort((a, b) => a.volume - b.volume || a.unused - b.unused || a.surface - b.surface || Math.max(...a.inner) - Math.max(...b.inner));
  const unique = candidates.filter((candidate, index) => candidates.findIndex((other) => other.inner.every((value, axis) => Math.abs(value - candidate.inner[axis]) < 1e-9)) === index);
  return { quantity: qty, best: unique[0], alternatives: unique.slice(0, 6) };
}

export function dimensionalWeight({ length, width, height, actualWeight, quantity = 1, divisor = 5000, rounding = 0 }) {
  const dimensions = [positive(length, 'El largo'), positive(width, 'El ancho'), positive(height, 'El alto')];
  const actual = positive(actualWeight, 'El peso real');
  const qty = positive(quantity, 'La cantidad');
  if (!Number.isInteger(qty)) throw new Error('La cantidad debe ser un número entero.');
  const dimDivisor = positive(divisor, 'El divisor');
  const step = nonNegative(rounding, 'El redondeo');
  const volumeEach = dimensions.reduce((total, value) => total * value, 1);
  const dimensionalEach = volumeEach / dimDivisor;
  const rawChargeableEach = Math.max(actual, dimensionalEach);
  const chargeableEach = step ? Math.ceil((rawChargeableEach - Number.EPSILON) / step) * step : rawChargeableEach;
  return {
    volumeEach, dimensionalEach, actualEach: actual, chargeableEach, quantity: qty,
    totalActual: actual * qty, totalDimensional: dimensionalEach * qty, totalChargeable: chargeableEach * qty,
    basis: dimensionalEach > actual ? 'volumétrico' : 'real'
  };
}
