/** Envelope estándar de la API. */
export interface Envelope<T> {
  success: boolean;
  data: T;
  message: string | null;
  errors: unknown[];
}

export interface RiskInfo { slug: string; title: string; icon: string; }
export interface LogInfo { code: string; title: string; db: string; }

/** Parámetros de período (riesgos). */
export interface PeriodParams {
  preset?: 'mes' | 'dia' | 'rango';
  ini?: string;
  fin?: string;
  fecha?: string;
}

export interface RiskReport {
  slug: string;
  ini: string;
  fin: string;
  informe: any;
}

/** Tablero ejecutivo. */
export interface DashboardMetric { 0: string; 1: string; }
export interface DashboardDomain {
  slug: string;
  title: string;
  icon: string;
  sem: 'ok' | 'warn' | 'bad' | 'info';
  metrics: [string, string][];
}
export interface DashboardAlert { sev: 'ok' | 'warn' | 'bad'; dom: string; txt: string; }
export interface DashboardData {
  periodo: { ini: string; fin: string };
  dominios: DashboardDomain[];
  alertas: DashboardAlert[];
  semaforo: 'ok' | 'warn' | 'bad';
  generado?: string;
  from_cache?: boolean;
}

/** Reporte de logs (hojas). */
export interface LogColumn { label: string; type?: string; width?: number; }
export interface LogSheet { name: string; columns: LogColumn[]; rows: any[][]; }
export interface LogData {
  report?: string;
  title: string;
  db: string;
  periodo: string;
  label: string;
  sheets: LogSheet[];
  ms?: number;
}
