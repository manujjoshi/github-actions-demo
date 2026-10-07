/**
 * Scientific expression evaluator
 * Parses expressions like "2sin(30) + √(16)^2 - 5!" without using eval
 *
 * Grammar (lowest to highest precedence):
 *   expr    := term (('+' | '-') term)*
 *   term    := unary (('*' | '/') unary | implicit-multiply)*
 *   unary   := ('+' | '-') unary | power
 *   power   := postfix ('^' unary)?        right-associative, so 2^3^2 = 2^9
 *   postfix := primary '!'*
 *   primary := number | constant | function '(' expr ')' | '(' expr ')'
 */

// Normalize the symbols the UI uses to plain ASCII operators
const SYMBOL_MAP = { '×': '*', '÷': '/', '−': '-', '√': 'sqrt', 'π': 'pi' };

const CONSTANTS = { pi: Math.PI, e: Math.E };

// Removes floating point noise such as sin(π) = 1.22e-16
function clean(value) {
  return Math.abs(value) < 1e-12 ? 0 : value;
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('Factorial needs a non-negative whole number');
  }
  if (n > 170) {
    throw new Error('Factorial is too large');
  }
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function makeFunctions(angle) {
  const toRad = x => (angle === 'deg' ? (x * Math.PI) / 180 : x);
  const fromRad = x => (angle === 'deg' ? (x * 180) / Math.PI : x);

  return {
    sin: x => clean(Math.sin(toRad(x))),
    cos: x => clean(Math.cos(toRad(x))),
    tan: x => {
      if (angle === 'deg' && Math.abs(x % 180) === 90) {
        throw new Error('tan is undefined at this angle');
      }
      return clean(Math.tan(toRad(x)));
    },
    asin: x => fromRad(Math.asin(x)),
    acos: x => fromRad(Math.acos(x)),
    atan: x => fromRad(Math.atan(x)),
    sinh: Math.sinh,
    cosh: Math.cosh,
    tanh: Math.tanh,
    sqrt: x => {
      if (x < 0) throw new Error('Cannot take square root of a negative number');
      return Math.sqrt(x);
    },
    cbrt: Math.cbrt,
    ln: x => {
      if (x <= 0) throw new Error('Logarithm needs a positive number');
      return Math.log(x);
    },
    log: x => {
      if (x <= 0) throw new Error('Logarithm needs a positive number');
      return Math.log10(x);
    },
    exp: Math.exp,
    abs: Math.abs,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round
  };
}

function tokenize(input) {
  let text = input;
  for (const [symbol, replacement] of Object.entries(SYMBOL_MAP)) {
    text = text.split(symbol).join(replacement);
  }

  const tokens = [];
  const pattern = /\s*(?:(\d+\.?\d*(?:e[+-]?\d+)?|\.\d+(?:e[+-]?\d+)?)|([a-z]+)|([+\-*/^!()]))/gy;
  let match;
  let index = 0;

  while (index < text.length) {
    pattern.lastIndex = index;
    match = pattern.exec(text);
    if (!match) {
      if (/^\s*$/.test(text.slice(index))) break;
      throw new Error(`Unexpected character "${text.slice(index).trim()[0]}"`);
    }
    if (match[1] !== undefined) tokens.push({ type: 'number', value: parseFloat(match[1]) });
    else if (match[2] !== undefined) tokens.push({ type: 'name', value: match[2] });
    else tokens.push({ type: 'op', value: match[3] });
    index = pattern.lastIndex;
  }

  return tokens;
}

function evaluate(input, { angle = 'rad' } = {}) {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new Error('Expression is required');
  }
  if (angle !== 'rad' && angle !== 'deg') {
    throw new Error('Angle must be "deg" or "rad"');
  }

  const functions = makeFunctions(angle);
  const tokens = tokenize(input.toLowerCase());
  let pos = 0;

  const peek = () => tokens[pos];
  const isOp = value => peek() && peek().type === 'op' && peek().value === value;

  function expect(value) {
    if (!isOp(value)) throw new Error(`Expected "${value}"`);
    pos++;
  }

  function parseExpr() {
    let value = parseTerm();
    while (isOp('+') || isOp('-')) {
      const op = tokens[pos++].value;
      const right = parseTerm();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  }

  function parseTerm() {
    let value = parseUnary();
    for (;;) {
      if (isOp('*')) {
        pos++;
        value *= parseUnary();
      } else if (isOp('/')) {
        pos++;
        const right = parseUnary();
        if (right === 0) throw new Error('Cannot divide by zero');
        value /= right;
      } else if (isOp('(') || (peek() && peek().type === 'name')) {
        // Implicit multiplication: 2π, 3sin(30), 2(1+1)
        value *= parseUnary();
      } else {
        return value;
      }
    }
  }

  function parseUnary() {
    if (isOp('-')) {
      pos++;
      return -parseUnary();
    }
    if (isOp('+')) {
      pos++;
      return parseUnary();
    }
    return parsePower();
  }

  function parsePower() {
    const base = parsePostfix();
    if (isOp('^')) {
      pos++;
      return Math.pow(base, parseUnary());
    }
    return base;
  }

  function parsePostfix() {
    let value = parsePrimary();
    while (isOp('!')) {
      pos++;
      value = factorial(value);
    }
    return value;
  }

  function parsePrimary() {
    const token = peek();
    if (!token) throw new Error('Incomplete expression');

    if (token.type === 'number') {
      pos++;
      return token.value;
    }

    if (token.type === 'name') {
      pos++;
      if (Object.hasOwn(CONSTANTS, token.value)) return CONSTANTS[token.value];
      if (Object.hasOwn(functions, token.value)) {
        expect('(');
        const arg = parseExpr();
        expect(')');
        return functions[token.value](arg);
      }
      throw new Error(`Unknown name "${token.value}"`);
    }

    if (isOp('(')) {
      pos++;
      const value = parseExpr();
      expect(')');
      return value;
    }

    throw new Error(`Unexpected "${token.value}"`);
  }

  const result = parseExpr();
  if (pos < tokens.length) {
    throw new Error(`Unexpected "${tokens[pos].value}"`);
  }
  if (!Number.isFinite(result)) {
    throw new Error('Result is undefined');
  }
  return result;
}

module.exports = { evaluate };
