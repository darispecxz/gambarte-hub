import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Envelope } from '../../core/models';
import {
  UifReportResponse,
  PccRow,
  CambioUifRow,
  GiroUifRow,
  RemesaUifRow,
  UsuarioFinancieroRow,
  Agency,
} from './uif.models';

@Injectable({ providedIn: 'root' })
export class UifService {
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
      .get<Envelope<Agency[]>>(`${this.base}/uif/agencies`)
      .pipe(map((r) => (r?.success ? r.data : [])));
  }

  getPccReport(pcc: number, desde: string, hasta?: string, agencia?: number): Observable<UifReportResponse<PccRow>> {
    return this.unwrap(
      this.http.get<Envelope<UifReportResponse<PccRow>>>(`${this.base}/uif/pcc-report`, {
        params: this.qp({ pcc, desde, hasta, agencia }),
      })
    );
  }

  getCambios(desde: string, hasta?: string, agencia?: number): Observable<UifReportResponse<CambioUifRow>> {
    return this.unwrap(
      this.http.get<Envelope<UifReportResponse<CambioUifRow>>>(`${this.base}/uif/cambios`, {
        params: this.qp({ desde, hasta, agencia }),
      })
    );
  }

  getGiros(desde: string, hasta?: string, agencia?: number): Observable<UifReportResponse<GiroUifRow>> {
    return this.unwrap(
      this.http.get<Envelope<UifReportResponse<GiroUifRow>>>(`${this.base}/uif/giros`, {
        params: this.qp({ desde, hasta, agencia }),
      })
    );
  }

  getRemesas(desde: string, hasta?: string, agencia?: number): Observable<UifReportResponse<RemesaUifRow>> {
    return this.unwrap(
      this.http.get<Envelope<UifReportResponse<RemesaUifRow>>>(`${this.base}/uif/remesas`, {
        params: this.qp({ desde, hasta, agencia }),
      })
    );
  }

  getUsuarioFinanciero(params: Record<string, string | number | undefined | null>): Observable<UifReportResponse<UsuarioFinancieroRow>> {
    return this.unwrap(
      this.http.get<Envelope<UifReportResponse<UsuarioFinancieroRow>>>(`${this.base}/uif/usuario-financiero`, {
        params: this.qp(params),
      })
    );
  }

  // Blob downloads (sends JWT via HttpClient interceptor)

  downloadCsv(report: string, desde: string, hasta?: string, agencia?: number): Observable<Blob> {
    return this.http.get(`${this.base}/uif/export`, {
      params: this.qp({ report, desde, hasta, agencia }),
      responseType: 'blob',
    });
  }

  downloadPcc06Pdf(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/uif/pcc06-pdf/${id}`, { responseType: 'blob' });
  }

  downloadPcc08Pdf(operacion: number, id: number): Observable<Blob> {
    return this.http.get(`${this.base}/uif/pcc08-pdf/${operacion}/${id}`, { responseType: 'blob' });
  }

  downloadPccBlank(type: number): Observable<Blob> {
    return this.http.get(`${this.base}/uif/pcc-blank/${type}`, { responseType: 'blob' });
  }

  downloadReportPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/uif/report-pdf/${id}`, { responseType: 'blob' });
  }
}
