export function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null) return '—';
  return n.toLocaleString('es-BO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(0);
}

export function alertPill(tipo: string): string {
  switch (tipo) {
    case 'saldo_bajo': return 'p-bad';
    case 'saldo_excedido': return 'p-warn';
    case 'sin_apertura': return 'p-info';
    default: return '';
  }
}

export function alertIcon(tipo: string): string {
  switch (tipo) {
    case 'saldo_bajo': return 'ti-arrow-down-circle';
    case 'saldo_excedido': return 'ti-arrow-up-circle';
    case 'sin_apertura': return 'ti-clock-off';
    default: return 'ti-alert-circle';
  }
}

export function alertLabel(tipo: string): string {
  switch (tipo) {
    case 'saldo_bajo': return 'Bajo';
    case 'saldo_excedido': return 'Excedido';
    case 'sin_apertura': return 'Sin apertura';
    default: return tipo;
  }
}

export function estadoPill(estado: string): string {
  switch (estado) {
    case 'A': return 'p-ok';
    case 'P': return 'p-warn';
    case 'R': return 'p-bad';
    default: return '';
  }
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}
