const { test, describe } = require('node:test');
const assert = require('node:assert');
const { convert } = require('./converter.js');

const close = (actual, expected) => assert.ok(
  Math.abs(actual - expected) < 1e-9,
  `expected ${expected}, got ${actual}`
);

describe('Unit converter', () => {

  test('converts length', () => {
    close(convert(1, 'km', 'm'), 1000);
    close(convert(1, 'mi', 'km'), 1.609344);
    close(convert(12, 'in', 'ft'), 1);
  });

  test('converts weight', () => {
    close(convert(1, 'kg', 'lb'), 2.2046226218);
    close(convert(16, 'oz', 'lb'), 1);
  });

  test('converts temperature', () => {
    close(convert(100, 'c', 'f'), 212);
    close(convert(32, 'f', 'c'), 0);
    close(convert(0, 'k', 'c'), -273.15);
    close(convert(-40, 'c', 'f'), -40);
  });

  test('same unit returns the same value', () => {
    close(convert(5, 'm', 'm'), 5);
  });

  test('rejects mixed categories', () => {
    assert.throws(() => convert(1, 'km', 'kg'), { message: 'Cannot convert length to weight' });
  });

  test('rejects unknown units', () => {
    assert.throws(() => convert(1, 'parsec', 'm'), { message: 'Unknown unit "parsec"' });
    assert.throws(() => convert(1, 'm', 'constructor'), { message: 'Unknown unit "constructor"' });
  });

  test('rejects temperatures below absolute zero', () => {
    assert.throws(() => convert(-300, 'c', 'k'), { message: 'Temperature is below absolute zero' });
  });

  test('rejects non-numbers', () => {
    assert.throws(() => convert(NaN, 'm', 'km'), { message: 'Value must be a number' });
  });

});
