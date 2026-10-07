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

  test('serves each page with its title', async () => {
    const titles = {
      '/': 'Calculators',
      '/basic': 'Calculator',
      '/scientific': 'Scientific Calculator',
      '/converter': 'Unit Converter'
    };
    for (const [page, title] of Object.entries(titles)) {
      const res = await fetch(`${baseUrl}${page}`);
      assert.strictEqual(res.status, 200, page);
      assert.match(res.headers.get('content-type'), /text\/html/);
      assert.ok((await res.text()).includes(`<title>${title}</title>`), page);
    }
  });

  test('home page links to all three tools', async () => {
    const html = await (await fetch(`${baseUrl}/`)).text();
    for (const link of ['/basic', '/scientific', '/converter']) {
      assert.ok(html.includes(`href="${link}"`), link);
    }
  });

  test('computes via the API', async () => {
    const res = await fetch(`${baseUrl}/multiply?a=6&b=7`);
    assert.deepStrictEqual(await res.json(), { result: 42 });
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

  test('every tool links home and to the other tools', async () => {
    for (const page of ['/basic', '/scientific', '/converter']) {
      const html = await (await fetch(`${baseUrl}${page}`)).text();
      for (const link of ['/', '/basic', '/scientific', '/converter']) {
        assert.ok(html.includes(`href="${link}"`), `${page} links to ${link}`);
      }
    }
  });

  test('converts units', async () => {
    const res = await fetch(`${baseUrl}/convert?value=100&from=c&to=f`);
    assert.deepStrictEqual(await res.json(), { result: 212 });
  });

  test('returns 400 for invalid conversions', async () => {
    for (const query of ['value=1&from=km&to=kg', 'value=&from=km&to=mi', 'value=abc&from=km&to=mi']) {
      const res = await fetch(`${baseUrl}/convert?${query}`);
      assert.strictEqual(res.status, 400, query);
    }
  });

  test('lists units', async () => {
    const units = await (await fetch(`${baseUrl}/units`)).json();
    assert.deepStrictEqual(Object.keys(units), ['length', 'weight', 'temperature']);
  });

  test('unknown pages return 404 with links back', async () => {
    const res = await fetch(`${baseUrl}/no-such-page`);
    assert.strictEqual(res.status, 404);
    const html = await res.text();
    assert.match(html, /Page not found/);
    for (const link of ['/', '/basic', '/scientific', '/converter']) {
      assert.ok(html.includes(`href="${link}"`), link);
    }
  });

  test('returns 400 when dividing by zero', async () => {
    const res = await fetch(`${baseUrl}/divide?a=1&b=0`);
    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(await res.json(), { error: 'Cannot divide by zero' });
  });
});
