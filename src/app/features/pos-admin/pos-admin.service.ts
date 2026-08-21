import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Envelope } from '../../core/models';
import {
  AgencyGroup, CashierMovement, ArqueoData, SaldoEntry, Agency,
} from './pos-admin.models';

@Injectable({ providedIn: 'root' })
export class PosAdminService {
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

  getDashboard(fecha: string, agencia?: number): Observable<{ fecha: string; agencies: AgencyGroup[] }> {
    return this.unwrap(
      this.http.get<Envelope<{ fecha: string; agencies: AgencyGroup[] }>>(`${this.base}/pos/dashboard`, {
        params: this.qp({ fecha, agencia }),
      })
    );
  }

  getMovements(numCaja: number, agencia: number, fecha: string): Observable<{ movements: CashierMovement[] }> {
    return this.unwrap(
      this.http.get<Envelope<{ movements: CashierMovement[] }>>(`${this.base}/pos/movements`, {
        params: this.qp({ num_caja: numCaja, agencia, fecha }),
      })
    );
  }

  getArqueo(numCaja: number, agencia: number, fecha: string, tipo: string): Observable<{ arqueo: ArqueoData }> {
    return this.unwrap(
      this.http.get<Envelope<{ arqueo: ArqueoData }>>(`${this.base}/pos/arqueo`, {
        params: this.qp({ num_caja: numCaja, agencia, fecha, tipo }),
      })
    );
  }

  getSaldoHistory(idCaja: number, fecha: string): Observable<{ history: SaldoEntry[] }> {
    return this.unwrap(
      this.http.get<Envelope<{ history: SaldoEntry[] }>>(`${this.base}/pos/saldo-history/${idCaja}`, {
        params: this.qp({ fecha }),
      })
    );
  }
}
