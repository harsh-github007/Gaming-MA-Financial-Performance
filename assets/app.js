import { loadAll, span } from './data.js';

const $ = id => document.getElementById(id);
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const hasCharts = () => typeof Chart !== 'undefined';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const COLORS = { TTWO: '--blue', EA: '--aqua', U: '--orange', NAZARA: '#c77dff' };
const color = t => COLORS[t].startsWith('--') ? css(COLORS[t]) : COLORS[t];
const TARGET = { TTWO: 'Zynga', EA: 'Codemasters, Glu, Playdemic', U: 'ironSource', NAZARA: 'Sportskeeda, Kiddopia' };
const SHORT = { TTWO: 'Take-Two', EA: 'Electronic Arts', U: 'Unity', NAZARA: 'Nazara' };
const METRICS = [
  ['operating_margin', 'Operating margin', 'pct'], ['operating_margin_ex_impairment', 'Operating margin before goodwill impairment', 'pct'],
  ['net_margin', 'Net margin', 'pct'], ['roa', 'Return on assets', 'pct'], ['roe', 'Return on equity', 'pct'],
  ['ocf_to_assets', 'Operating cash flow / assets', 'pct'], ['current_ratio', 'Current ratio', 'x'],
  ['goodwill_to_assets', 'Goodwill / assets', 'pct'], ['revenue', 'Revenue', 'money'],
];
const fmt = (v, kind, cur) => v === '' || v == null || !isFinite(v) ? '–' : kind === 'pct' ? `${(v * 100).toFixed(1)}%` : kind === 'x' ? v.toFixed(2) : cur === 'INR' ? `₹${Math.round(v).toLocaleString('en-IN')} cr` : `$${(v / 1000).toFixed(2)} bn`;
const fmtChange = (v, kind) => !isFinite(v) ? '–' : kind === 'x' ? `${v > 0 ? '+' : ''}${v.toFixed(2)}` : `${v > 0 ? '+' : ''}${(v * 100).toFixed(1)} pts`;

// Shades the completion year on a category x-axis.
const band = { id: 'band', beforeDatasetsDraw(chart, _, o) {
  if (o.year == null) return; const x = chart.scales.x, i = chart.data.labels.indexOf(o.year); if (i < 0) return;
  const w = x.getPixelForValue(1) - x.getPixelForValue(0), c = x.getPixelForValue(i), { top, bottom } = chart.chartArea;
  const ctx = chart.ctx; ctx.save(); ctx.fillStyle = o.color; ctx.fillRect(c - w / 2, top, w, bottom - top); ctx.restore();
} };

let d, current = 'TTWO', line;

