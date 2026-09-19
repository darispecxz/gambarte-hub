export type UifReportType = 'pcc' | 'cambios' | 'giros' | 'remesas' | 'usuario';

export interface UifReportTab {
  key: UifReportType;
  label: string;
  icon: string;
}

// PCC Report row (from v_pcc06_uif / v_pcc08 views)
export interface PccRow {
  fecha: string;
  zona: string;
  direccion: string;
  telefono: string;
  funcionario: string;
  nom_usu: string;
  pat_usu: string;
  mat_usu: string;
  tipo_doc_usu: string;
  doc_usu: string;
  ext_usu: string;
  pais_usu: string;
  pais_residencia: string;
  profesion: string;
  actividad_economica: string;
  lugar_trabajo: string;
  cargo: string;
  dir_trab: string;
  ciudad_usu: string;
  dir_usu: string;
  tel_usu: string;
  nom_ben: string;
  pat_ben: string;
  mat_ben: string;
  tipo_doc_ben: string;
  doc_ben: string;
  ext_ben: string;
  ciudad_ben: string;
  dir_ben: string;
  tel_ben: string;
  operacion: string;
  moneda: string;
  monto: number;
  pais_origen: string;
  pais_destino: string;
  origen_dinero: string;
  destino_dinero: string;
  // PCC-06 specific
  id_cambio?: number;
  // PCC-08 specific
  id_operacion?: number;
  id_transaccion?: number;
}

// Cambio UIF row
export interface CambioUifRow {
  id_cambio: number;
  id_operacion: number;
  tipo_operacion: string;
  fecha: string;
  usuario: string;
  usu_financiero: string;
  fec_nacimiento: string;
  edad: number;
  tipo_doc: string;
  doc_identidad: string;
  exp: string;
  descripcion: string;
  act_econo: string;
  PEP: string;
  pais_residencia: string;
  domicilio: string;
  celular: string;
  ciudad_agencia: string;
  agencia: string;
  mon_rec: string;
  monto_recibido: number;
  TC: number;
  mon_entregada: string;
  monto_entregado: number;
  pais_transaccion: string;
  total_operacion_bob: number;
  dpto_transaccion: string;
  facturado: number;
  tipo_cambio: number;
  origen: string;
  destino: string;
}

// Giro UIF row
export interface GiroUifRow {
  ID_GIRO: number;
  CODIGO: number;
  FECHA: string;
  USUARIO: string;
  usuario_financiero: string;
  fecha_nacimiento: string;
  EDAD: number;
  tipo_doc: string;
  doc_identidad: string;
  EXTENSION: string;
  DESCRIPCION: string;
  act_economica: string;
  PEP: string;
  pais_residencia: string;
  domicilio: string;
  celular: string;
  ciudad_agencia: string;
  agencia_origen: string;
  agencia_destino: string;
  tipo_operacion: string;
  ESTADO: string;
  mon_rec: string;
  valor_giro: number;
  mon_entregada: string;
  valor_bob: number;
  pais_transaccion: string;
  dpto_transaccion: string;
  FACTURADO: number;
  tipo_cambio: number;
  origen: string;
  destino: string;
}

// Remesa UIF row
export interface RemesaUifRow {
  id_remesa: number;
  codigo: number;
  fecha: string;
  usuario: string;
  nro_oper: number;
  canal_distrib: string;
  usuario_financiero: string;
  fecha_nacimiento: string;
  edad: number;
  tipo_doc: string;
  nacionalidad: string;
  doc_identidad: string;
  EXTENSION: string;
  DESCRIPCION: string;
  act_economica: string;
  pep: string;
  pais_residencia: string;
  DOMICILIO: string;
  CELULAR: string;
  ciudad_agencia: string;
  agencia_origen: string;
  agencia_destino: string;
  tipo_operacion: string;
  estado: string;
  moneda_rec: string;
  valor: number;
  moneda_entr: string;
  valor_bob: number;
  pais_transaccion: string;
  dpto_transaccion: string;
  FACTURADO: number;
  impresion_pcc08: string;
  comision_bob: number;
  tipo_cambio: number;
  origen: string;
  destino: string;
}

// Usuario Financiero row (from v_ouf view)
export interface UsuarioFinancieroRow {
  id_transaccion: number;
  numero: string;
  id_operacion: number;
  id_agencia: number;
  nombres: string;
  ape_pat: string;
  ape_mat: string;
  id_tipo_doc_identidad: number;
  num_doc_identidad: string;
  id_expedicion: number;
  fecha: string;
  moneda: number;
  monto: number;
  tipo_cambio: number;
  comision_bob: number;
  total_operacion_bob: number;
  codigo: string;
  origen: string;
  destinatario: string | null;
  fuente: string;
  tipo_operacion: string;
  agencia: string;
  chile_ordenante?: string;
  chile_destinatario?: string;
  chile_doc_des?: string;
  chile_fec_envio?: string;
  chile_tipo?: string;
}

export interface UifReportResponse<T> {
  desde?: string;
  hasta?: string;
  total: number;
  records: T[];
}

export interface Agency {
  id_agencia: number;
  descripcion: string;
}
