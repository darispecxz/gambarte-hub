import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Envelope, RiskInfo, LogInfo, PeriodParams, RiskReport, DashboardData, LogData,
} from './models';

/**
 * ApiService — único punto de acceso a la CGR Reports API.
 * Desenvuelve el envelope { success, data, ... } y expone helpers de URL para
 * los documentos binarios (PDF/Excel/ZIP).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  private unwrap<T>(o: Observable<Envelope<T>>): Observable<T> {
    return o.pipe(map((r) => {
      if (!r || !r.success) {
        throw new Error(r && r.message ? r.message : 'Error de la API');
      }
      return r.data;
    }));
  }

  private qp(params: Record<string, string | undefined>): HttpParams {
    let p = new HttpParams();
    for (const k of Object.keys(params)) {
      const v = params[k];
      if (v !== undefined && v !== null && v !== '') p = p.set(k, v);
    }
    return p;
  }

  private queryString(params: Record<string, string | undefined>): string {
    const p = this.qp(params).toString();
    return p ? `?${p}` : '';
  }

  // ---- Riesgos ----
  getRisks(): Observable<RiskInfo[]> {
    return this.unwrap(this.http.get<Envelope<RiskInfo[]>>(`${this.base}/risks`));
  }

  getRiskData(slug: string, period: PeriodParams): Observable<RiskReport> {
    return this.unwrap(this.http.get<Envelope<RiskReport>>(
      `${this.base}/risks/${slug}`, { params: this.qp(period as any) }));
  }

  getDashboard(period: PeriodParams, recalcular = false): Observable<DashboardData> {
    const params = { ...(period as any) };
    if (recalcular) params.recalcular = '1';
    return this.unwrap(this.http.get<Envelope<DashboardData>>(
      `${this.base}/risks/dashboard`, { params: this.qp(params) }));
  }

  riskPdfUrl(slug: string, period: PeriodParams, disposition: 'inline' | 'attachment' = 'inline'): string {
    return `${this.base}/risks/${slug}/pdf${this.queryString({ ...(period as any), disposition })}`;
  }

  // ---- Logs / Bitácoras ----
  getLogs(): Observable<LogInfo[]> {
    return this.unwrap(this.http.get<Envelope<LogInfo[]>>(`${this.base}/logs`));
  }

  getLogData(code: string, periodo: string): Observable<LogData> {
    return this.unwrap(this.http.get<Envelope<LogData>>(
      `${this.base}/logs/${code}`, { params: this.qp({ periodo }) }));
  }

  logExcelUrl(code: string, periodo: string): string {
    return `${this.base}/logs/${code}/excel${this.queryString({ periodo })}`;
  }

  logsZipUrl(periodo: string): string {
    return `${this.base}/logs/excel/zip${this.queryString({ periodo })}`;
  }

  // ---- Operaciones ----
  getOperationActions(): Observable<{ actions: string[] }> {
    return this.unwrap(this.http.get<Envelope<{ actions: string[] }>>(`${this.base}/operations`));
  }

  getOperation(action: string, dateFrom: string, dateTo: string): Observable<any> {
    // La API envuelve como { action, dateFrom, dateTo, result }; devolvemos 'result'.
    return this.unwrap(this.http.get<Envelope<any>>(
      `${this.base}/operations/${action}`, { params: this.qp({ dateFrom, dateTo }) }))
      .pipe(map((d: any) => (d && d.result !== undefined) ? d.result : d));
  }
}
