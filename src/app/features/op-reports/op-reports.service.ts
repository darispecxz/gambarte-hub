import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Envelope } from '../../core/models';
import {
  OpReportResponse,
  CambioRow,
  CambioDetail,
  GiroRow,
  GiroDetail,
  RemesaRow,
  RemesaDetail,
  Agency,
} from './op-reports.models';

@Injectable({ providedIn: 'root' })
export class OpReportsService {
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

  getAgencies(): Observable<Agency[]> {
    return this.http
      .get<Envelope<Agency[]>>(`${this.base}/accounting/agencies`)
      .pipe(map((r) => (r?.success ? r.data : [])));
  }

  getCambios(desde: string, hasta?: string, agencia?: number, operacion?: number): Observable<OpReportResponse<CambioRow>> {
    return this.unwrap(
      this.http.get<Envelope<OpReportResponse<CambioRow>>>(`${this.base}/op-reports/cambios`, {
        params: this.qp({ desde, hasta, agencia, operacion }),
      })
    );
  }

  getGiros(desde: string, hasta?: string, agencia?: number, estado?: string, codigo?: number): Observable<OpReportResponse<GiroRow>> {
    return this.unwrap(
      this.http.get<Envelope<OpReportResponse<GiroRow>>>(`${this.base}/op-reports/giros`, {
        params: this.qp({ desde, hasta, agencia, estado, codigo }),
      })
    );
  }

  getRemesas(desde: string, hasta?: string, agencia?: number, estado?: string, subtipo?: string, codigo?: number): Observable<OpReportResponse<RemesaRow>> {
    return this.unwrap(
      this.http.get<Envelope<OpReportResponse<RemesaRow>>>(`${this.base}/op-reports/remesas`, {
        params: this.qp({ desde, hasta, agencia, estado, subtipo, codigo }),
      })
    );
  }

  getCambioDetail(id: number): Observable<CambioDetail> {
    return this.unwrap(
      this.http.get<Envelope<CambioDetail>>(`${this.base}/op-reports/cambio/${id}`)
    );
  }

  getGiroDetail(id: number): Observable<GiroDetail> {
    return this.unwrap(
      this.http.get<Envelope<GiroDetail>>(`${this.base}/op-reports/giro/${id}`)
    );
  }

  getRemesaDetail(id: number): Observable<RemesaDetail> {
    return this.unwrap(
      this.http.get<Envelope<RemesaDetail>>(`${this.base}/op-reports/remesa/${id}`)
    );
  }
}
