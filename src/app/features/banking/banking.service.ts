import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Envelope } from '../../core/models';
import { Agency } from '../accounting/accounting.models';
import {
  FinancialEntity,
  BankAccount,
  BankMovementsReport,
  ConciliacionContableReport,
  BankDailySummaryReport,
  BankTransfersReport,
  MovementDetailResponse,
  ConciliacionDetalleResponse,
} from './banking.models';

@Injectable({ providedIn: 'root' })
export class BankingService {
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

  getEntities(): Observable<FinancialEntity[]> {
    return this.unwrap(
      this.http.get<Envelope<FinancialEntity[]>>(`${this.base}/banking/entities`)
    );
  }

  getAccounts(agencia?: number): Observable<BankAccount[]> {
    return this.unwrap(
      this.http.get<Envelope<BankAccount[]>>(`${this.base}/banking/accounts`, {
        params: this.qp({ agencia }),
      })
    );
  }

  getMovements(
    desde: string, hasta?: string, agencia?: number,
    moneda?: number, cuenta?: string, conciliacion?: string
  ): Observable<BankMovementsReport> {
    return this.unwrap(
      this.http.get<Envelope<BankMovementsReport>>(`${this.base}/banking/movements`, {
        params: this.qp({ desde, hasta, agencia, moneda, cuenta, conciliacion }),
      })
    );
  }

  getConciliacion(fecha: string, agencia?: number): Observable<ConciliacionContableReport> {
    return this.unwrap(
      this.http.get<Envelope<ConciliacionContableReport>>(
        `${this.base}/banking/conciliacion`,
        { params: this.qp({ fecha, agencia }) }
      )
    );
  }

  getDailySummary(fecha: string): Observable<{ fecha: string; report: BankDailySummaryReport }> {
    return this.unwrap(
      this.http.get<Envelope<{ fecha: string; report: BankDailySummaryReport }>>(
        `${this.base}/banking/daily-summary`,
        { params: this.qp({ fecha }) }
      )
    );
  }

  getConciliacionDetalle(
    fecha: string, agencia: number, entidad: number, cuenta: string, moneda: number
  ): Observable<ConciliacionDetalleResponse> {
    return this.unwrap(
      this.http.get<Envelope<ConciliacionDetalleResponse>>(
        `${this.base}/banking/conciliacion-detalle`,
        { params: this.qp({ fecha, agencia, entidad, cuenta, moneda }) }
      )
    );
  }

  getMovementDetail(
    agencia: number, entidad: number, cuenta: string, moneda: number,
    fecha: string, conciliacion: string, monto: number
  ): Observable<MovementDetailResponse> {
    return this.unwrap(
      this.http.get<Envelope<MovementDetailResponse>>(
        `${this.base}/banking/movement-detail`,
        { params: this.qp({ agencia, entidad, cuenta, moneda, fecha, conciliacion, monto }) }
      )
    );
  }

  getTransfers(desde: string, hasta?: string, estado?: string): Observable<BankTransfersReport> {
    return this.unwrap(
      this.http.get<Envelope<BankTransfersReport>>(`${this.base}/banking/transfers`, {
        params: this.qp({ desde, hasta, estado }),
      })
    );
  }
}
