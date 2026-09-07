export interface Empleado {
  id: number;
  cod_trab: number | null;
  ci: string;
  ci_expedido: string | null;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  estado_civil: string | null;
  telefono: string | null;
  email_personal: string | null;
  nua_cua: string | null;
  nro_asegurado_cns: string | null;
  estado: string;
  foto_url: string | null;
  id_contrato: number | null;
  tipo_contrato: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  sueldo_base: number | null;
  estado_contrato: string | null;
  cargo: string | null;
  area: string | null;
  nivel: string | null;
  agencia: string | null;
  profesion?: string | null;
  direccion?: string | null;
  telefono_fijo?: string | null;
  lugar_nacimiento?: string | null;
  login_usu?: string | null;
  email_corp?: string | null;
  fecha_registro_sistema?: string | null;
  roles?: { descripcion: string; abreviatura: string }[];
}

export interface EmpleadoDetalle {
  empleado: Empleado;
  contratos: Contrato[];
  vacaciones: Vacacion[];
  capacitaciones: CapacitacionEmpleado[];
  evaluaciones: Evaluacion[];
}

export interface Contrato {
  id: number;
  id_empleado: number;
  id_cargo: number;
  id_agencia: number;
  tipo_contrato: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  sueldo_base: number;
  estado: string;
  cargo: string | null;
  area: string | null;
  agencia: string | null;
}

export interface Vacacion {
  id: number;
  id_empleado: number;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  estado: string;
  observaciones: string | null;
}

export interface CapacitacionEmpleado {
  id: number;
  id_capacitacion: number;
  titulo: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  es_obligatoria: boolean;
  estado: string;
  nota: number | null;
}

export interface Evaluacion {
  id: number;
  periodo: string;
  puntaje: number | null;
  categoria: string | null;
  estado: string;
}

export interface Dashboard {
  total_activos: number;
  por_tipo_contrato: { tipo_contrato: string; total: number }[];
  por_area: { area: string; total: number }[];
  contratos_prox_vencer: ContratoAlerta[];
  vacaciones_pendientes: VacacionPendiente[];
  capacitaciones_obligatorias_pendientes: number;
}

export interface ContratoAlerta {
  id: number;
  fecha_fin: string;
  tipo_contrato: string;
  empleado: string;
  cargo: string | null;
  agencia: string | null;
  dias_restantes: number;
}

export interface VacacionPendiente {
  id: number;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  estado: string;
  empleado: string;
}

export interface ParametroGestion {
  id: number;
  gestion: number;
  codigo: string;
  valor: number;
  descripcion: string;
  norma_referencia: string | null;
}

export interface Feriado {
  id: number;
  fecha: string;
  nombre: string;
  tipo: string;
}

export interface ParametrosResponse {
  gestion: string;
  parametros: ParametroGestion[];
  bono_antiguedad: EscalaBono[];
  vacaciones: EscalaVacaciones[];
  feriados: Feriado[];
}

export interface EscalaBono {
  anios_desde: number;
  anios_hasta: number | null;
  porcentaje: number;
}

export interface EscalaVacaciones {
  anios_desde: number;
  anios_hasta: number | null;
  dias_habiles: number;
}

export interface Planilla {
  id: number;
  gestion: number;
  mes: number;
  id_agencia: number | null;
  estado: string;
  total_ganado: number;
  total_descuento: number;
  total_liquido: number;
  total_patronal: number;
  agencia: string | null;
}

export interface PlanillaDetalle {
  planilla: Planilla;
  detalle: PlanillaLinea[];
}

export interface PlanillaLinea {
  id_empleado: number;
  id_contrato: number;
  empleado: string;
  ci: string;
  cargo: string | null;
  sueldo_base: number;
  antiguedad_anios: number;
  bono_antiguedad: number;
  horas_extra: number;
  monto_horas_extra: number;
  dominicales_trab: number;
  monto_dominicales: number;
  total_ganado: number;
  aporte_afp: number;
  riesgo_comun: number;
  comision_afp: number;
  solidario_aseg: number;
  nacional_solidario: number;
  rciva: number;
  total_descuentos: number;
  liquido_pagable: number;
  pat_cns: number;
  pat_riesgo_prof: number;
  pat_provivienda: number;
  pat_solidario: number;
  total_patronal: number;
}

export interface PlanillaPreview {
  gestion: number;
  mes: number;
  id_agencia: number | null;
  lineas: PlanillaLinea[];
  total_ganado: number;
  total_descuento: number;
  total_liquido: number;
  total_patronal: number;
}

export interface Liquidacion {
  id: number;
  id_empleado: number;
  empleado: string;
  ci: string;
  cargo: string | null;
  fecha_desvinculacion: string;
  motivo: string;
  anios_trabajados: number;
  sueldo_promedio: number;
  indemnizacion: number;
  desahucio: number;
  aguinaldo_proporcional: number;
  vacaciones_pendientes: number;
  monto_vacaciones: number;
  doble_aguinaldo_prop: number;
  total_liquidacion: number;
  total_descuentos: number;
  liquido_final: number;
  estado: string;
}

