import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Consolidado, AlertaAgencia, Recomendacion,
  TransferenciaBoveda, SolicitudCajero, DetalleAgencia,
  ResumenEjecutivo, RecomendacionesResponse,
  ConciliacionRemesas, MovimientoAgencia, CotizacionAgencia,
  GastosOperativoResumen, GastosDetalleSubcuenta, GastosAgenciaDetalle,
} from './gestion-operativa.models';

interface Envelope<T> { success: boolean; data: T; message: string; }

@Injectable({ providedIn: 'root' })
export class GestionOperativaService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/gestion-operativa`;

  private unwrap<T>(o: Observable<Envelope<T>>): Observable<T> {
    return o.pipe(map(r => {
      if (!r?.success) throw new Error(r?.message || 'Error de API');
      return r.data;
    }));
  }

  getConsolidado(fecha: string): Observable<Consolidado> {
    return this.unwrap(this.http.get<Envelope<Consolidado>>(
      `${this.base}/consolidado`, { params: new HttpParams().set('fecha', fecha) }
    ));
  }

  getAlertas(fecha: string): Observable<AlertaAgencia[]> {
    return this.unwrap(this.http.get<Envelope<AlertaAgencia[]>>(
      `${this.base}/alertas`, { params: new HttpParams().set('fecha', fecha) }
    ));
  }

  getRecomendaciones(fecha: string): Observable<RecomendacionesResponse> {
    return this.unwrap(this.http.get<Envelope<RecomendacionesResponse>>(
      `${this.base}/recomendaciones`, { params: new HttpParams().set('fecha', fecha) }
    ));
  }

  getTransferencias(fecha: string, agencia?: number): Observable<TransferenciaBoveda[]> {
    let params = new HttpParams().set('fecha', fecha);
    if (agencia) params = params.set('agencia', agencia.toString());
    return this.unwrap(this.http.get<Envelope<TransferenciaBoveda[]>>(
      `${this.base}/transferencias`, { params }
    ));
  }

  getSolicitudes(): Observable<SolicitudCajero[]> {
    return this.unwrap(this.http.get<Envelope<SolicitudCajero[]>>(
      `${this.base}/solicitudes`
    ));
  }

  getResumenEjecutivo(fecha: string): Observable<ResumenEjecutivo> {
    return this.unwrap(this.http.get<Envelope<ResumenEjecutivo>>(
      `${this.base}/resumen-ejecutivo`, { params: new HttpParams().set('fecha', fecha) }
    ));
  }

  getDetalleAgencia(fecha: string, agencia: number): Observable<DetalleAgencia> {
    const params = new HttpParams().set('fecha', fecha).set('agencia', agencia.toString());
    return this.unwrap(this.http.get<Envelope<DetalleAgencia>>(
      `${this.base}/detalle-agencia`, { params }
    ));
  }

  getConciliacionRemesas(fecha: string): Observable<ConciliacionRemesas> {
    return this.unwrap(this.http.get<Envelope<ConciliacionRemesas>>(
      `${this.base}/conciliacion-remesas`, { params: new HttpParams().set('fecha', fecha) }
    ));
  }

  getMovimientosDia(fecha: string): Observable<MovimientoAgencia[]> {
    return this.unwrap(this.http.get<Envelope<MovimientoAgencia[]>>(
      `${this.base}/movimientos-dia`, { params: new HttpParams().set('fecha', fecha) }
    ));
  }

  getCotizacionesAgencia(): Observable<CotizacionAgencia[]> {
    return this.unwrap(this.http.get<Envelope<CotizacionAgencia[]>>(
      `${this.base}/cotizaciones-agencia`
    ));
  }

  getGastosOperativo(mes: string): Observable<GastosOperativoResumen> {
    return this.unwrap(this.http.get<Envelope<GastosOperativoResumen>>(
      `${this.base}/gastos-operativo`, { params: new HttpParams().set('mes', mes) }
    ));
  }

  getGastosDetalleAgencia(mes: string, agenciaId: number): Observable<GastosAgenciaDetalle> {
    const params = new HttpParams().set('mes', mes).set('agencia', agenciaId.toString());
    return this.unwrap(this.http.get<Envelope<GastosAgenciaDetalle>>(
      `${this.base}/gastos-detalle-agencia`, { params }
    ));
  }

  getGastosDetalleSubcuenta(mes: string, codsubcuenta: string): Observable<GastosDetalleSubcuenta> {
    const params = new HttpParams().set('mes', mes).set('codsubcuenta', codsubcuenta);
    return this.unwrap(this.http.get<Envelope<GastosDetalleSubcuenta>>(
      `${this.base}/gastos-detalle-subcuenta`, { params }
    ));
  }
}
