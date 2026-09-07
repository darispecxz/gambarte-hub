import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AccountingService } from './accounting.service';
import { LoadingComponent } from '../../shared/loading.component';
import {
  Agency,
  CashierReconciliationReport,
  MovementSummaryReport,
  AgencyClosingReport,
  DailySummaryReport,
  CashierBreakdown,
} from './accounting.models';

type ReportType = 'daily' | 'cashier' | 'movement' | 'agency';

interface ReportTab {
  key: ReportType;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
  templateUrl: './accounting.component.html',
  styleUrl: './accounting.component.scss',
})
export class AccountingComponent implements OnInit, OnDestroy {
  private svc = inject(AccountingService);
  private route = inject(ActivatedRoute);
  private routeSub: any;

  selected: ReportType = 'daily';
  fecha = new Date().toISOString().slice(0, 10);
  agencia: number | null = null;
  agencies: Agency[] = [];

  loading = false;
  error = '';

  dailyReport: DailySummaryReport | null = null;
  cashierReport: CashierReconciliationReport | null = null;
  movementReport: MovementSummaryReport | null = null;
  agencyReport: AgencyClosingReport | null = null;

  expandedCajeros = new Set<string>();

  ngOnInit(): void {
    this.svc.getAgencies().subscribe({
      next: (list) => (this.agencies = list),
    });
    this.routeSub = this.route.queryParams.subscribe(params => {
      const tab = params['tab'] as ReportType;
      if (tab && ['daily', 'cashier', 'movement', 'agency'].includes(tab)) {
        this.selected = tab;
      }
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.dailyReport = this.cashierReport = this.movementReport = this.agencyReport = null;

    switch (this.selected) {
      case 'daily':
        this.svc.getDailySummary(this.fecha).subscribe({
          next: (d) => { this.dailyReport = d; this.loading = false; },
          error: (e: Error) => this.fail(e),
        });
        break;
      case 'cashier':
        this.svc.getCashierDetails(this.fecha, this.agencia ?? undefined).subscribe({
          next: (d) => { this.cashierReport = d; this.loading = false; },
          error: (e: Error) => this.fail(e),
        });
        break;
      case 'movement':
        this.svc.getMovementSummary(this.fecha).subscribe({
          next: (d) => { this.movementReport = d; this.loading = false; },
          error: (e: Error) => this.fail(e),
        });
        break;
      case 'agency':
        this.svc.getAgencyClosings(this.fecha).subscribe({
          next: (d) => { this.agencyReport = d; this.loading = false; },
          error: (e: Error) => this.fail(e),
        });
        break;
    }
  }

  private fail(e: Error): void {
    this.error = e?.message || 'Error al cargar el reporte';
    this.loading = false;
  }

  downloadExcel(): void {
    window.open(this.svc.exportUrl(this.selected, this.fecha, 'xlsx', this.agencia), '_blank');
  }

  downloadPdf(): void {
    window.open(this.svc.exportUrl(this.selected, this.fecha, 'pdf', this.agencia), '_blank');
  }

  toggleCajero(c: CashierBreakdown): void {
    const k = this.cajeroKey(c);
    this.expandedCajeros.has(k) ? this.expandedCajeros.delete(k) : this.expandedCajeros.add(k);
  }

  isOpen(c: CashierBreakdown): boolean {
    return this.expandedCajeros.has(this.cajeroKey(c));
  }

  cajeroKey(c: CashierBreakdown): string {
    return `${c.idAgencia}-${c.cajero}`;
  }

  hasDiscrepancy(c: CashierBreakdown): boolean {
    return c.currencies.some((x) => x.diferencia !== 0);
  }

  currencyKeys(obj: Record<string, number>): string[] {
    return Object.keys(obj).sort();
  }

  hasData(): boolean {
    return !!(this.dailyReport || this.cashierReport || this.movementReport || this.agencyReport);
  }
}
