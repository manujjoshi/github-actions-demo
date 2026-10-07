const { test, describe } = require('node:test');
const assert = require('node:assert');
const { evaluate } = require('./scientific.js');

const close = (actual, expected) => assert.ok(
  Math.abs(actual - expected) < 1e-9,
  `expected ${expected}, got ${actual}`
);

describe('Scientific evaluate()', () => {

  describe('arithmetic and precedence', () => {
    test('respects operator precedence', () => {
      assert.strictEqual(evaluate('2+3*4'), 14);
    });

    test('handles parentheses', () => {
      assert.strictEqual(evaluate('(2+3)*4'), 20);
    });

    test('powers are right-associative', () => {
      assert.strictEqual(evaluate('2^3^2'), 512);
    });

    test('unary minus binds looser than power', () => {
      assert.strictEqual(evaluate('-2^2'), -4);
      assert.strictEqual(evaluate('2^-1'), 0.5);
    });

    test('accepts UI symbols', () => {
      assert.strictEqual(evaluate('6×7−2÷4'), 41.5);
    });

    test('supports implicit multiplication', () => {
      close(evaluate('2π'), 2 * Math.PI);
      assert.strictEqual(evaluate('2(3+4)'), 14);
    });

    test('parses decimals and exponent notation', () => {
      assert.strictEqual(evaluate('.5+1.5'), 2);
      assert.strictEqual(evaluate('1e3'), 1000);
    });
  });

  describe('functions', () => {
    test('trig in degrees', () => {
      close(evaluate('sin(30)', { angle: 'deg' }), 0.5);
      assert.strictEqual(evaluate('cos(90)', { angle: 'deg' }), 0);
      close(evaluate('asin(1)', { angle: 'deg' }), 90);
    });

    test('trig in radians', () => {
      assert.strictEqual(evaluate('sin(π)'), 0);
      close(evaluate('cos(0)'), 1);
    });

    test('roots, logs and factorial', () => {
      assert.strictEqual(evaluate('√(16)'), 4);
      assert.strictEqual(evaluate('log(1000)'), 3);
      close(evaluate('ln(e)'), 1);
      assert.strictEqual(evaluate('5!'), 120);
      assert.strictEqual(evaluate('abs(-3)'), 3);
    });

    test('combines functions', () => {
      close(evaluate('2sin(30)+√(16)^2', { angle: 'deg' }), 17);
    });
  });

  describe('errors', () => {
    const cases = [
      ['1/0', 'Cannot divide by zero'],
      ['√(-1)', 'Cannot take square root of a negative number'],
      ['ln(0)', 'Logarithm needs a positive number'],
      ['3.5!', 'Factorial needs a non-negative whole number'],
      ['2+', 'Incomplete expression'],
      ['(1+2', 'Expected ")"'],
      ['foo(1)', 'Unknown name "foo"'],
      ['2 $ 3', 'Unexpected character "$"'],
      ['', 'Expression is required']
    ];
    for (const [expr, message] of cases) {
      test(`rejects "${expr}"`, () => {
        assert.throws(() => evaluate(expr), { message });
      });
    }

    test('rejects tan(90°)', () => {
      assert.throws(() => evaluate('tan(90)', { angle: 'deg' }), /undefined/);
    });

    test('rejects code injection attempts', () => {
      assert.throws(() => evaluate('process.exit(1)'));
      assert.throws(() => evaluate('constructor'), { message: 'Unknown name "constructor"' });
    });
  });

});
