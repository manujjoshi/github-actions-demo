/**
 * Unit converter
 * Length and weight convert through a base unit (metre, kilogram);
 * temperature uses formulas because its scales have different zero points.
 */

const UNITS = {
  length: {
    label: 'Length',
    units: {
      mm: { label: 'Millimetre', factor: 0.001 },
      cm: { label: 'Centimetre', factor: 0.01 },
      m: { label: 'Metre', factor: 1 },
      km: { label: 'Kilometre', factor: 1000 },
      in: { label: 'Inch', factor: 0.0254 },
      ft: { label: 'Foot', factor: 0.3048 },
      yd: { label: 'Yard', factor: 0.9144 },
      mi: { label: 'Mile', factor: 1609.344 }
    }
  },
  weight: {
    label: 'Weight',
    units: {
      mg: { label: 'Milligram', factor: 0.000001 },
      g: { label: 'Gram', factor: 0.001 },
      kg: { label: 'Kilogram', factor: 1 },
      t: { label: 'Tonne', factor: 1000 },
      oz: { label: 'Ounce', factor: 0.028349523125 },
      lb: { label: 'Pound', factor: 0.45359237 }
    }
  },
  temperature: {
    label: 'Temperature',
    units: {
      c: { label: 'Celsius' },
      f: { label: 'Fahrenheit' },
      k: { label: 'Kelvin' }
    }
  }
};

const toKelvin = { c: v => v + 273.15, f: v => ((v - 32) * 5) / 9 + 273.15, k: v => v };
const fromKelvin = { c: v => v - 273.15, f: v => ((v - 273.15) * 9) / 5 + 32, k: v => v };

function findCategory(unit) {
  return Object.keys(UNITS).find(name => Object.hasOwn(UNITS[name].units, unit));
}

function convert(value, from, to) {
  if (!Number.isFinite(value)) throw new Error('Value must be a number');

  const category = findCategory(from);
  if (!category) throw new Error(`Unknown unit "${from}"`);
  if (!findCategory(to)) throw new Error(`Unknown unit "${to}"`);
  if (findCategory(to) !== category) {
    throw new Error(`Cannot convert ${UNITS[category].label.toLowerCase()} to ${UNITS[findCategory(to)].label.toLowerCase()}`);
  }

  if (category === 'temperature') {
    const kelvin = toKelvin[from](value);
    if (kelvin < 0) throw new Error('Temperature is below absolute zero');
    return fromKelvin[to](kelvin);
  }

  const { units } = UNITS[category];
  return (value * units[from].factor) / units[to].factor;
}

module.exports = { convert, UNITS };
