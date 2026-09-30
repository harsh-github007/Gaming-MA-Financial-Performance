import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCSV, span } from '../assets/data.js';

const load = f => parseCSV(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'));

test('every deal has financials for its before and after years', () => {
  const fin = load('data/financials.csv');
  for (const d of load('data/deals.csv')) {
    for (const s of [d.pre_years, d.post_years]) {
      const [a, b] = span(s);
      for (let y = a; y <= b; y++) assert.ok(fin.some(r => r.ticker === d.ticker && r.fiscal_year === y), `${d.ticker} FY${y}`);
    }
    const [, preEnd] = span(d.pre_years), [postStart] = span(d.post_years);
    assert.ok(preEnd < d.event_year && d.event_year < postStart, `${d.ticker} windows exclude the deal year`);
  }
});

test('ratios match the reported figures', () => {
  const r = load('data/ratios.csv').find(x => x.ticker === 'TTWO' && x.fiscal_year === 2025);
  assert.ok(Math.abs(r.operating_margin - (-4391.1 / 5633.6)) < 1e-3);
  assert.ok(Math.abs(r.operating_margin_ex_impairment - ((-4391.1 + 3545.2) / 5633.6)) < 1e-3);
});

test('balance sheets are consistent', () => {
  for (const r of load('data/financials.csv')) {
    if (r.equity !== '' && r.total_assets !== '') assert.ok(r.equity <= r.total_assets, `${r.ticker} ${r.fiscal_year}`);
    if (r.goodwill !== '' && r.total_assets !== '') assert.ok(r.goodwill < r.total_assets, `${r.ticker} ${r.fiscal_year}`);
  }
});
