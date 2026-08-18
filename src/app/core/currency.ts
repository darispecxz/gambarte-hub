/**
 * Utilidades de moneda: mapea el código de moneda a país (ISO2) para mostrar
 * la bandera (flag-icons) y el nombre legible.
 */
const MAP: Record<string, { iso: string; name: string }> = {
  USD: { iso: 'us', name: 'Dólar estadounidense' },
  EUR: { iso: 'eu', name: 'Euro' },
  BRL: { iso: 'br', name: 'Real brasileño' },
  ARS: { iso: 'ar', name: 'Peso argentino' },
  CLP: { iso: 'cl', name: 'Peso chileno' },
  PEN: { iso: 'pe', name: 'Nuevo sol' },
  MXN: { iso: 'mx', name: 'Peso mexicano' },
  CAD: { iso: 'ca', name: 'Dólar canadiense' },
  CHF: { iso: 'ch', name: 'Franco suizo' },
  AUD: { iso: 'au', name: 'Dólar australiano' },
  GBP: { iso: 'gb', name: 'Libra esterlina' },
  NZD: { iso: 'nz', name: 'Dólar neozelandés' },
  BOB: { iso: 'bo', name: 'Boliviano' },
  JPY: { iso: 'jp', name: 'Yen' },
  CNH: { iso: 'cn', name: 'Yuan' },
  CNY: { iso: 'cn', name: 'Yuan' },
  DKK: { iso: 'dk', name: 'Corona danesa' },
  NOK: { iso: 'no', name: 'Corona noruega' },
  SEK: { iso: 'se', name: 'Corona sueca' },
  PYG: { iso: 'py', name: 'Guaraní' },
  COP: { iso: 'co', name: 'Peso colombiano' },
  UYU: { iso: 'uy', name: 'Peso uruguayo' },
};

export function currencyIso(code: string): string | null {
  const m = MAP[(code || '').toUpperCase()];
  return m ? m.iso : null;
}

export function currencyName(code: string): string {
  const m = MAP[(code || '').toUpperCase()];
  return m ? m.name : (code || '');
}

/** Clase CSS de flag-icons para la moneda (o '' si no hay bandera, p.ej. USDT). */
export function currencyFlag(code: string): string {
  const iso = currencyIso(code);
  return iso ? `fi fi-${iso}` : '';
}
