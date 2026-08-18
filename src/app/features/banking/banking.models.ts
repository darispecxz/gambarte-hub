/** Modelos para reportes de Bancos / Cuentas Bancarias. */

export interface FinancialEntity {
  id_entidad_financiera: number;
  descripcion: string;
  nombre_corto: string;
  abreviatura: string;
}

export interface BankAccount {
  idAgencia: number;
  agencia: string;
  idEntidadFinanciera: number;
  entidad: string;
  entidadDesc: string;
  idTipoCuenta: number;
  tipoCuenta: string;
  tipoCuentaAbr: string;
  numCuenta: string;
  idMoneda: number;
  moneda: string;
  codsubcuenta: string;
}

// ── Movimientos ──

export interface BankMovement {
  idAgencia: number;
  agencia: string;
  idEntidadFinanciera: number;
  entidad: string;
  numCuenta: string;
  idMoneda: number;
  moneda: string;
  monto: number;
  concepto: 'INGRESO' | 'EGRESO';
  conciliacion: string;
  conciliacionDesc: string;
  glosa: string;
  fechaRegistro: string;
  usuario: string;
}

export interface BankMovementsReport {
  desde: string;
  hasta: string;
  total: number;
  movements: BankMovement[];
}

// ── Conciliación Contable (OBEL vs Balance de Sumas y Saldos) ──

export interface DiscrepancyCause {
  tipo: 'egreso_no_registrado' | 'ingreso_no_registrado' | 'asiento_sin_movimiento';
  label: string;
  count: number;
}

export interface UnmatchedMovement {
  fecha: string;
  monto: number;
  conciliacion: string;
  conciliacionDesc: string;
  glosa: string;
  usuario: string;
  tipo: 'INGRESO' | 'EGRESO';
}

export interface UnmatchedEntry {
  fecha: string;
  concepto: string;
  tipodocumento: string;
  debe: number;
  haber: number;
  monto: number;
  tipo: 'INGRESO' | 'EGRESO';
  idasiento: number;
}

export interface ConciliacionCuenta {
  idAgencia: number;
  idEntidadFinanciera: number;
  agencia: string;
  entidad: string;
  entidadDesc: string;
  numCuenta: string;
  idMoneda: number;
  moneda: string;
  codsubcuenta: string;
  saldoOBEL: number;
  saldoContable: number;
  diferencia: number;
  conciliado: boolean;
}

export interface ConciliacionDetalleResponse {
  causas: DiscrepancyCause[];
  movsSinContabilidad: UnmatchedMovement[];
  asientosSinOBEL: UnmatchedEntry[];
}

export interface TotalPorMoneda {
  moneda: string;
  totalOBEL: number;
  totalContable: number;
  totalDiferencia: number;
}

export interface ConciliacionContableReport {
  fecha: string;
  cuentas: ConciliacionCuenta[];
  totalesPorMoneda: TotalPorMoneda[];
  totalDiscrepancies: number;
  totalCuentas: number;
}

// ── Detalle de Movimiento (trazabilidad) ──

export interface AsientoPartida {
  codsubcuenta: string;
  subcuentaDesc: string;
  detalle: string;
  documento: string;
  debe: number;
  haber: number;
}

export interface AsientoContable {
  idasiento: number;
  codejercicio: string;
  concepto: string;
  tipodocumento: string;
  tipoLabel: string;
  fecha: string;
  importe: number;
  numero: number;
  idconcepto: string;
  partidas: AsientoPartida[];
  totalDebe: number;
  totalHaber: number;
}

export interface TraspasoRelacionado {
  id: number;
  monto: number;
  estado: string;
  estadoDesc: string;
  documentoOrigen: string;
  documentoDestino: string;
  fechaCreacion: string;
  origenAgencia: string;
  origenEntidad: string;
  origenCuenta: string;
  destinoAgencia: string;
  destinoEntidad: string;
  destinoCuenta: string;
}

export interface MovementDetailFull {
  idAgencia: number;
  agencia: string;
  idEntidadFinanciera: number;
  entidad: string;
  entidadDesc: string;
  numCuenta: string;
  idMoneda: number;
  moneda: string;
  monedaDesc: string;
  tipoCuenta: string;
  monto: number;
  concepto: 'INGRESO' | 'EGRESO';
  conciliacion: string;
  conciliacionDesc: string;
  glosa: string;
  fechaRegistro: string;
  usuario: string;
}

export interface MovementDetailResponse {
  movimiento: MovementDetailFull;
  codsubcuenta: string | null;
  asiento: AsientoContable | null;
  traspaso: TraspasoRelacionado | null;
  comprobanteUrl: string | null;
}

// ── Resumen Diario ──

export interface DailySummaryAccount {
  idAgencia: number;
  agencia: string;
  entidad: string;
  numCuenta: string;
  moneda: string;
  apertura: number;
  depositos: number;
  traspasosSalida: number;
  reversiones: number;
  cobroCheques: number;
  debitosRemesa: number;
  ingresosExternos: number;
  totalMovimientos: number;
  totalSistema: number;
  cierre: number;
  diferencia: number | null;
}

export interface BankDailySummaryReport {
  fecha: string;
  accounts: DailySummaryAccount[];
}

// ── Traspasos ──

export interface BankTransfer {
  id: number;
  origenAgencia: string;
  origenEntidad: string;
  origenCuenta: string;
  destinoAgencia: string;
  destinoEntidad: string;
  destinoCuenta: string;
  monto: number;
  estado: string;
  estadoDesc: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface BankTransfersReport {
  desde: string;
  hasta: string;
  total: number;
  transfers: BankTransfer[];
}
