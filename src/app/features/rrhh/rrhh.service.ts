import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Envelope } from '../../core/models';
import {
  Dashboard, Empleado, EmpleadoDetalle, ParametrosResponse,
  Planilla, PlanillaDetalle, PlanillaPreview, Liquidacion,
  SimulacionLiquidacion, Capacitacion, SaldoVacaciones,
  AsistenciaResumen, ControlJornada, AsistenciaDetalle, AsistenciaDetalleResponse,
  VacacionResumen, Cronograma, RegistroAsistencia,
  PlantillaDocumento, DocumentoGenerado, DocumentoResultado,
  CsbpAlta, CsbpBaja, CsbpAporte, CsbpDashboard, CsbpResumenAnual,
  Gestora, ContribucionAfp, ResumenContribuciones, EmpleadoSinGestora,
  Finiquito, FiniquitoCalculo,
  TributariaLinea, TributariaResult, TributariaAnual,
  Horario, AsignacionHorario, ResumenSemanal,
  Contrato,
} from './rrhh.models';

@Injectable({ providedIn: 'root' })
export class RrhhService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  private unwrap<T>(o: Observable<Envelope<T>>): Observable<T> {
    return o.pipe(map((r) => {
      if (!r || !r.success) throw new Error(r?.message ?? 'Error de la API');
      return r.data;
    }));
  }

  private qp(params: Record<string, string | number | undefined | null>): HttpParams {
    let p = new HttpParams();
    for (const k of Object.keys(params)) {
      const v = params[k];
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    }
    return p;
  }

  // ── Dashboard ──
  getDashboard(agencia?: number): Observable<Dashboard> {
    return this.unwrap(
      this.http.get<Envelope<Dashboard>>(`${this.base}/rrhh/dashboard`, {
        params: this.qp({ agencia }),
      })
    );
  }

  // ── Empleados ──
  getEmpleados(estado?: string, agencia?: number, buscar?: string): Observable<Empleado[]> {
    return this.unwrap(
      this.http.get<Envelope<Empleado[]>>(`${this.base}/rrhh/empleados`, {
        params: this.qp({ estado, agencia, buscar }),
      })
    );
  }

  getCatalogoCargos(): Observable<{id: number; nombre: string}[]> {
    return this.unwrap(
      this.http.get<Envelope<{id: number; nombre: string}[]>>(`${this.base}/rrhh/catalogos/cargos`)
    );
  }

  getCatalogoAgencias(): Observable<{id: number; nombre: string}[]> {
    return this.unwrap(
      this.http.get<Envelope<{id: number; nombre: string}[]>>(`${this.base}/rrhh/catalogos/agencias`)
    );
  }

  getEmpleadoDetalle(id: number): Observable<EmpleadoDetalle> {
    return this.unwrap(
      this.http.get<Envelope<EmpleadoDetalle>>(`${this.base}/rrhh/empleados/${id}`)
    );
  }

  getSaldoVacaciones(id: number, ejercicio: number): Observable<SaldoVacaciones> {
    return this.unwrap(
      this.http.get<Envelope<SaldoVacaciones>>(`${this.base}/rrhh/empleados/${id}/vacaciones`, {
        params: this.qp({ ejercicio }),
      })
    );
  }

  // ── Parámetros ──
  getParametros(ejercicio: number): Observable<ParametrosResponse> {
    return this.unwrap(
      this.http.get<Envelope<ParametrosResponse>>(`${this.base}/rrhh/parametros`, {
        params: this.qp({ ejercicio }),
      })
    );
  }

  crearParametro(data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/parametros`, data)
    );
  }

  actualizarParametro(id: number, data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.put<Envelope<any>>(`${this.base}/rrhh/parametros/${id}`, data)
    );
  }

  getGestiones(): Observable<{ gestion: number }[]> {
    return this.unwrap(
      this.http.get<Envelope<{ gestion: number }[]>>(`${this.base}/rrhh/gestiones`)
    );
  }

  // ── Feriados ──
  crearFeriado(data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/feriados`, data)
    );
  }

  actualizarFeriado(id: number, data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.put<Envelope<any>>(`${this.base}/rrhh/feriados/${id}`, data)
    );
  }

  eliminarFeriado(id: number): Observable<any> {
    return this.unwrap(
      this.http.delete<Envelope<any>>(`${this.base}/rrhh/feriados/${id}`)
    );
  }

  // ── Contratos ──
  getContratos(idEmpleado?: number, estado?: string): Observable<Contrato[]> {
    return this.unwrap(
      this.http.get<Envelope<Contrato[]>>(`${this.base}/rrhh/contratos`, {
        params: this.qp({ id_empleado: idEmpleado, estado }),
      })
    );
  }

  getContratoDetalle(id: number): Observable<Contrato> {
    return this.unwrap(
      this.http.get<Envelope<Contrato>>(`${this.base}/rrhh/contratos/${id}`)
    );
  }

  crearContrato(data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/contratos`, data)
    );
  }

  actualizarContrato(id: number, data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.put<Envelope<any>>(`${this.base}/rrhh/contratos/${id}`, data)
    );
  }

  rescindirContrato(id: number, data?: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/contratos/${id}/rescindir`, data ?? {})
    );
  }

  // ── Planillas ──
  getPlanillas(ejercicio: number, agencia?: number): Observable<Planilla[]> {
    return this.unwrap(
      this.http.get<Envelope<Planilla[]>>(`${this.base}/rrhh/planillas`, {
        params: this.qp({ ejercicio, agencia }),
      })
    );
  }

  getPlanillaDetalle(id: number): Observable<PlanillaDetalle> {
    return this.unwrap(
      this.http.get<Envelope<PlanillaDetalle>>(`${this.base}/rrhh/planillas/${id}`)
    );
  }

  getPlanillaPreview(ejercicio: number, mes: number, agencia?: number): Observable<PlanillaPreview> {
    return this.unwrap(
      this.http.get<Envelope<PlanillaPreview>>(`${this.base}/rrhh/planillas/preview`, {
        params: this.qp({ ejercicio, mes, agencia }),
      })
    );
  }

  generarPlanilla(ejercicio: number, mes: number, agencia?: number): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/planillas/generar`, { ejercicio, mes, agencia })
    );
  }

  getAsistenciaResumen(ejercicio: number, mes: number, agencia?: number): Observable<AsistenciaResumen[]> {
    return this.unwrap(
      this.http.get<Envelope<AsistenciaResumen[]>>(`${this.base}/rrhh/planillas/asistencia`, {
        params: this.qp({ ejercicio, mes, agencia }),
      })
    );
  }

  // ── Asistencia ──
  getControlJornada(ejercicio: number, mes: number, agencia?: number): Observable<ControlJornada> {
    return this.unwrap(
      this.http.get<Envelope<ControlJornada>>(`${this.base}/rrhh/planillas/control-jornada`, {
        params: this.qp({ ejercicio, mes, agencia }),
      })
    );
  }

  registrarAsistencia(data: RegistroAsistencia): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/planillas/asistencia`, data)
    );
  }

  getAsistenciaDetalle(idEmpleado: number, ejercicio: number, mes: number): Observable<AsistenciaDetalleResponse> {
    return this.unwrap(
      this.http.get<Envelope<AsistenciaDetalleResponse>>(`${this.base}/rrhh/planillas/asistencia/${idEmpleado}`, {
        params: this.qp({ ejercicio, mes }),
      })
    );
  }

  // ── Liquidaciones ──
  getLiquidaciones(estado?: string): Observable<Liquidacion[]> {
    return this.unwrap(
      this.http.get<Envelope<Liquidacion[]>>(`${this.base}/rrhh/liquidaciones`, {
        params: this.qp({ estado }),
      })
    );
  }

  getLiquidacionDetalle(id: number): Observable<Liquidacion> {
    return this.unwrap(
      this.http.get<Envelope<Liquidacion>>(`${this.base}/rrhh/liquidaciones/${id}`)
    );
  }

  simularLiquidacion(idEmpleado: number, fecha: string, motivo: string): Observable<SimulacionLiquidacion> {
    return this.unwrap(
      this.http.get<Envelope<SimulacionLiquidacion>>(`${this.base}/rrhh/liquidaciones/simular`, {
        params: this.qp({ id_empleado: idEmpleado, fecha, motivo }),
      })
    );
  }

  // ── Vacaciones ──
  getVacacionesResumen(ejercicio: number, agencia?: number): Observable<VacacionResumen> {
    return this.unwrap(
      this.http.get<Envelope<VacacionResumen>>(`${this.base}/rrhh/vacaciones`, {
        params: this.qp({ ejercicio, agencia }),
      })
    );
  }

  getCronograma(ejercicio: number): Observable<Cronograma> {
    return this.unwrap(
      this.http.get<Envelope<Cronograma>>(`${this.base}/rrhh/vacaciones/cronograma`, {
        params: this.qp({ ejercicio }),
      })
    );
  }

  solicitarVacacion(data: { id_empleado: number; fecha_inicio: string; fecha_fin: string; tipo: string; observaciones?: string }, ejercicio: number): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/vacaciones/solicitar?ejercicio=${ejercicio}`, data)
    );
  }

  aprobarVacacion(id: number): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/vacaciones/${id}/aprobar`, {})
    );
  }

  rechazarVacacion(id: number, motivo?: string): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/vacaciones/${id}/rechazar`, { motivo })
    );
  }

  // ── Capacitaciones ──
  getCapacitaciones(tipo?: string, estado?: string): Observable<Capacitacion[]> {
    return this.unwrap(
      this.http.get<Envelope<Capacitacion[]>>(`${this.base}/rrhh/capacitaciones`, {
        params: this.qp({ tipo, estado }),
      })
    );
  }

  getCapacitacionDetalle(id: number): Observable<any> {
    return this.unwrap(
      this.http.get<Envelope<any>>(`${this.base}/rrhh/capacitaciones/${id}`)
    );
  }

  crearCapacitacion(data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/capacitaciones`, data)
    );
  }

  actualizarCapacitacion(id: number, data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.put<Envelope<any>>(`${this.base}/rrhh/capacitaciones/${id}`, data)
    );
  }

  inscribirCapacitacion(id: number, data: { id_empleado: number }): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/capacitaciones/${id}/inscribir`, data)
    );
  }

  calificarCapacitacion(idCapacitacion: number, idEmpleado: number, data: { nota: number; estado: string }): Observable<any> {
    return this.unwrap(
      this.http.put<Envelope<any>>(`${this.base}/rrhh/capacitaciones/${idCapacitacion}/calificar/${idEmpleado}`, data)
    );
  }

  // ── Evaluaciones ──
  getEvaluaciones(idEmpleado?: number): Observable<any[]> {
    return this.unwrap(
      this.http.get<Envelope<any[]>>(`${this.base}/rrhh/evaluaciones`, {
        params: this.qp({ id_empleado: idEmpleado }),
      })
    );
  }

  getEvaluacionDetalle(id: number): Observable<any> {
    return this.unwrap(
      this.http.get<Envelope<any>>(`${this.base}/rrhh/evaluaciones/${id}`)
    );
  }

  crearEvaluacion(data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/evaluaciones`, data)
    );
  }

  actualizarEvaluacion(id: number, data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.put<Envelope<any>>(`${this.base}/rrhh/evaluaciones/${id}`, data)
    );
  }

  // ── Documentos ──
  getPlantillas(): Observable<PlantillaDocumento[]> {
    return this.unwrap(
      this.http.get<Envelope<PlantillaDocumento[]>>(`${this.base}/rrhh/documentos/plantillas`)
    );
  }

  getDocumentosGenerados(): Observable<DocumentoGenerado[]> {
    return this.unwrap(
      this.http.get<Envelope<DocumentoGenerado[]>>(`${this.base}/rrhh/documentos/generados`)
    );
  }

  generarDocumento(data: Record<string, any>): Observable<DocumentoResultado> {
    return this.unwrap(
      this.http.post<Envelope<DocumentoResultado>>(`${this.base}/rrhh/documentos/generar`, data)
    );
  }

  // ── CSBP (Caja Nacional de Salud) ──
  getCsbpDashboard(): Observable<CsbpDashboard> {
    return this.unwrap(
      this.http.get<Envelope<CsbpDashboard>>(`${this.base}/rrhh/csbp/dashboard`)
    );
  }

  getCsbpAltas(estado?: string): Observable<CsbpAlta[]> {
    return this.unwrap(
      this.http.get<Envelope<CsbpAlta[]>>(`${this.base}/rrhh/csbp/altas`, {
        params: this.qp({ estado }),
      })
    );
  }

  getCsbpBajas(estado?: string): Observable<CsbpBaja[]> {
    return this.unwrap(
      this.http.get<Envelope<CsbpBaja[]>>(`${this.base}/rrhh/csbp/bajas`, {
        params: this.qp({ estado }),
      })
    );
  }

  getCsbpAportes(ejercicio: number): Observable<CsbpAporte[]> {
    return this.unwrap(
      this.http.get<Envelope<CsbpAporte[]>>(`${this.base}/rrhh/csbp/aportes`, {
        params: this.qp({ ejercicio }),
      })
    );
  }

  getCsbpResumen(ejercicio: number): Observable<CsbpResumenAnual> {
    return this.unwrap(
      this.http.get<Envelope<CsbpResumenAnual>>(`${this.base}/rrhh/csbp/aportes/resumen`, {
        params: this.qp({ ejercicio }),
      })
    );
  }

  crearCsbpAlta(data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/csbp/altas`, data)
    );
  }

  actualizarCsbpAlta(id: number, data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.put<Envelope<any>>(`${this.base}/rrhh/csbp/altas/${id}`, data)
    );
  }

  crearCsbpBaja(data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/csbp/bajas`, data)
    );
  }

  crearCsbpAporte(data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/csbp/aportes`, data)
    );
  }

  // ── Gestoras AFP ──
  getGestoras(estado?: string): Observable<Gestora[]> {
    return this.unwrap(
      this.http.get<Envelope<Gestora[]>>(`${this.base}/rrhh/gestoras`, {
        params: this.qp({ estado }),
      })
    );
  }

  crearGestora(data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/gestoras`, data)
    );
  }

  actualizarGestora(id: number, data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.put<Envelope<any>>(`${this.base}/rrhh/gestoras/${id}`, data)
    );
  }

  getContribuciones(ejercicio: number, gestora?: string): Observable<ContribucionAfp[]> {
    return this.unwrap(
      this.http.get<Envelope<ContribucionAfp[]>>(`${this.base}/rrhh/gestoras/contribuciones`, {
        params: this.qp({ ejercicio, gestora }),
      })
    );
  }

  crearContribucion(data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/gestoras/contribuciones`, data)
    );
  }

  getResumenContribuciones(ejercicio: number): Observable<ResumenContribuciones> {
    return this.unwrap(
      this.http.get<Envelope<ResumenContribuciones>>(`${this.base}/rrhh/gestoras/contribuciones/resumen`, {
        params: this.qp({ ejercicio }),
      })
    );
  }

  getEmpleadosSinGestora(): Observable<EmpleadoSinGestora[]> {
    return this.unwrap(
      this.http.get<Envelope<EmpleadoSinGestora[]>>(`${this.base}/rrhh/gestoras/sin-gestora`)
    );
  }

  // ── Finiquitos ──
  getFiniquitos(estado?: string): Observable<Finiquito[]> {
    return this.unwrap(
      this.http.get<Envelope<Finiquito[]>>(`${this.base}/rrhh/finiquitos`, {
        params: this.qp({ estado }),
      })
    );
  }

  getFiniquitoDetalle(id: number): Observable<Finiquito> {
    return this.unwrap(
      this.http.get<Envelope<Finiquito>>(`${this.base}/rrhh/finiquitos/${id}`)
    );
  }

  calcularFiniquito(idEmpleado: number, fechaRetiro: string, motivo: string): Observable<FiniquitoCalculo> {
    return this.unwrap(
      this.http.get<Envelope<FiniquitoCalculo>>(`${this.base}/rrhh/finiquitos/calcular`, {
        params: this.qp({ id_empleado: idEmpleado, fecha_retiro: fechaRetiro, motivo }),
      })
    );
  }

  guardarFiniquito(data: { id_empleado: number; fecha_retiro: string; motivo: string }): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/finiquitos/guardar`, data)
    );
  }

  // ── Planilla Tributaria (RC-IVA) ──
  getTributaria(ejercicio: number, mes: number): Observable<TributariaLinea[]> {
    return this.unwrap(
      this.http.get<Envelope<TributariaLinea[]>>(`${this.base}/rrhh/tributaria`, {
        params: this.qp({ ejercicio, mes }),
      })
    );
  }

  calcularTributaria(ejercicio: number, mes: number, agencia?: number): Observable<TributariaResult> {
    return this.unwrap(
      this.http.get<Envelope<TributariaResult>>(`${this.base}/rrhh/tributaria/calcular`, {
        params: this.qp({ ejercicio, mes, agencia }),
      })
    );
  }

  getTributariaEmpleado(idEmpleado: number, ejercicio: number, mes: number): Observable<TributariaLinea> {
    return this.unwrap(
      this.http.get<Envelope<TributariaLinea>>(`${this.base}/rrhh/tributaria/empleado/${idEmpleado}`, {
        params: this.qp({ ejercicio, mes }),
      })
    );
  }

  getTributariaAnual(idEmpleado: number, ejercicio: number): Observable<TributariaAnual[]> {
    return this.unwrap(
      this.http.get<Envelope<TributariaAnual[]>>(`${this.base}/rrhh/tributaria/empleado/${idEmpleado}/anual`, {
        params: this.qp({ ejercicio }),
      })
    );
  }

  // ── Horarios ──
  getHorarios(): Observable<Horario[]> {
    return this.unwrap(
      this.http.get<Envelope<Horario[]>>(`${this.base}/rrhh/horarios`)
    );
  }

  crearHorario(data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/horarios`, data)
    );
  }

  actualizarHorario(id: number, data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.put<Envelope<any>>(`${this.base}/rrhh/horarios/${id}`, data)
    );
  }

  desactivarHorario(id: number): Observable<any> {
    return this.unwrap(
      this.http.delete<Envelope<any>>(`${this.base}/rrhh/horarios/${id}`)
    );
  }

  asignarHorario(data: Record<string, any>): Observable<any> {
    return this.unwrap(
      this.http.post<Envelope<any>>(`${this.base}/rrhh/horarios/asignar`, data)
    );
  }

  getAsignacionesHorario(agencia?: number): Observable<AsignacionHorario[]> {
    return this.unwrap(
      this.http.get<Envelope<AsignacionHorario[]>>(`${this.base}/rrhh/horarios/asignaciones`, {
        params: this.qp({ agencia }),
      })
    );
  }

  getEmpleadosSinHorario(): Observable<EmpleadoSinGestora[]> {
    return this.unwrap(
      this.http.get<Envelope<EmpleadoSinGestora[]>>(`${this.base}/rrhh/horarios/sin-horario`)
    );
  }

  getResumenSemanal(idContrato: number, fecha?: string): Observable<ResumenSemanal> {
    return this.unwrap(
      this.http.get<Envelope<ResumenSemanal>>(`${this.base}/rrhh/horarios/contrato/${idContrato}/resumen`, {
        params: this.qp({ fecha }),
      })
    );
  }
}
