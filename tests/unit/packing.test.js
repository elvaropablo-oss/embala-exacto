import test from 'node:test';
import assert from 'node:assert/strict';
import { dimensionalWeight, fitIdentical, minimumBox, orientations } from '../../src/js/math/packing.js';

test('elimina orientaciones duplicadas cuando hay lados iguales', () => {
  assert.equal(orientations(10, 10, 20).length, 3);
  assert.equal(orientations(10, 10, 10).length, 1);
});

test('elige la orientación que admite más cajas', () => {
  const result = fitIdentical({ containerLength: 60, containerWidth: 40, containerHeight: 30, itemLength: 20, itemWidth: 15, itemHeight: 10 });
  assert.equal(result.best.total, 24);
});

test('aplica la holgura entre piezas sin sumarla en el borde final', () => {
  const result = fitIdentical({ containerLength: 32, containerWidth: 10, containerHeight: 10, itemLength: 10, itemWidth: 10, itemHeight: 10, clearance: 1 });
  assert.equal(result.best.total, 3);
  assert.equal(result.best.occupied[0], 32);
});

test('calcula una caja compacta para una cantidad exacta', () => {
  const result = minimumBox({ itemLength: 10, itemWidth: 10, itemHeight: 10, quantity: 12 });
  assert.equal(result.best.cells, 12);
  assert.deepEqual([...result.best.inner].sort((a, b) => a - b), [20, 20, 30]);
});

test('añade protección a ambos lados de cada eje', () => {
  const result = minimumBox({ itemLength: 20, itemWidth: 10, itemHeight: 5, quantity: 1, padding: 2 });
  assert.deepEqual([...result.best.inner].sort((a, b) => a - b), [9, 14, 24]);
});

test('calcula peso volumétrico y selecciona la base mayor', () => {
  const result = dimensionalWeight({ length: 40, width: 30, height: 20, actualWeight: 3, quantity: 2, divisor: 5000 });
  assert.equal(result.dimensionalEach, 4.8);
  assert.equal(result.totalChargeable, 9.6);
  assert.equal(result.basis, 'volumétrico');
});

test('redondea cada bulto al incremento indicado', () => {
  const result = dimensionalWeight({ length: 40, width: 30, height: 20, actualWeight: 3, quantity: 2, divisor: 5000, rounding: 1 });
  assert.equal(result.chargeableEach, 5);
  assert.equal(result.totalChargeable, 10);
});

test('rechaza cantidades fraccionarias', () => {
  assert.throws(() => minimumBox({ itemLength: 10, itemWidth: 10, itemHeight: 10, quantity: 2.5 }), /entero/);
  assert.throws(() => dimensionalWeight({ length: 10, width: 10, height: 10, actualWeight: 1, quantity: 1.2 }), /entero/);
});
