import { loadAll } from './data.js';
import { annualCSV } from './export.js';
const $ = id => document.getElementById(id);
const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const esc = value => String(value).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const missing = value => value === '' || value == null || !Number.isFinite(value);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const SHORT = {TTWO:'Take-Two', EA:'Electronic Arts', U:'Unity', NAZARA:'Nazara'};
const TARGET = {TTWO:'Zynga', EA:'Codemasters, Glu, Playdemic', U:'ironSource', NAZARA:'Sportskeeda, Kiddopia'};
const COLORS = {TTWO:'--accent', EA:'--aqua', U:'--orange', NAZARA:'#d9b5ec'};
const color = t => COLORS[t].startsWith('--') ? css(COLORS[t]) : COLORS[t];
const METRICS = [
 ['operating_margin','Operating margin','pct'],
 ['operating_margin_ex_impairment','Margin excluding goodwill impairment','pct'],
 ['net_margin','Net margin','pct'],['roa','Return on assets','pct'],['roe','Return on equity','pct'],
 ['ocf_to_assets','Operating cash flow / assets','pct'],['current_ratio','Current ratio','x'],
 ['goodwill_to_assets','Goodwill / assets','pct'],['revenue','Revenue','money'],
];
const labelFor = (metric, t = current) => t === 'NAZARA' && metric[0].startsWith('operating_margin') ? (metric[0] === 'operating_margin' ? 'Margin before depreciation' : 'Margin before depreciation (impairment add-back)') : metric[1];
const fmt = (v, kind, cur = 'USD') => missing(v) ? 'Not available' : kind === 'pct' ? `${(v * 100).toFixed(1)}%` : kind === 'x' ? `${v.toFixed(2)}x` : cur === 'INR' ? `₹${Math.round(v).toLocaleString('en-IN')} cr` : `$${(v / 1000).toFixed(2)} bn`;
const changeFmt = (v, kind) => missing(v) ? 'Not available' : `${v > 0 ? '+' : ''}${kind === 'x' ? v.toFixed(2) + 'x' : (v * 100).toFixed(1) + ' pp'}`;
const tint = v => missing(v) ? '' : v > 0 ? 'pos' : v < 0 ? 'neg' : '';
const band = {id:'completionBand', beforeDatasetsDraw(chart, _, options) {
 const x = chart.scales.x, ctx = chart.ctx, {top,bottom} = chart.chartArea;
 const w = Math.abs(x.getPixelForValue(1)-x.getPixelForValue(0));
 for (const year of options.years || []) { const i = chart.data.labels.indexOf(year); if (i < 0) continue;
  ctx.save(); ctx.fillStyle = 'rgba(174,176,178,.10)'; ctx.fillRect(x.getPixelForValue(i)-w/2,top,w,bottom-top);ctx.restore();
 }
}};
let d, current = 'TTWO', metricKey = 'operating_margin', line, goodwillChart;
const selectedRows = () => d.ratios.filter(r => r.ticker === current).sort((a,b) => a.fiscal_year-b.fiscal_year);
const metric = () => METRICS.find(m => m[0] === metricKey);
const beforeAfter = (t,key) => d.prepost.find(r => r.ticker === t && r.metric === (key === 'revenue' ? 'revenue_cagr' : key));
const windows = deal => `Earlier: FY${String(deal.pre_years).replace('-', ' to FY')}. Later: FY${String(deal.post_years).replace('-', ' to FY')}. Averages of three annual observations.`;

function selectCase(t, scroll = false) {
 if (!d || !SHORT[t]) return;
 current = t;
 updateOptions(); draw();
 document.querySelectorAll('#dealChips button').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.t === current)));
 const params = new URLSearchParams(location.search); params.set('company',current);params.set('metric',metricKey);
 history.replaceState(null,'',`${location.pathname}?${params}${location.hash}`);
 if (scroll) $('explore').scrollIntoView({behavior:reduced.matches ? 'instant' : 'smooth',block:'start'});
}

function hero() {
 $('heroPlot').classList.remove('skeleton'); $('heroPlot').setAttribute('aria-busy','false');
 const pos = v => ((v*100+60)/90*100).toFixed(2);
 $('heroPlot').innerHTML = d.deals.map(deal => {
  const r = beforeAfter(deal.ticker,'operating_margin');
  if (!r || missing(r.pre) || missing(r.post)) return '';
  return `<button class="plot-row" data-t="${deal.ticker}" aria-label="Explore ${SHORT[deal.ticker]}: before ${fmt(r.pre,'pct')}, after ${fmt(r.post,'pct')}"><span class="plot-name">${SHORT[deal.ticker]}</span><span class="plot-glyph"><svg viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true"><line x1="66.67" x2="66.67" y1="0" y2="24" stroke="${css('--line')}" stroke-width="1" vector-effect="non-scaling-stroke"/><line x1="${pos(r.pre)}" x2="${pos(r.post)}" y1="12" y2="12" stroke="${css('--muted')}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><i class="plot-dot before" style="left:${pos(r.pre)}%"></i><i class="plot-dot after" style="left:${pos(r.post)}%"></i></span><span class="plot-value">${fmt(r.post,'pct')}</span></button>`;
 }).join('')+'<div class="plot-axis"><span>-60</span><span>-30</span><span>0</span><span>30</span></div>';
 $('heroPlot').querySelectorAll('button').forEach(b => b.addEventListener('click',() => {metricKey='operating_margin';selectCase(b.dataset.t,true);}));
}

