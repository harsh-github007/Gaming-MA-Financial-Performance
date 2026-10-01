import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {annualCSV} from '../assets/export.js';
import {parseCSV} from '../assets/data.js';
const rows = parseCSV(readFileSync(new URL('../data/ratios.csv', import.meta.url), 'utf8'));

test('US revenue export preserves millions rather than displayed billions', () => {
  const ttwo = rows.filter(row => row.ticker === 'TTWO');
  const result = parseCSV(annualCSV(ttwo, 'Take-Two', 'revenue', 'money'));
  assert.equal(result.length, ttwo.length);
  assert.equal(result.find(row => row.fiscal_year === 2025).value, 5633.6);
  assert.ok(result.every(row => row.currency === 'USD' && row.unit === 'million'));
});

test('Indian export preserves crore units and distinguishes missing from zero', () => {
  const nazara = rows.filter(row => row.ticker === 'NAZARA');
  const revenue = parseCSV(annualCSV(nazara, 'Nazara', 'revenue', 'money'));
  assert.ok(revenue.every(row => row.currency === 'INR' && row.unit === 'crore'));
  const missing = parseCSV(annualCSV(nazara, 'Nazara', 'current_ratio', 'x'));
  assert.ok(missing.every(row => row.value === ''));
  const zero = parseCSV(annualCSV([{fiscal_year:2025, roa:0, currency:'USD'}], 'Test', 'roa', 'pct'));
  assert.equal(zero[0].value, 0);
});

test('percentage export retains fractions and escapes names correctly', () => {
  const row = rows.find(row => row.ticker === 'TTWO' && row.fiscal_year === 2025);
  const result = parseCSV(annualCSV([row], 'Company, "quoted"', 'operating_margin', 'pct'));
  assert.equal(result[0].company, 'Company, "quoted"');
  assert.equal(result[0].value, row.operating_margin);
  assert.equal(result[0].unit, 'fraction');
});
