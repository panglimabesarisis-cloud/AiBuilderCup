export const IDR_RATE = 15000;

export function toIdr(v: number): number {
  return Math.round(v * IDR_RATE);
}

export function fmtMoney(v: number, mode: 'IDR' | 'USD' = 'IDR'): string {
  if (mode === 'IDR') {
    return 'Rp ' + toIdr(v).toLocaleString('id-ID');
  }
  return '$' + v.toFixed(2);
}