export interface SimulacionLiquidacion extends Liquidacion {
  fecha_ingreso: string;
}

export interface Capacitacion {
  id: number;
  titulo: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  horas_duracion: number | null;
  es_obligatoria: boolean;
  estado: string;
  inscritos: number;
  aprobados: number;
}

export interface SaldoVacaciones {
  antiguedad_anios: number;
  dias_corresponde: number;
  dias_usados: number;
  saldo: number;
}

export interface AsistenciaResumen {
  id_empleado: number;
  empleado: string;
  registros: number;
  dias_trabajados: number;
  faltas: number;
  permisos: number;
  licencias: number;
  horas_extra: number;
  dominicales: number;
}

export interface ControlJornada {
  gestion: number;
  mes: number;
  resumen: AsistenciaResumenJornada[];
  alertas: AlertaJornada[];
  total_empleados: number;
  total_con_alertas: number;
}

export interface AsistenciaResumenJornada extends AsistenciaResumen {
  genero: string | null;
  jornada_diaria: number;
  jornada_semanal: number;
  horas_trabajadas: number;
  horas_esperadas: number;
  horas_max_mes: number;
  porcentaje_jornada: number;
  alertas: AlertaEmpleado[];
}

export interface AlertaEmpleado {
  tipo: string;
  severidad: string;
  mensaje: string;
}

export interface AlertaJornada {
  empleado: string;
  id_empleado: number;
  alertas: AlertaEmpleado[];
}

export interface AsistenciaDetalle {
  id: number;
  id_empleado: number;
  fecha: string;
  hora_entrada: string | null;
  hora_salida: string | null;
  am_ingreso: string | null;
  am_salida: string | null;
  pm_ingreso: string | null;
  pm_salida: string | null;
  horas_extra: number;
  atrasos_min: number;
  es_feriado: boolean | number;
  es_dominical: boolean | number;
  tipo: string;
  observaciones: string | null;
}

export interface AsistenciaDetalleResponse {
  empleado: string;
  cargo: string;
  lugar_trabajo: string;
  gestion: number;
  mes: number;
  registros: AsistenciaDetalle[];
  resumen: {
    dias_trabajados: number;
    faltas: number;
    feriados: number;
    atrasos_total: number;
    horas_extra_total: number;
  };
}

export interface VacacionResumen {
  gestion: number;
  pendientes_aprobacion: number;
  en_vacacion_hoy: number;
  proximas_30_dias: number;
  total_empleados: number;
  escala: EscalaVacaciones[];
  saldos: SaldoEmpleadoVacacion[];
  solicitudes: SolicitudVacacion[];
}

export interface SaldoEmpleadoVacacion {
  id: number;
  ci: string;
  empleado: string;
  cargo: string | null;
  area: string | null;
  agencia: string | null;
  fecha_ingreso: string;
  antiguedad_anios: number;
  dias_corresponde: number;
  dias_usados: number;
  dias_solicitados: number;
  saldo: number;
}

export interface SolicitudVacacion {
  id: number;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  estado: string;
  observaciones: string | null;
  created_at: string;
  empleado: string;
  cargo: string | null;
}

export interface Cronograma {
  gestion: number;
  meses: CronogramaMes[];
  leyenda: CronogramaEmpleado[];
  feriados: { fecha: string; nombre: string }[];
}

export interface CronogramaMes {
  mes: number;
  nombre: string;
  dias: CronogramaDia[];
}

export interface CronogramaDia {
  dia: number;
  dow: number;
  feriado: string | null;
  es_finde: boolean;
  empleados: { codigo: string; grupo: string; estado: string }[];
}

export interface CronogramaEmpleado {
  codigo: string;
  nombre: string;
  cargo: string | null;
  agencia: string;
  grupo: string;
}

export interface RegistroAsistencia {
  id_empleado: number;
  fecha: string;
  am_ingreso: string;
  am_salida: string;
  pm_ingreso: string;
  pm_salida: string;
  extras: number;
  atrasos: number;
  tipo: string;
  observaciones: string;
}

export interface PlantillaDocumento {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  norma: string;
  campos: string[];
}

export interface DocumentoGenerado {
  id: number;
  plantilla: string;
  nombre: string;
  empleado: string;
  fecha: string;
  categoria: string;
}

export interface DocumentoResultado {
  plantilla: string;
  titulo: string;
  empleado: string;
  fecha: string;
  contenido: string;
  norma: string;
}

// ── CSBP ──
export interface CsbpAlta {
  id: number;
  id_contrato: number;
  fecha_alta: string;
  fecha_fin: string | null;
  estado: string;
  descripcion: string | null;
  empleado: string;
  ci: string;
  cargo: string | null;
  agencia: string | null;
}

export interface CsbpBaja {
  id: number;
  id_contrato: number;
  fecha_baja: string;
  estado: string;
  descripcion: string | null;
  empleado: string;
  ci: string;
  cargo: string | null;
  agencia: string | null;
}

