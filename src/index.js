/**
 * Simple Calculator API
 * Demo project for GitHub Actions tutorial
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { evaluate } = require('./scientific');
const { convert, UNITS } = require('./converter');

// Web pages, keyed by URL path
const readPage = name => fs.readFileSync(path.join(__dirname, 'public', name));
const pages = {
  '/': readPage('home.html'),
  '/basic': readPage('basic.html'),
  '/scientific': readPage('scientific.html'),
  '/converter': readPage('converter.html')
};
const notFoundHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page not found</title>
  <style>
    body { font-family: system-ui, sans-serif; text-align: center; padding: 64px 16px; }
    a { color: #2563eb; margin: 0 8px; font-size: 18px; }
    @media (prefers-color-scheme: dark) {
      body { background: #0f1115; color: #f3f4f6; }
      a { color: #60a5fa; }
    }
  </style>
</head>
<body>
  <h1>Page not found</h1>
  <p>
    <a href="/">Home</a>
    <a href="/basic">Basic</a>
    <a href="/scientific">Scientific</a>
    <a href="/converter">Unit converter</a>
  </p>
</body>
</html>`;

// Calculator functions
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  if (b === 0) {
    throw new Error('Cannot divide by zero');
  }
  return a / b;
}

// Simple HTTP server
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  res.setHeader('Content-Type', 'application/json');

  if (Object.hasOwn(pages, url.pathname)) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(pages[url.pathname]);
    return;
  }

  // Unit conversion: /convert?value=5&from=km&to=mi
  if (url.pathname === '/convert') {
    try {
      const value = url.searchParams.get('value');
      const result = convert(value === null || value.trim() === '' ? NaN : Number(value),
        url.searchParams.get('from'), url.searchParams.get('to'));
      res.statusCode = 200;
      res.end(JSON.stringify({ result }));
    } catch (error) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (url.pathname === '/units') {
    res.statusCode = 200;
    res.end(JSON.stringify(UNITS));
    return;
  }

  // Scientific expressions: /evaluate?expr=2sin(30)&angle=deg
  if (url.pathname === '/evaluate') {
    try {
      const result = evaluate(url.searchParams.get('expr') || '', {
        angle: url.searchParams.get('angle') || 'rad'
      });
      res.statusCode = 200;
      res.end(JSON.stringify({ result }));
    } catch (error) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (url.pathname === '/api') {
    res.statusCode = 200;
    res.end(JSON.stringify({
      message: 'Calculator API',
      version: '1.3.0',
      endpoints: ['/add', '/subtract', '/multiply', '/divide', '/evaluate', '/convert', '/units']
    }));
    return;
  }

  if (url.pathname === '/health') {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'healthy' }));
    return;
  }

  const operations = { '/add': add, '/subtract': subtract, '/multiply': multiply, '/divide': divide };
  const operation = operations[url.pathname];

  // Unknown address: show a page with links back to the app
  if (!operation) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(notFoundHtml);
    return;
  }

  const a = parseFloat(url.searchParams.get('a'));
  const b = parseFloat(url.searchParams.get('b'));

  if (isNaN(a) || isNaN(b)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Parameters a and b are required' }));
    return;
  }

  try {
    const result = operation(a, b);
    res.statusCode = 200;
    res.end(JSON.stringify({ result }));
  } catch (error) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: error.message }));
  }
});

const PORT = process.env.PORT || 3000;

// Only start server if this file is run directly
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for testing
module.exports = { add, subtract, multiply, divide, server };
