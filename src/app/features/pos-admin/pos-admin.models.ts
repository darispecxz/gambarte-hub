export interface AgencyGroup {
  idAgencia: number;
  nombre: string;
  abreviatura: string;
  cashiers: CashierInfo[];
}

export interface CashierInfo {
  numCaja: number;
  codUsuario: string;
  loginUsuario: string;
  nombreCajero: string;
  estado: 'activo' | 'cerrado' | 'sin_apertura';
  horaApertura: string | null;
  horaCierre: string | null;
  numMovimientos: number;
  balances: CurrencyBalance[];
}

export interface CurrencyBalance {
  idCaja: number;
  idMoneda: number;
  moneda: string;
  monedaDesc: string;
  apertura: number | null;
  cierre: number | null;
  saldoActual: number;
  maximo: number;
  minimo: number;
}

export interface CashierMovement {
  id: number;
  tipo: number;
  tipoDesc: string;
  correlativo: number;
  nombre: string;
  monto: number;
  comprobante: string;
  fechaHora: string;
  moneda: string;
}

export interface ArqueoItem {
  valor: number;
  agrupacion: string;
  multiplicador: number;
  cantidad: number;
  subtotal: number;
}

export interface ArqueoCurrency {
  moneda: string;
  items: ArqueoItem[];
  total: number;
}

export interface ArqueoData {
  tipo: string;
  fechaHora: string | null;
  currencies: ArqueoCurrency[];
}

export interface SaldoEntry {
  monto: number;
  acumulado: number;
  fechaHora: string;
  conciliacion: string;
  tipoDesc: string;
}

export interface Agency {
  id: number;
  nombre: string;
}