export interface CsbpAporte {
  id: number;
  gestion: number;
  mes: number;
  total_aporte: number;
  multas: number;
  intereses: number;
  total_cancelado: number;
  estado: string;
  fecha_presentacion: string | null;
  fecha_deposito: string | null;
}

export interface CsbpDashboard {
  altas_pendientes: number;
  bajas_pendientes: number;
  total_asegurados: number;
}

export interface CsbpResumenAnual {
  gestion: number;
  total_aportado: number;
  total_multas: number;
  total_cancelado: number;
  meses_presentados: number;
  meses_pendientes: number;
  detalle: CsbpAporte[];
}

// ── Gestoras AFP ──
export interface Gestora {
  id: number;
  id_contrato: number;
  nombre_gestora: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: string;
  empleado: string;
  ci: string;
  cargo: string | null;
  agencia: string | null;
}

export interface ContribucionAfp {
  id: number;
  nombre_gestora: string;
  gestion: number;
  mes: number;
  total_aporte_laboral: number;
  total_aporte_patronal: number;
  total_contribucion: number;
  estado: string;
}

export interface ResumenContribuciones {
  gestion: number;
  total_laboral: number;
  total_patronal: number;
  total_general: number;
  por_gestora: { gestora: string; total_laboral: number; total_patronal: number; total: number; meses_pagados: number }[];
  detalle: ContribucionAfp[];
}

export interface EmpleadoSinGestora {
  id: number;
  empleado: string;
  ci: string;
  cargo: string | null;
}

// ── Finiquito ──
export interface Finiquito {
  id: number;
  id_empleado: number;
  id_contrato: number;
  motivo_baja: string;
  fecha_ingreso: string;
  fecha_retiro: string;
  total_beneficios: number;
  total_deducciones: number;
  liquido_pagable: number;
  estado: string;
  empleado: string;
  ci: string;
  cargo: string | null;
  agencia: string | null;
}

export interface FiniquitoCalculo {
  id_empleado: number;
  id_contrato: number;
  cargo: string;
  motivo_baja: string;
  fecha_ingreso: string;
  fecha_retiro: string;
  anios_trabajados: number;
  meses_trabajados: number;
  dias_trabajados: number;
  remuneraciones: { mes: string; gestion: number; sueldo: number; bono_antiguedad: number; otros_bonos: number; total: number }[];
  promedio_indemnizacion: number;
  indemnizacion: number;
  desahucio: number;
  aguinaldo_navidad: number;
  doble_aguinaldo: number;
  vacaciones_dias: number;
  vacaciones_monto: number;
  prima: number;
  otros_beneficios: number;
  total_beneficios: number;
  retencion_rciva: number;
  otros_descuentos: number;
  total_deducciones: number;
  liquido_pagable: number;
}

// ── Planilla Tributaria ──
export interface TributariaLinea {
  id_empleado: number;
  ci: string;
  empleado: string;
  gestion: number;
  mes: number;
  total_ganado: number;
  total_aportes_laborales: number;
  smn_no_imponibles: number;
  importe_sujeto_impuesto: number;
  impuesto_rciva: number;
  credito_13pct_2smn: number;
  impuesto_neto: number;
  f110_casilla_693: number;
  saldo_favor_fisco: number;
  saldo_favor_dependiente: number;
  saldo_anterior_dependiente: number;
  mantenimiento_valor: number;
  saldo_anterior_actualizado: number;
  saldo_utilizado: number;
  rciva_retenido: number;
  saldo_credito_fiscal: number;
}

export interface TributariaResult {
  gestion: number;
  mes: number;
  lineas: TributariaLinea[];
  totales: { total_ganado: number; total_aportes: number; impuesto_rciva: number; impuesto_neto: number; rciva_retenido: number };
}

export interface TributariaAnual {
  mes: number;
  total_ganado: number;
  total_aportes_laborales: number;
  impuesto_rciva: number;
  impuesto_neto: number;
  f110_casilla_693: number;
  rciva_retenido: number;
  saldo_credito_fiscal: number;
}

// ── Horarios ──
export interface Horario {
  id: number;
  nombre: string;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  dias?: string;
}

export interface AsignacionHorario {
  id: number;
  id_contrato: number;
  id_horario: number;
  vigencia_desde: string;
  vigencia_hasta: string | null;
  horario_nombre: string;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  empleado: string;
  ci: string;
  cargo: string | null;
  agencia: string | null;
}

export interface ResumenSemanal {
  id_contrato: number;
  dias: { dia: string; turnos: { hora_inicio: string; hora_fin: string; horas: number }[]; total_horas: number }[];
  total_horas_semana: number;
}

export type RrhhTab = 'dashboard' | 'empleados' | 'planillas' | 'asistencia' | 'vacaciones' | 'liquidaciones' | 'capacitaciones' | 'documentos' | 'csbp' | 'gestoras' | 'finiquitos' | 'tributaria' | 'horarios' | 'parametros';

export type EmpleadoSubTab = 'personal' | 'laboral' | 'asistencia' | 'vacaciones' | 'documentos' | 'evaluaciones';
