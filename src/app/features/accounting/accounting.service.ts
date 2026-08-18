import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Envelope } from '../../core/models';
import {
  Agency,
  CashierReconciliationReport,
  MovementSummaryReport,
  AgencyClosingReport,
  DailySummaryReport,
  Ejercicio,
  SubcuentaOption,
  BalanceSumasYSaldosReport,
  LibroMayorReport,
  AsientoDetalle,
} from './accounting.models';

interface AccountingEnvelope<T> {
  fecha: string;
  agencia?: number | null;
  report: T;
}

@Injectable({ providedIn: 'root' })
export class AccountingService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  private unwrap<T>(o: Observable<Envelope<AccountingEnvelope<T>>>): Observable<T> {
    return o.pipe(map((r) => {
      if (!r || !r.success) {
        throw new Error(r && r.message ? r.message : 'Error de la API');
      }
      return r.data.report;
    }));
  }

  private qp(params: Record<string, string | number | undefined | null>): HttpParams {
    let p = new HttpParams();
    for (const k of Object.keys(params)) {
      const v = params[k];
      if (v !== undefined && v !== null && v !== '') {
        p = p.set(k, String(v));
      }
    }
    return p;
  }

  private queryString(params: Record<string, string | number | undefined | null>): string {
    const p = this.qp(params).toString();
    return p ? `?${p}` : '';
  }

  getAgencies(): Observable<Agency[]> {
    return this.http
      .get<Envelope<Agency[]>>(`${this.base}/accounting/agencies`)
      .pipe(map((r) => (r && r.success ? r.data : [])));
  }

  getDailySummary(fecha: string): Observable<DailySummaryReport> {
    return this.unwrap(
      this.http.get<Envelope<AccountingEnvelope<DailySummaryReport>>>(
        `${this.base}/accounting/daily-summary`,
        { params: this.qp({ fecha }) }
      )
    );
  }

  getCashierDetails(fecha: string, agencia?: number): Observable<CashierReconciliationReport> {
    return this.unwrap(
      this.http.get<Envelope<AccountingEnvelope<CashierReconciliationReport>>>(
        `${this.base}/accounting/cashier-details`,
        { params: this.qp({ fecha, agencia }) }
      )
    );
  }

  getMovementSummary(fecha: string): Observable<MovementSummaryReport> {
    return this.unwrap(
      this.http.get<Envelope<AccountingEnvelope<MovementSummaryReport>>>(
        `${this.base}/accounting/movement-summary`,
        { params: this.qp({ fecha }) }
      )
    );
  }

  getAgencyClosings(fecha: string): Observable<AgencyClosingReport> {
    return this.unwrap(
      this.http.get<Envelope<AccountingEnvelope<AgencyClosingReport>>>(
        `${this.base}/accounting/agency-closings`,
        { params: this.qp({ fecha }) }
      )
    );
  }

  getEjercicios(): Observable<Ejercicio[]> {
    return this.http
      .get<Envelope<Ejercicio[]>>(`${this.base}/accounting/ejercicios`)
      .pipe(map((r) => (r && r.success ? r.data : [])));
  }

  getSubcuentas(ejercicio: string): Observable<SubcuentaOption[]> {
    return this.http
      .get<Envelope<SubcuentaOption[]>>(`${this.base}/accounting/subcuentas`, {
        params: this.qp({ ejercicio }),
      })
      .pipe(map((r) => (r && r.success ? r.data : [])));
  }

  getBalance(ejercicio: string, desde: string, hasta: string): Observable<BalanceSumasYSaldosReport> {
    return this.unwrap(
      this.http.get<Envelope<AccountingEnvelope<BalanceSumasYSaldosReport>>>(
        `${this.base}/accounting/balance`,
        { params: this.qp({ ejercicio, desde, hasta }) }
      )
    );
  }

  getLibroMayor(codsubcuenta: string, ejercicio: string, desde: string, hasta: string, page = 1): Observable<LibroMayorReport> {
    return this.unwrap(
      this.http.get<Envelope<AccountingEnvelope<LibroMayorReport>>>(
        `${this.base}/accounting/libro-mayor`,
        { params: this.qp({ codsubcuenta, ejercicio, desde, hasta, page }) }
      )
    );
  }

  getAsientoDetalle(id: number): Observable<AsientoDetalle> {
    return this.http
      .get<Envelope<AsientoDetalle>>(`${this.base}/accounting/asiento-detalle`, {
        params: this.qp({ id }),
      })
      .pipe(map((r) => {
        if (!r || !r.success) throw new Error(r?.message ?? 'Error');
        return r.data;
      }));
  }

  exportUrl(
    report: 'daily' | 'cashier' | 'movement' | 'agency',
    fecha: string,
    format: 'xlsx' | 'pdf' = 'xlsx',
    agencia?: number | null
  ): string {
    return `${this.base}/accounting/export${this.queryString({ report, fecha, format, agencia })}`;
  }
}