function deals() {
  $('deals').innerHTML = d.deals.map(x => {
    const r = x.acquirer_announcement_day_return_pct;
    return `<div class="deal" style="--c:${color(x.ticker)}"><small>${esc(x.acquirer)} bought</small><b>${esc(x.target)}</b>
      <span class="val">${x.value_usd_bn >= 1 ? `$${x.value_usd_bn} bn` : `₹128 crore`}</span>
      <small>Completed ${esc(String(x.completed))} · ${esc(x.payment)}</small>
      ${r !== '' ? `<small>Buyer's shares on announcement day: <b class="neg">${r}%</b></small>` : ''}
      <small>${esc(x.note)}</small></div>`;
  }).join('');
}

function chips() {
  $('dealChips').innerHTML = d.deals.map(x => `<button class="chip" data-t="${x.ticker}" aria-pressed="${x.ticker === current}">${SHORT[x.ticker]}</button>`).join('');
  $('dealChips').querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => { current = b.dataset.t; $('dealChips').querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === b))); draw(); }));
  $('metric').innerHTML = METRICS.map(([k, l]) => `<option value="${k}">${l}</option>`).join('');
  $('metric').addEventListener('change', draw);
}

function draw() {
  const deal = d.deals.find(x => x.ticker === current), rows = d.ratios.filter(r => r.ticker === current);
  const [m, label, kind] = METRICS.find(x => x[0] === $('metric').value);
  const cur = rows[0].currency;
  const pp = d.prepost.filter(r => r.ticker === current);
  $('ppTable').innerHTML = `<thead><tr><th>Measure</th><th>Before</th><th>After</th><th>Change</th></tr></thead><tbody>` +
    METRICS.filter(([k]) => k !== 'revenue').map(([k, l, kd]) => { const r = pp.find(p => p.metric === k); if (!r || (r.pre === '' && r.post === '')) return '';
      if (k === 'operating_margin_ex_impairment' && current !== 'TTWO') return '';
      return `<tr><td>${l}</td><td>${fmt(r.pre, kd)}</td><td>${fmt(r.post, kd)}</td><td class="${r.change > 0 ? 'pos' : r.change < 0 ? 'neg' : ''}">${fmtChange(r.change, kd)}</td></tr>`; }).join('') +
    (() => { const r = pp.find(p => p.metric === 'revenue_cagr'); return `<tr><td>Revenue (average)</td><td>${fmt(r.pre, 'money', cur)}</td><td>${fmt(r.post, 'money', cur)}</td><td>${(r.change * 100).toFixed(1)}% a year</td></tr>`; })() + '</tbody>';
  const notes = {
    TTWO: 'Revenue rose by about three-quarters with Zynga, but amortisation of acquired intangibles and $5.9 billion of goodwill write-downs turned a 15% operating margin into large losses. Even before the write-downs, the margin fell by 29 points, and operating cash flow almost disappeared until FY2026.',
    EA: 'Revenue grew 8.6% a year, but operating margin slipped two points and goodwill doubled to over 40% of assets. The fall in net margin is exaggerated by a one-off tax benefit in FY2020. The deals were paid in cash, so the current ratio more than halved.',
    U: 'Unity was loss-making before and after the deal. ironSource added revenue and turned operating cash flow positive, but operating losses barely narrowed, and goodwill rose to nearly half of assets.',
    NAZARA: 'Revenue quadrupled after the 2019 acquisitions and later deals, but operating margin (before depreciation) halved and returns on assets and equity fell. Nazara has kept acquiring, and its FY2026 operating result turned negative.',
  };
  $('ppNote').textContent = notes[current];
  $('ppYears').textContent = `Before = average of FY${deal.pre_years.replace('-', '–')}; after = average of FY${deal.post_years.replace('-', '–')}.`;
  if (!hasCharts()) return;
  const labels = rows.map(r => r.fiscal_year);
  const val = r => kind === 'pct' ? (r[m] === '' ? null : r[m] * 100) : kind === 'money' ? (r[m] === '' ? null : cur === 'INR' ? r[m] : r[m] / 1000) : (r[m] === '' ? null : r[m]);
  const unit = kind === 'pct' ? '%' : kind === 'money' ? (cur === 'INR' ? 'INR crore' : 'US$ billion') : 'times';
  const data = { labels, datasets: [{ label, data: rows.map(val), borderColor: color(current), backgroundColor: color(current), borderWidth: 2.5, pointRadius: 3, spanGaps: true }] };
  const options = { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false }, band: { year: deal.event_year, color: css('--chip') },
      tooltip: { callbacks: { title: i => `FY${i[0].label}${i[0].label == deal.event_year ? ' (deal completed)' : ''}`, label: c => `${label}: ${c.raw == null ? '–' : kind === 'pct' ? c.raw.toFixed(1) + '%' : c.raw.toFixed(2)}` } } },
    scales: { x: { grid: { display: false }, title: { display: true, text: 'Fiscal year' } }, y: { title: { display: true, text: unit } } } };
  if (line) { line.data = data; line.options = options; line.update(); } else line = new Chart($('lineChart'), { type: 'line', data, options, plugins: [band] });
}

function summary() {
  const cols = [['operating_margin', 'Operating margin'], ['roa', 'Return on assets'], ['ocf_to_assets', 'Cash flow / assets'], ['goodwill_to_assets', 'Goodwill / assets']];
  $('sumTable').innerHTML = `<thead><tr><th>Acquirer</th><th>Revenue growth</th>${cols.map(c => `<th>${c[1]}</th>`).join('')}</tr></thead><tbody>` +
    d.deals.map(x => { const pp = d.prepost.filter(r => r.ticker === x.ticker); const g = pp.find(r => r.metric === 'revenue_cagr');
      return `<tr><td>${SHORT[x.ticker]} – ${TARGET[x.ticker]}</td><td class="pos">+${(g.change * 100).toFixed(1)}% a year</td>` +
        cols.map(([k]) => { const r = pp.find(p => p.metric === k); const good = k === 'goodwill_to_assets' ? null : r && r.change > 0;
          return `<td class="${r && r.change !== '' ? (good === null ? '' : good ? 'pos' : 'neg') : ''}">${r && r.change !== '' ? fmtChange(r.change, 'pct') : '–'}</td>`; }).join('') + '</tr>'; }).join('') + '</tbody>';
}

function goodwill() {
  if (!hasCharts()) return;
  const years = [...new Set(d.ratios.map(r => r.fiscal_year))].sort();
  const ds = d.deals.filter(x => x.ticker !== 'NAZARA').map(x => ({ label: SHORT[x.ticker], borderColor: color(x.ticker), backgroundColor: color(x.ticker), borderWidth: 2.5, pointRadius: 3, spanGaps: true,
    data: years.map(y => { const r = d.ratios.find(r => r.ticker === x.ticker && r.fiscal_year === y); return r && r.goodwill_to_assets !== '' ? r.goodwill_to_assets * 100 : null; }) }));
  new Chart($('gwChart'), { type: 'line', data: { labels: years, datasets: ds }, options: { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
    scales: { x: { grid: { display: false } }, y: { title: { display: true, text: '% of total assets' }, min: 0 } },
    plugins: { tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.raw == null ? '–' : c.raw.toFixed(1) + '%'}` } } } } });
}

async function main() {
  if (hasCharts()) { Chart.defaults.font.family = css('--sans'); Chart.defaults.color = css('--muted'); Chart.defaults.borderColor = css('--line'); }
  try { d = await loadAll('.'); } catch (e) { $('loadError').hidden = false; $('loadError').textContent = `The data could not be loaded (${e.message}).`; return; }
  deals(); chips(); draw(); summary(); goodwill();
}
main();
