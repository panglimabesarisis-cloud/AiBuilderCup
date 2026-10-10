// Satu mata uang di database: Rupiah (IDR). USD hanya tampilan, memakai kurs tetap.
export const USD_RATE = 15500;

export const formatIDR = (v: number): string =>
  `Rp ${Math.round(Number(v) || 0).toLocaleString('id-ID')}`;

export const formatByMode = (v: number, mode: 'IDR' | 'USD'): string =>
  mode === 'IDR' ? formatIDR(v) : `$${((Number(v) || 0) / USD_RATE).toFixed(2)}`;
