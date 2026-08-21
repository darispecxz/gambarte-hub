export type OpReportType = 'cambios' | 'giros' | 'remesas';

export interface OpReportTab {
  key: OpReportType;
  label: string;
  icon: string;
}

// ── Cambios ──

export interface CambioRow {
  id: number;
  idOperacion: number;
  tipo: 'COMPRA' | 'VENTA';
  tipoDesc: string;
  idAgencia: number;
  agencia: string;
  operador: string;
  usuarioFinanciero: string;
  telefonoUf: string;
  documento: string;
  moneda: string;
  monedaRecibida: string;
  monedaEntregada: string;
  monto: number;
  tipoCambio: number;
  tipoCambioBob: number;
  totalOperacion: number;
  totalOperacionBob: number;
  recibido: number;
  entregado: number;
  fecha: string;
  facturado: number;
}

export interface CambioDetail {
  id: number;
  idOperacion: number;
  tipo: 'COMPRA' | 'VENTA';
  tipoDesc: string;
  agencia: string;
  operador: string;
  fecha: string;
  cliente: PersonInfo;
  monedaRecibida: string;
  monedaRecibidaDesc: string;
  monedaEntregada: string;
  monedaEntregadaDesc: string;
  monto: number;
  tipoCambio: number;
  tipoCambioBob: number;
  totalOperacion: number;
  totalOperacionBob: number;
  recibido: number;
  entregado: number;
  cambio: number;
  totalCambio: number;
  facturado: number;
  origen: string;
  destino: string;
  factura: FacturaInfo | null;
}

// ── Giros ──

export interface GiroRow {
  id: number;
  codigo: number;
  idAgenciaOrigen: number;
  agenciaOrigen: string;
  idAgenciaDestino: number;
  agenciaDestino: string;
  operador: string;
  usuarioFinanciero: string;
  telefonoUf: string;
  documento: string;
  destinatario: string;
  telefonoDest: string;
  moneda: string;
  monto: number;
  tipoCambio: number;
  totalCambio: number;
  comision: number;
  comisionBob: number;
  itf: number;
  total: number;
  totalBob: number;
  fecha: string;
  fechaPago: string;
  estado: number;
  estadoDesc: string;
  correlativoOrigen: string;
  correlativoDestino: string;
}

export interface GiroDetail {
  id: number;
  codigo: number;
  tipo: string;
  agenciaOrigen: string;
  agenciaDestino: string;
  operador: string;
  fecha: string;
  fechaPago: string;
  estado: number;
  estadoDesc: string;
  remitente: PersonInfo;
  destinatario: PersonInfo;
  monedaRecibida: string;
  monedaRecibidaDesc: string;
  monedaEntregada: string;
  monedaEntregadaDesc: string;
  monto: number;
  tipoCambio: number;
  totalCambio: number;
  comision: number;
  comisionBob: number;
  itf: number;
  total: number;
  totalBob: number;
  correlativoOrigen: string;
  correlativoDestino: string;
  origen: string;
  destino: string;
  factura: FacturaInfo | null;
  pago: PagoInfo | null;
}

// ── Remesas ──

export interface RemesaRow {
  id: number;
  codigo: number;
  idAgencia: number;
  agencia: string;
  operador: string;
  usuarioFinanciero: string;
  telefonoUf: string;
  documento: string;
  destinatario: string;
  telefonoDest: string;
  destino: string;
  moneda: string;
  subtipo: string;
  subtipoDesc: string;
  monto: number;
  tipoCambio: number;
  totalCambio: number;
  comision: number;
  comisionBob: number;
  comisionGambarte: number;
  gastosCorresponsal: number;
  iva: number;
  itf: number;
  total: number;
  totalBob: number;
  fecha: string;
  fechaPago: string;
  estado: number;
  estadoDesc: string;
  correlativo: string;
}

export interface RemesaDetail {
  id: number;
  codigo: number;
  tipo: string;
  subtipo: string;
  agencia: string;
  destino: string;
  operador: string;
  fecha: string;
  fechaPago: string;
  estado: number;
  estadoDesc: string;
  remitente: PersonInfo;
  destinatario: PersonInfo;
  monedaRecibida: string;
  monedaRecibidaDesc: string;
  monedaEntregada: string;
  monedaEntregadaDesc: string;
  monto: number;
  tipoCambio: number;
  totalCambio: number;
  comision: number;
  comisionBob: number;
  comisionGambarte: number;
  gastosCorresponsal: number;
  iva: number;
  itf: number;
  total: number;
  totalBob: number;
  correlativo: string;
  origen: string;
  destinoNarr: string;
  factura: FacturaInfo | null;
  pago: PagoInfo | null;
}

// ── Shared ──

export interface PersonInfo {
  nombre: string;
  documento?: string;
  telefono: string;
  domicilio?: string;
}

export interface FacturaInfo {
  numero: string;
  fecha: string;
  hora: string;
  nit: string;
  nombre: string;
  detalle: string;
  importe: number;
  autorizacion: string;
  agencia: string;
}

export interface PagoInfo {
  id: number;
  tipoPago: string;
  agencia: string;
  operador: string;
  moneda: string;
  monto: number;
  tipoCambio: number;
  totalCambio: number;
  totalBob: number;
  fecha: string;
  comprobante: string;
  comisionBob: number;
  motivo: string;
  documento: string;
}

export interface OpReportResponse<T> {
  desde: string;
  hasta: string;
  total: number;
  records: T[];
}

export interface Agency {
  id_agencia: number;
  descripcion: string;
}
