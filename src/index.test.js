const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { add, subtract, multiply, divide, server } = require('./index.js');

describe('Calculator Functions', () => {

  describe('add()', () => {
    test('adds two positive numbers', () => {
      assert.strictEqual(add(2, 3), 5);
    });

    test('adds negative numbers', () => {
      assert.strictEqual(add(-1, -1), -2);
    });

    test('adds zero', () => {
      assert.strictEqual(add(5, 0), 5);
    });
  });

  describe('subtract()', () => {
    test('subtracts two numbers', () => {
      assert.strictEqual(subtract(5, 3), 2);
    });

    test('returns negative when result is negative', () => {
      assert.strictEqual(subtract(3, 5), -2);
    });
  });

  describe('multiply()', () => {
    test('multiplies two numbers', () => {
      assert.strictEqual(multiply(4, 3), 12);
    });

    test('multiplies by zero', () => {
      assert.strictEqual(multiply(5, 0), 0);
    });

    test('multiplies negative numbers', () => {
      assert.strictEqual(multiply(-2, 3), -6);
    });
  });

  describe('divide()', () => {
    test('divides two numbers', () => {
      assert.strictEqual(divide(10, 2), 5);
    });

    test('returns decimal result', () => {
      assert.strictEqual(divide(7, 2), 3.5);
    });

    test('throws error when dividing by zero', () => {
      assert.throws(
        () => divide(10, 0),
        { message: 'Cannot divide by zero' }
      );
    });
  });

});

describe('Edge Cases', () => {
  test('handles large numbers', () => {
    assert.strictEqual(add(1000000, 2000000), 3000000);
  });

  test('handles decimal numbers', () => {
    assert.strictEqual(add(0.1, 0.2).toFixed(1), '0.3');
  });
});

describe('HTTP server', () => {
  let baseUrl;

  before(async () => {
    await new Promise(resolve => server.listen(0, resolve));
    baseUrl = `http://localhost:${server.address().port}`;
  });

  after(() => server.close());

  test('serves the calculator page at /', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    assert.match(await res.text(), /<title>Calculator<\/title>/);
  });

  test('computes via the API', async () => {
    const res = await fetch(`${baseUrl}/multiply?a=6&b=7`);
    assert.deepStrictEqual(await res.json(), { result: 42 });
  });

  test('serves the scientific calculator page', async () => {
    const res = await fetch(`${baseUrl}/scientific`);
    assert.strictEqual(res.status, 200);
    assert.match(await res.text(), /<title>Scientific Calculator<\/title>/);
  });

  test('evaluates scientific expressions', async () => {
    const expr = encodeURIComponent('2sin(30)+√(16)');
    const res = await fetch(`${baseUrl}/evaluate?expr=${expr}&angle=deg`);
    assert.deepStrictEqual(await res.json(), { result: 5 });
  });

  test('returns 400 for invalid expressions', async () => {
    const res = await fetch(`${baseUrl}/evaluate?expr=2%2B`);
    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(await res.json(), { error: 'Incomplete expression' });
  });

  test('both pages link to each other', async () => {
    for (const page of ['/', '/scientific']) {
      const html = await (await fetch(`${baseUrl}${page}`)).text();
      assert.match(html, /<a href="\/"/, `${page} links to basic`);
      assert.match(html, /<a href="\/scientific"/, `${page} links to scientific`);
    }
  });

  test('unknown pages return 404 with links back', async () => {
    const res = await fetch(`${baseUrl}/no-such-page`);
    assert.strictEqual(res.status, 404);
    const html = await res.text();
    assert.match(html, /Page not found/);
    assert.match(html, /href="\/scientific"/);
  });

  test('returns 400 when dividing by zero', async () => {
    const res = await fetch(`${baseUrl}/divide?a=1&b=0`);
    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(await res.json(), { error: 'Cannot divide by zero' });
  });
});
