// CSV exports retain the source's units; percentage measures remain fractions.
export function annualCSV(rows, company, measure, kind) {
  const lines = [['company', 'fiscal_year', 'measure', 'value', 'currency', 'unit']];
  for (const row of rows) {
    const value = row[measure];
    const unavailable = value === '' || value == null || !Number.isFinite(value);
    lines.push([company, row.fiscal_year, measure, unavailable ? '' : value, row.currency,
      measure === 'revenue' ? row.unit : kind === 'pct' ? 'fraction' : 'ratio']);
  }
  return lines.map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(',')).join('\r\n');
}