function updateOptions() {
 // Keep every measure discoverable, including explicit missing-data states.
 $('metric').innerHTML = METRICS.map(m => `<option value="${m[0]}">${esc(labelFor(m))}</option>`).join('');
 $('metric').value = metricKey;
}
function chips() {
 $('dealChips').innerHTML = d.deals.map(deal => `<button class="chip" data-t="${deal.ticker}" aria-pressed="${deal.ticker === current}"><span>${SHORT[deal.ticker]}</span><span class="ticker">${deal.ticker === 'NAZARA' ? 'INR' : deal.ticker}</span></button>`).join('');
 $('dealChips').querySelectorAll('button').forEach(b => b.addEventListener('click',() => selectCase(b.dataset.t)));
 updateOptions();
}

function context(deal) {
 const amount = current === 'NAZARA' ? '₹128 crore' : `$${deal.value_usd_bn.toFixed(1)} bn`;
 const completed = current === 'EA' ? 'February to September 2021' : current === 'NAZARA' ? '2019' : new Date(deal.completed+'T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'});
 $('caseContext').innerHTML = `<h3>${esc(TARGET[current])}</h3><div class="deal-value">${amount}</div><p>Completed ${completed}</p><small>${current === 'NAZARA' ? 'Stakes acquired in two businesses' : 'Headline announced deal value'}</small>`;
 const reaction = deal.acquirer_announcement_day_return_pct;
 $('dealDetails').innerHTML = `<p>${esc(deal.payment)}</p>${!missing(reaction) ? `<p>Announcement-day share-price change: ${reaction.toFixed(1)}%. This is not a market-adjusted abnormal return.</p>` : ''}<p>${current === 'EA' ? 'The programme spans two fiscal years. The original baseline contains partial Codemasters consolidation.' : current === 'NAZARA' ? 'Later acquisitions overlap the observation window. Historical pre-listing financials are used retrospectively.' : esc(deal.note)}</p>`;
}
function draw() {
 const deal = d.deals.find(x => x.ticker === current), rows = selectedRows();
 const [key,,kind] = metric(), label = labelFor(metric()), currency = rows[0].currency;
 const pp = beforeAfter(current,key);
 const growth = key === 'revenue' && pp && !missing(pp.change) ? `+${(pp.change*100).toFixed(1)}%` : null;
 $('selectedStats').innerHTML = `<div><span>Earlier average</span><strong>${fmt(pp?.pre,kind,currency)}</strong></div><div><span>Later average</span><strong>${fmt(pp?.post,kind,currency)}</strong></div><div><span>${key === 'revenue' ? 'Annualised revenue ratio' : 'Change'}</span><strong class="change">${growth || changeFmt(pp?.change,kind)}</strong></div>`;
 $('ppYears').textContent = windows(deal);
 $('bandNote').textContent = current === 'EA' ? 'Shaded: FY2021 and FY2022, the acquisition programme. The original baseline includes FY2021.' : `Shaded: FY${deal.event_year}, the completion year, excluded from the window averages.`;
 const notes = {
 TTWO:'Later-window revenue was higher, while operating margins and cash flow relative to assets were lower. Adding back recorded goodwill impairments narrows the operating-margin decline from 64.2 to 28.6 percentage points. This adjustment does not isolate Zynga or organic performance.',
 EA:'The original comparison shows a 2.1 percentage-point operating-margin decline. Using FY2018 to FY2020, entirely before the acquisition programme, increases it to 5.2 points. A one-off FY2020 tax benefit raises the earlier net-income ratios.',
 U:'Unity remained loss-making, but its operating margin improved by 1.9 percentage points and operating cash flow relative to assets became positive. These company-level changes do not isolate ironSource’s contribution.',
 NAZARA:'Average revenue was roughly four times higher in the later window. The margin before depreciation and returns on assets and equity were lower. This margin has a different definition from the US companies, and other acquisitions overlap the period.'};
 $('ppNote').textContent = notes[current] + (key === 'operating_margin_ex_impairment' && current !== 'TTWO' ? ' This add-back uses the original calculation’s assumption that blank impairment inputs are zero; it is not a verified absence of impairment.' : '');context(deal);
 const visible = METRICS.filter(m => m[0] !== 'revenue' && (m[0] !== 'operating_margin_ex_impairment' || current === 'TTWO'));
 $('ppTable').innerHTML = '<caption>All measures for '+SHORT[current]+'. Changes in percentage points unless shown as a ratio.</caption><thead><tr><th scope="col">Measure</th><th scope="col">Earlier</th><th scope="col">Later</th><th scope="col">Change</th></tr></thead><tbody>'+visible.map(m => {const r=beforeAfter(current,m[0]);return `<tr><th scope="row">${labelFor(m)}</th><td>${fmt(r?.pre,m[2])}</td><td>${fmt(r?.post,m[2])}</td><td class="${m[0] === 'goodwill_to_assets' ? '' : tint(r?.change)}">${changeFmt(r?.change,m[2])}</td></tr>`;}).join('')+`<tr><th scope="row">Average revenue</th><td>${fmt(beforeAfter(current,'revenue')?.pre,'money',currency)}</td><td>${fmt(beforeAfter(current,'revenue')?.post,'money',currency)}</td><td>+${(beforeAfter(current,'revenue').change*100).toFixed(1)}% annualised</td></tr></tbody>`;
 $('annualTable').innerHTML = `<caption>${esc(label)} for ${SHORT[current]}. Missing inputs are shown as unavailable.</caption><thead><tr><th scope="col">Fiscal year</th><th scope="col">${esc(label)}</th><th scope="col">Window</th></tr></thead><tbody>`+rows.map(r=>`<tr><th scope="row">FY${r.fiscal_year}</th><td>${fmt(r[key],kind,currency)}</td><td>${windowLabel(r.fiscal_year,deal)}</td></tr>`).join('')+'</tbody>';
 const available = rows.some(r => !missing(r[key]));
 $('lineChart').hidden = !available || typeof Chart === 'undefined';
 $('chartFallback').hidden = available && typeof Chart !== 'undefined';
 $('chartFallback').textContent = !available ? `${label} is not available for ${SHORT[current]} in the supplied data. Choose another measure.` : 'The chart library could not load. You can still inspect the annual data below.';
 $('lineChart').setAttribute('aria-label',`${label} for ${SHORT[current]} by fiscal year. Exact values are in the annual data table below.`);
 if (typeof Chart === 'undefined' || !available) return;
 const values = rows.map(r => missing(r[key]) ? null : kind === 'pct' ? r[key]*100 : kind === 'money' && currency !== 'INR' ? r[key]/1000 : r[key]);
 const unit = kind === 'pct' ? '%' : kind === 'money' ? currency === 'INR' ? 'INR crore' : 'US$ billion' : 'Ratio';
 const options = chartOptions(unit);
 options.plugins.completionBand={years:current === 'EA' ? [2021,2022] : [deal.event_year]};
 options.plugins.tooltip.callbacks={title:items=>`FY${items[0].label}`,label:c=>`${label}: ${fmt(rows[c.dataIndex][key],kind,currency)}`};
 const data={labels:rows.map(r=>r.fiscal_year),datasets:[{label,data:values,borderColor:color(current),backgroundColor:color(current),borderWidth:2.5,pointRadius:3,pointHoverRadius:5,pointHitRadius:16,spanGaps:false,tension:.12}]};
 if (line) {line.data=data;line.options=options;line.update();} else line=new Chart($('lineChart'),{type:'line',data,options,plugins:[band]});
}
function windowLabel(year,deal) {
 const inside = s => {const [a,b]=s.split('-').map(Number);return year>=a && year<=b;};
 if (inside(deal.pre_years)) return current==='EA' && year===2021 ? 'Earlier (partial acquisition)' : 'Earlier';
 if (inside(deal.post_years)) return 'Later';
 return year===deal.event_year ? 'Completion' : 'Outside window';
}
function chartOptions(unit) {return {responsive:true,maintainAspectRatio:false,animation:reduced.matches ? false : {duration:250,easing:'easeOutQuart'},interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{backgroundColor:css('--chip'),titleColor:css('--ink'),bodyColor:css('--ink'),padding:12,displayColors:false,callbacks:{}}},scales:{x:{border:{display:false},grid:{display:false},ticks:{font:{size:11},maxRotation:0},title:{display:false}},y:{border:{display:false},grid:{color:css('--line'),tickLength:0},ticks:{padding:12,font:{size:11}},title:{display:true,text:unit,color:css('--muted'),font:{size:11}}}}};}
function summary() {
 const cols=[['operating_margin','Margin change'],['roa','Return on assets'],['ocf_to_assets','Cash flow / assets'],['goodwill_to_assets','Goodwill / assets']];
 $('sumTable').innerHTML='<caption>Changes between designated earlier and later three-year windows.</caption><thead><tr><th scope="col">Acquirer / target</th><th scope="col">Revenue ratio</th>'+cols.map(c=>`<th scope="col">${c[1]}</th>`).join('')+'</tr></thead><tbody>'+d.deals.map(deal=>`<tr><td><button class="company-link" data-t="${deal.ticker}">${SHORT[deal.ticker]}</button><span class="target">${TARGET[deal.ticker]}</span></td><td>+${(beforeAfter(deal.ticker,'revenue').change*100).toFixed(1)}%<small>annualised</small></td>`+cols.map(([key])=>{const r=beforeAfter(deal.ticker,key);return `<td class="${key==='goodwill_to_assets' ? '' : tint(r?.change)}">${changeFmt(r?.change,'pct')}</td>`;}).join('')+'</tr>').join('')+'</tbody>';
 $('sumTable').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>selectCase(b.dataset.t,true)));
}
function goodwill() {
 const years=[...new Set(d.ratios.filter(r=>r.ticker!=='NAZARA').map(r=>r.fiscal_year))].sort();
 const tickers=['TTWO','EA','U'];
 $('gwLegend').innerHTML=tickers.map(t=>`<span><i class="dot" style="background:${color(t)}"></i>${SHORT[t]}</span>`).join('');
 const value=(t,y)=>d.ratios.find(r=>r.ticker===t && r.fiscal_year===y)?.goodwill_to_assets;
 $('gwTable').innerHTML='<caption>Goodwill as a share of year-end total assets.</caption><thead><tr><th scope="col">Fiscal year</th>'+tickers.map(t=>`<th scope="col">${SHORT[t]}</th>`).join('')+'</tr></thead><tbody>'+years.map(y=>`<tr><th scope="row">FY${y}</th>`+tickers.map(t=>`<td>${fmt(value(t,y),'pct')}</td>`).join('')+'</tr>').join('')+'</tbody>';
 if(typeof Chart==='undefined'){$('gwChart').hidden=true;$('gwFallback').hidden=false;return;}
 const options=chartOptions('% of total assets');options.scales.y.min=0;options.plugins.tooltip.displayColors=true;options.plugins.tooltip.callbacks={label:c=>`${c.dataset.label}: ${c.raw == null ? 'Not available' : c.raw.toFixed(1)+'%'}`};
 goodwillChart=new Chart($('gwChart'),{type:'line',data:{labels:years,datasets:tickers.map((t,i)=>({label:SHORT[t],data:years.map(y=>missing(value(t,y)) ? null : value(t,y)*100),borderColor:color(t),backgroundColor:color(t),borderWidth:2.5,pointRadius:2,pointHitRadius:12,borderDash:i===1 ? [6,3] : i===2 ? [2,3] : [],spanGaps:false}))},options});
}
function exportCSV() {
 const rows=selectedRows(), [key]=metric();
 const text=annualCSV(rows,SHORT[current],key,metric()[2]);
 const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=`${current.toLowerCase()}-${key}.csv`;a.hidden=true;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function main() {
 $('loadError').hidden=true;$('retry').disabled=true;
 try {d=await loadAll('.');if(!d.deals.length || !d.ratios.length || !d.prepost.length) throw new Error('The source files are empty.');}
 catch(e){$('loadError').hidden=false;$('errorMessage').textContent=`Check your connection and try again. ${e.message}`;$('heroPlot').classList.remove('skeleton');$('heroPlot').textContent='Comparison data unavailable.';$('heroPlot').setAttribute('aria-busy','false');$('explore').setAttribute('aria-busy','false');$('retry').disabled=false;return;}
 if(typeof Chart!=='undefined'){Chart.defaults.font.family=css('--sans');Chart.defaults.color=css('--muted');Chart.defaults.borderColor=css('--line');}
 const params=new URLSearchParams(location.search);if(SHORT[params.get('company')])current=params.get('company');if(METRICS.some(m=>m[0]===params.get('metric')))metricKey=params.get('metric');
 chips();hero();draw();summary();goodwill();$('metric').disabled=false;$('export').disabled=false;$('explore').setAttribute('aria-busy','false');$('retry').disabled=false;
}
$('metric').addEventListener('change',()=>{metricKey=$('metric').value;selectCase(current);});$('export').addEventListener('click',exportCSV);$('retry').addEventListener('click',main);
reduced.addEventListener('change',()=>{if(d){draw();if(goodwillChart){goodwillChart.options.animation=reduced.matches ? false : {duration:250};goodwillChart.update();}}});
main();
