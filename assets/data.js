// Reads the CSV files in data/ so the page and the analysis use the same numbers.
export function parseCSV(text) {
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') quoted = false; else field += c; }
    else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(field); field = ''; if (row.some(v => v !== '')) rows.push(row); row = []; }
    else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some(v => v !== '')) rows.push(row); }
  const [head, ...body] = rows;
  return body.map(r => Object.fromEntries(head.map((h, j) => { const v = r[j] ?? ''; return [h, v !== '' && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v]; })));
}
export async function loadAll(base = '.') {
  const files = { deals: 'data/deals.csv', ratios: 'data/ratios.csv', prepost: 'data/pre_post.csv' };
  return Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, file]) => {
    const response = await fetch(`${base}/${file}`);
    if (!response.ok) throw new Error(`Could not load ${file}`);
    return [key, parseCSV(await response.text())];
  })));
}
export const span = s => { const [a, b] = String(s).split('-').map(Number); return [a, b]; };

