export function formatNumber(val: number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  if (Math.abs(val) >= 1_000_000) {
    return (val / 1_000_000).toFixed(decimals) + 'M';
  }
  if (Math.abs(val) >= 1_000) {
    return (val / 1_000).toFixed(decimals) + 'k';
  }
  return Number.isInteger(val) ? val.toString() : val.toFixed(decimals);
}

export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${val.toFixed(1)}%`;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function truncate(str: string, length = 32): string {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}
