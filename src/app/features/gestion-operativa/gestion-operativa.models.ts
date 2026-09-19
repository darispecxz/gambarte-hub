export interface MonedaSaldo {
  idMoneda: number;
  moneda: string;
  caja: number;
  boveda: number;
  banco: number;
  total: number;
  tcBob: number;
  totalBOB: number;
  minimoCaja: number | null;
  maximoCaja: number | null;
  alertas: Alerta[];
}

export interface SolicitudPendiente {
  id: number;
  moneda: string;
  monto: number;
  fecha: string;
  caja: string;
}

export interface AgenciaConsolidada {
  idAgencia: number;
  agencia: string;
  abreviatura: string;
  monedas: MonedaSaldo[];
  totalBOB: number;
  alertas: Alerta[];
  pendientes: SolicitudPendiente[];
}

export interface Consolidado {
  fecha: string;
  agencias: AgenciaConsolidada[];
  totales: Record<string, number>;
  monedas: string[];
  tc: Record<string, number>;
}

export interface Alerta {
  tipo: 'saldo_bajo' | 'saldo_excedido' | 'sin_apertura';
  mensaje: string;
  actual: number | null;
  umbral: number | null;
}

export interface AlertaAgencia {
  idAgencia: number;
  agencia: string;
  alertas: Alerta[];
  totalBOB: number | null;
}

export interface RecomendacionDestino {
  idAgencia: number;
  agencia: string;
  moneda: string;
  deficit: number;
  saldoCaja: number;
}

export interface OrigenPosible {
  idAgencia: number;
  agencia: string;
  moneda: string;
  excedenteCaja: number;
  disponibleBoveda: number;
  totalDisponible: number;
}

export interface Recomendacion {
  destino: RecomendacionDestino;
  origenesPosibles: OrigenPosible[];
}

export interface FondeoRemesaDestino {
  idAgencia: number;
  agencia: string;
  agenciaDestino?: string;
  idAgenciaDestino?: number;
  redirigida?: boolean;
  moneda: string;
  cantRemesas: number;
  totalRemesas: number;
  formaPago: 'transferencia' | 'efectivo';
  saldoBanco: number;
  saldoBoveda: number;
  saldoCaja: number;
  deficitCanal: number;
  fondosPropios: number;
  deficit: number;
  autoFondeable: boolean;
}

export interface FondeoRemesaOrigen {
  idAgencia: number;
  agencia: string;
  moneda: string;
  disponible: number;
  enBanco: number;
  enBoveda: number;
  enCaja: number;
}

export interface FondeoRemesa {
  destino: FondeoRemesaDestino;
  origenesPosibles: FondeoRemesaOrigen[];
}

export interface RecomendacionesResponse {
  porLimites: Recomendacion[];
  porRemesas: FondeoRemesa[];
}

export interface TransferenciaBoveda {
  id: number;
  agenciaOrigen: string;
  agenciaDestino: string;
  moneda: string;
  monto: number;
  fecha: string;
  estado: string;
  estadoDesc: string;
}

export interface SolicitudCajero {
  id: number;
  idAgencia: number;
  agencia: string;
  numCaja: string;
  cajero: string;
  moneda: string;
  monto: number;
  fecha: string;
}

export interface CajaMoneda {
  moneda: string;
  saldo: number;
  totalBOB: number;
  minimo: number | null;
  maximo: number | null;
}

export interface CajaDetalle {
  numCaja: string;
  cajero: string;
  monedas: CajaMoneda[];
  totalBOB: number;
}

export interface BovedaDetalle {
  moneda: string;
  saldo: number;
  totalBOB: number;
}

export interface BancoDetalle {
  cuenta: string;
  banco: string;
  moneda: string;
  saldo: number;
  totalBOB: number;
}

export interface DetalleAgencia {
  idAgencia: number;
  agencia: string;
  abreviatura: string;
  cajas: CajaDetalle[];
  bovedas: BovedaDetalle[];
  bancos: BancoDetalle[];
}

export interface TotalesPorCategoria {
  efectivo: number;
  boveda: number;
  banco: number;
  total: number;
}

export interface ActividadAgencia {
  idAgencia: number;
  agencia: string;
  cambios: number;
  giros: number;
  remesas: number;
  total: number;
}

export interface CotizacionActual {
  moneda: string;
  compra: number;
  venta: number;
  spread: number;
  tcOficial: number | null;
  tendencia: 'alza' | 'baja' | 'estable';
}

