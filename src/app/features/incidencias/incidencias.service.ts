import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Envelope } from '../../core/models';
import {
  DiscrepancyListResponse,
  DiscrepancySummary,
  DiscrepancyTypeGroup,
} from './incidencias.models';

@Injectable({ providedIn: 'root' })
export class IncidenciasService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/discrepancies`;

  private unwrap<T>(o: Observable<Envelope<T>>): Observable<T> {
    return o.pipe(map(r => {
      if (!r || !r.success) throw new Error(r?.message ?? 'Error de la API');
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

  list(filters: {
    type?: string; severity?: string; status?: string;
    operation_type?: string; desde?: string; hasta?: string;
  } = {}): Observable<DiscrepancyListResponse> {
    return this.unwrap(this.http.get<Envelope<DiscrepancyListResponse>>(
      this.base, { params: this.qp(filters as Record<string, string | undefined>) }
    ));
  }

  summary(desde?: string, hasta?: string): Observable<DiscrepancySummary> {
    return this.unwrap(this.http.get<Envelope<DiscrepancySummary>>(
      `${this.base}/summary`, { params: this.qp({ desde, hasta }) }
    ));
  }

  types(): Observable<DiscrepancyTypeGroup> {
    return this.unwrap(this.http.get<Envelope<DiscrepancyTypeGroup>>(
      `${this.base}/types`
    ));
  }

  run(): Observable<{ created: number; message: string }> {
    return this.unwrap(this.http.post<Envelope<{ created: number; message: string }>>(
      `${this.base}/run`, {}
    ));
  }

  resolve(id: number, resolutionType: string, notes: string): Observable<void> {
    return this.unwrap(this.http.post<Envelope<void>>(
      `${this.base}/${id}/resolve`, { resolution_type: resolutionType, notes }
    ));
  }
}
