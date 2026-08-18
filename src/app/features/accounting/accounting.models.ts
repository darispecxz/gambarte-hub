/** Modelos para reportes de contabilidad. */

export interface Agency {
  id_agencia: number;
  descripcion: string;
}

export interface TransactionEntry {
  count: number;
  amount: number;
}

// ═══════════════════════════════════════════════════════════════════
// 1. Reconciliación de Cajeros (Section D)
// ═══════════════════════════════════════════════════════════════════

export interface CurrencyReconciliation {
  idCaja: number;
  numCaja: number;
  moneda: string;
  tipoCambioOficial: number;

  // Ingresos
  aperturaCaja: number;
  cambioMonedaIngreso: TransactionEntry;
  envioGiro: TransactionEntry;
  envioRemesa: TransactionEntry;
  traspasoDeCaja: TransactionEntry;
  cobroCheque: TransactionEntry;
  ingresoControlado: TransactionEntry;
  transferenciaBovedaIngreso: TransactionEntry;

  // Egresos
  cambioMonedaEgreso: TransactionEntry;
  pagoGiro: TransactionEntry;
  devolucionGiro: number;
  pagoRemesa: TransactionEntry;
  devolucionRemesa: number;
  traspasoACaja: TransactionEntry;
  depositoBancario: TransactionEntry;
  egresoControlado: TransactionEntry;
  transferenciaBovedaEgreso: TransactionEntry;

  // Totales
  totalIngreso: number;
  totalEgreso: number;
  totalSaldo: number;
  cierreCaja: number;
  diferencia: number; // discrepancia
}

export interface CashierBreakdown {
  cajero: string;
  idAgencia: number;
  agencia: string;
  currencies: CurrencyReconciliation[];
  fallasRegistradas: { [idCaja: number]: number };
}

export interface CashierReconciliationReport {
  fecha: string;
  cashiers: CashierBreakdown[];
  totalDiscrepancies: number;
}

// ═══════════════════════════════════════════════════════════════════
// 2. Resumen de Movimientos (Section E1)
// ═══════════════════════════════════════════════════════════════════

export interface CurrencyMovementSummary {
  moneda: string;
  aperturaCaja: number;
  cambioMoneda: number;
  envioGiro: number;
  pagoGiro: number;
  envioRemesa: number;
  pagoRemesa: number;
  egresos: number;
  transferencias: number;
  fallasCaja: number;
  cierreCaja: number;
}

export interface MovementSummaryReport {
  fecha: string;
  currencies: CurrencyMovementSummary[];
}

// ═══════════════════════════════════════════════════════════════════
// 3. Cierres de Agencias (Section E2)
// ═══════════════════════════════════════════════════════════════════

export interface AgencyClosingEntry {
  idAgencia: number;
  agencia: string;
  currencyClosings: { [moneda: string]: number };
}

export interface AgencyClosingReport {
  fecha: string;
  agencies: AgencyClosingEntry[];
  totals: { [moneda: string]: number };
}

// ═══════════════════════════════════════════════════════════════════
// 4. Resumen Diario (Section C)
// ═══════════════════════════════════════════════════════════════════

export interface CurrencyTotal {
  moneda: string;
  totalCajas: number;
  totalBoveda: number;
  totalCajasBoveda: number;
  tipoCambioOficial: number;
  monedasEnBob: number;
  contabilidad?: number;
  diferencia?: number;
}

export interface DailySummaryReport {
  fecha: string;
  currencies: CurrencyTotal[];
  grandTotalBob: number;
}

// ═══════════════════════════════════════════════════════════════════
// 5. Balance de Sumas y Saldos
// ═══════════════════════════════════════════════════════════════════

export interface Ejercicio {
  codejercicio: string;
  nombre: string;
  fechainicio: string;
  fechafin: string;
  estado: string;
}

export interface SubcuentaOption {
  codsubcuenta: string;
  descripcion: string;
}

export interface BalanceSubcuenta {
  codsubcuenta: string;
  descripcion: string;
  debe: number;
  haber: number;
  saldo: number;
}

export interface BalanceCuenta {
  codcuenta: string;
  descripcion: string;
  debe: number;
  haber: number;
  saldo: number;
  subcuentas: BalanceSubcuenta[];
}

export interface BalanceSumasYSaldosReport {
  ejercicio: string;
  fechaDesde: string;
  fechaHasta: string;
  cuentas: BalanceCuenta[];
  totalDebe: number;
  totalHaber: number;
  totalSaldo: number;
  cuadrado: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// 6. Libro Mayor por Subcuenta
// ═══════════════════════════════════════════════════════════════════

export interface LibroMayorMovimiento {
  idasiento: number;
  numero: number;
  fecha: string;
  tipodocumento: string;
  concepto: string;
  documento: string;
  debe: number;
  haber: number;
  saldo: number;
}

export interface LibroMayorReport {
  codsubcuenta: string;
  descripcion: string;
  ejercicio: string;
  fechaDesde: string;
  fechaHasta: string;
  saldoInicial: number;
  movimientos: LibroMayorMovimiento[];
  totalDebe: number;
  totalHaber: number;
  saldoFinal: number;
  page: number;
  pageSize: number;
  totalRows: number;
  totalPages: number;
}

// ═══════════════════════════════════════════════════════════════════
// 7. Detalle de Asiento
// ═══════════════════════════════════════════════════════════════════

export interface AsientoPartida {
  codsubcuenta: string;
  descripcion: string;
  concepto: string;
  documento: string;
  debe: number;
  haber: number;
}

export interface AsientoDetalle {
  idasiento: number;
  numero: number;
  fecha: string;
  concepto: string;
  tipodocumento: string;
  importe: number;
  partidas: AsientoPartida[];
}
