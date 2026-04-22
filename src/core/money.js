export function roundCurrency(value) {
  return Math.round(((Number(value) || 0) + 1e-8) * 100) / 100;
}

export function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return roundCurrency(value);

  const normalized = String(value)
    .replace(/\s/g, '')
    .replace(/R\$/gi, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? roundCurrency(numeric) : 0;
}