export interface ComparativaAgencia {
  idAgencia: number;
  agencia: string;
  hoy: number;
  ayer: number;
  delta: number;
  deltaPct: number;
}

export interface Comparativa {
  totalHoy: number;
  totalAyer: number;
  delta: number;
  deltaPct: number;
  porAgencia: ComparativaAgencia[];
}

export interface RendimientoCajero {
  numCaja: string;
  cajero: string;
  idAgencia: number;
  agencia: string;
  ops: number;
  opsHora: number;
  horasActivo: number;
  cambios: number;
  giros: number;
  remesas: number;
  pagos: number;
}

export interface ResumenEjecutivo {
  totalesPorCategoria: TotalesPorCategoria;
  actividadAgencias: ActividadAgencia[];
  cotizaciones: CotizacionActual[];
  comparativa: Comparativa;
  rendimientoCajeros: RendimientoCajero[];
}

// ── Conciliación de remesas ──

export interface ConciliacionResumen {
  pendientes: number;
  montoPendiente: number;
  pagadasHoy: number;
  montoPagado: number;
  atrasadas: number;
  totalRemesas: number;
}

export interface ConciliacionAgencia {
  idAgencia: number;
  agencia: string;
  pendientes: number;
  montoPendiente: number;
  pagadasHoy: number;
  montoPagado: number;
  atrasadas: number;
}

export interface ConciliacionRemesas {
  resumen: ConciliacionResumen;
  porAgencia: ConciliacionAgencia[];
}

// ── Movimientos del día ──

export interface MovimientoCambioResumen { cant: number; montoBob: number; }
export interface MovimientoCambios { compras: MovimientoCambioResumen; ventas: MovimientoCambioResumen; }
export interface MovimientoGiro { moneda: string; cant: number; monto: number; }
export interface MovimientoRemesa { cant: number; monto: number; formaPago: string; }
export interface MovimientoTransferencia { cant: number; monto: number; destino: string; }

export interface MovimientoAgencia {
  idAgencia: number;
  agencia: string;
  cambios: MovimientoCambios;
  giros: MovimientoGiro[];
  remesas: MovimientoRemesa[];
  depositos: number;
  montoDepositos: number;
  transferencias: MovimientoTransferencia[];
}

// ── Cotizaciones por agencia ──

export interface CotizacionAgencia {
  idAgencia: number;
  agencia: string;
  moneda: string;
  compra: number;
  venta: number;
  spread: number;
  oficialCompra: number | null;
  oficialVenta: number | null;
  diffCompra: number | null;
  diffVenta: number | null;
  ultimaModif: string;
}

// ── Gastos operativo ──

export interface GastosAcumuladoDia {
  dia: number;
  gastoDelDia: number;
  ingresoDelDia: number;
  gastoAcumulado: number;
  ingresoAcumulado: number;
}

export interface GastosSubcuenta {
  codsubcuenta: string;
  descripcion: string;
  total: number;
}

export interface GastosCategoria {
  key: string;
  label: string;
  icon: string;
  total: number;
  subcuentas: GastosSubcuenta[];
}

export interface GastosAgencia {
  agenciaId: number;
  nombre: string;
  total: number;
  ingresos: number;
  balance: number;
  cobertura: number;
  esAdministrativa: boolean;
  cuotaCentral: number;
  balanceNeto: number;
}

export interface GastosCategoriaMeta {
  key: string;
  label: string;
  icon: string;
}

export interface GastosAsiento {
  idasiento: number;
  fecha: string;
  concepto: string;
  debe: number;
}

export interface GastosDetalleSubcuenta {
  codsubcuenta: string;
  total: number;
  asientos: GastosAsiento[];
}

export interface GastosAgenciaAsiento {
  idasiento: number;
  fecha: string;
  concepto: string;
  codsubcuenta: string;
  debe: number;
}

export interface GastosAgenciaDetalle {
  agenciaId: number;
  nombre: string;
  esAdministrativa: boolean;
  totalGastos: number;
  totalIngresos: number;
  balance: number;
  cobertura: number;
  categorias: GastosCategoria[];
  asientos: GastosAgenciaAsiento[];
}

export interface GastosOperativoResumen {
  mes: string;
  diasMes: number;
  diaActual: number;
  totalGastos: number;
  totalIngresos: number;
  balance: number;
  cobertura: number;
  proyeccion: number;
  acumulado: GastosAcumuladoDia[];
  categorias: GastosCategoria[];
  agencias: GastosAgencia[];
  categoriaMeta: GastosCategoriaMeta[];
}
