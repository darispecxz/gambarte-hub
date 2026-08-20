import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidenciasService } from './incidencias.service';
import { LoadingComponent } from '../../shared/loading.component';
import { Discrepancy, DiscrepancySummary } from './incidencias.models';

@Component({
  selector: 'app-incidencias',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
  templateUrl: './incidencias.component.html',
  styleUrl: './incidencias.component.scss',
})
export class IncidenciasComponent implements OnInit {
  private svc = inject(IncidenciasService);

  // Filters
  desde = '';
  hasta = '';
  filterType = '';
  filterSeverity = '';
  filterStatus = '';
  filterOperationType = '';
  searchText = '';

  // Data
  discrepancies: Discrepancy[] = [];
  summary: DiscrepancySummary | null = null;
  loading = false;
  loadingSummary = false;
  error = '';
  running = false;

  // Detail modal
  detailOpen = false;
  selectedDisc: Discrepancy | null = null;

  // Resolve modal
  resolveOpen = false;
  resolveType = 'CORRECTED';
  resolveNotes = '';
  resolving = false;

  typeLabels: Record<string, string> = {
    DUPLICATE_SAME_SYSTEM: 'Duplicado en mismo sistema',
    ORPHAN_OPERATION: 'Operacion huerfana',
    GHOST_OPERATION: 'Operacion fantasma',
    ACCOUNTING_AMOUNT: 'Monto contable diferente',
    ACCOUNTING_MISSING: 'Asiento contable faltante',
    DEBIT_CREDIT_MISMATCH: 'Debe ≠ Haber',
    RATE_DIFFERENT: 'Tasa diferente a cotizacion',
    ROUNDING_INCONSISTENT: 'Redondeo inconsistente',
    VOID_WITHOUT_REVERSAL: 'Anulado sin reverso contable',
  };

  severityConfig: Record<string, { icon: string; css: string; label: string }> = {
    CRITICAL: { icon: 'ti-alert-octagon', css: 'sev-critical', label: 'Critico' },
    HIGH:     { icon: 'ti-alert-triangle', css: 'sev-high', label: 'Alto' },
    MEDIUM:   { icon: 'ti-info-circle', css: 'sev-medium', label: 'Medio' },
    LOW:      { icon: 'ti-info-square', css: 'sev-low', label: 'Bajo' },
    TOLERANCE:{ icon: 'ti-circle-check', css: 'sev-tolerance', label: 'Tolerancia' },
  };

  statusConfig: Record<string, { css: string; label: string }> = {
    OPEN:           { css: 'sem-bad', label: 'Abierta' },
    IN_REVIEW:      { css: 'sem-warn', label: 'En revision' },
    RESOLVED:       { css: 'sem-ok', label: 'Resuelta' },
    FALSE_POSITIVE: { css: 'sem-info', label: 'Falso positivo' },
    IGNORED:        { css: 'st-ignored', label: 'Ignorada' },
  };

  operationTypeLabels: Record<string, string> = {
    remesa: 'Remesa',
    cambio: 'Cambio',
    movimiento_de: 'Mov. Dep. Efectivo',
    movimiento_st: 'Mov. Salida Traspaso',
    movimiento_rt: 'Mov. Reversion',
    movimiento_cc: 'Mov. Cobro Cheque',
    movimiento_dr: 'Mov. Debito Remesa',
    movimiento_ex: 'Mov. Ingreso Externo',
    asiento: 'Asiento contable',
  };

  typeOptions = [
    { value: '', label: 'Todos' },
    { value: 'DUPLICATE_SAME_SYSTEM', label: 'Duplicado' },
    { value: 'ORPHAN_OPERATION', label: 'Operacion huerfana' },
    { value: 'GHOST_OPERATION', label: 'Operacion fantasma' },
    { value: 'ACCOUNTING_AMOUNT', label: 'Monto contable' },
    { value: 'ACCOUNTING_MISSING', label: 'Asiento faltante' },
    { value: 'DEBIT_CREDIT_MISMATCH', label: 'Debe ≠ Haber' },
    { value: 'RATE_DIFFERENT', label: 'Tasa diferente' },
    { value: 'ROUNDING_INCONSISTENT', label: 'Redondeo' },
    { value: 'VOID_WITHOUT_REVERSAL', label: 'Sin reverso' },
  ];

  severityOptions = [
    { value: '', label: 'Todas' },
    { value: 'CRITICAL', label: 'Critico' },
    { value: 'HIGH', label: 'Alto' },
    { value: 'MEDIUM', label: 'Medio' },
    { value: 'LOW', label: 'Bajo' },
    { value: 'TOLERANCE', label: 'Tolerancia' },
  ];

  statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'OPEN', label: 'Abierta' },
    { value: 'IN_REVIEW', label: 'En revision' },
    { value: 'RESOLVED', label: 'Resuelta' },
    { value: 'FALSE_POSITIVE', label: 'Falso positivo' },
    { value: 'IGNORED', label: 'Ignorada' },
  ];

  operationTypeOptions = [
    { value: '', label: 'Todos' },
    { value: 'remesa', label: 'Remesa' },
    { value: 'cambio', label: 'Cambio' },
    { value: 'asiento', label: 'Asiento' },
  ];

  resolveTypeOptions = [
    { value: 'CORRECTED', label: 'Corregido' },
    { value: 'ADJUSTED', label: 'Ajustado' },
    { value: 'FALSE_POSITIVE', label: 'Falso positivo' },
    { value: 'IGNORED', label: 'Ignorar' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.svc.list({
      type: this.filterType || undefined,
      severity: this.filterSeverity || undefined,
      status: this.filterStatus || undefined,
      operation_type: this.filterOperationType || undefined,
      desde: this.desde || undefined,
      hasta: this.hasta || undefined,
    }).subscribe({
      next: d => {
        this.discrepancies = d.discrepancies;
        this.loading = false;
        this.loadSummary();
      },
      error: (e: Error) => {
        this.error = e?.message || 'Error al cargar incidencias';
        this.loading = false;
      },
    });
  }

  private loadSummary(): void {
    this.loadingSummary = true;
    this.svc.summary(this.desde || undefined, this.hasta || undefined).subscribe({
      next: s => { this.summary = s; this.loadingSummary = false; },
      error: () => { this.loadingSummary = false; },
    });
  }

  runReconciliation(): void {
    this.running = true;
    this.svc.run().subscribe({
      next: r => {
        this.running = false;
        this.load();
      },
      error: (e: Error) => {
        this.error = e?.message || 'Error al ejecutar reconciliacion';
        this.running = false;
      },
    });
  }

  // Detail modal
  openDetail(d: Discrepancy): void {
    this.selectedDisc = d;
    this.detailOpen = true;
  }

  closeDetail(): void {
    this.detailOpen = false;
    this.selectedDisc = null;
  }

  // Resolve
  openResolve(): void {
    this.resolveOpen = true;
    this.resolveType = 'CORRECTED';
    this.resolveNotes = '';
  }

  cancelResolve(): void {
    this.resolveOpen = false;
  }

  confirmResolve(): void {
    if (!this.selectedDisc || !this.resolveNotes.trim()) return;
    this.resolving = true;
    this.svc.resolve(this.selectedDisc.id, this.resolveType, this.resolveNotes).subscribe({
      next: () => {
        this.resolving = false;
        this.resolveOpen = false;
        this.closeDetail();
        this.load();
      },
      error: (e: Error) => {
        this.error = e?.message || 'Error al resolver';
        this.resolving = false;
      },
    });
  }

  // Helpers
  get filtered(): Discrepancy[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.discrepancies;
    return this.discrepancies.filter(d =>
      d.code?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      (d.operation_type ?? '').toLowerCase().includes(q) ||
      (this.typeLabels[d.type] ?? d.type).toLowerCase().includes(q)
    );
  }

  sevOf(d: Discrepancy) { return this.severityConfig[d.severity] ?? this.severityConfig['MEDIUM']; }
  statusOf(d: Discrepancy) { return this.statusConfig[d.status] ?? this.statusConfig['OPEN']; }
  typeLabel(type: string): string { return this.typeLabels[type] ?? type; }
  opTypeLabel(ot: string | null): string { return ot ? (this.operationTypeLabels[ot] ?? ot) : '—'; }

  summaryBySev(sev: string): number {
    return this.summary?.bySeverity.find(s => s.severity === sev)?.total ?? 0;
  }

  isResolvable(d: Discrepancy): boolean {
    return d.status === 'OPEN' || d.status === 'IN_REVIEW';
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-BO', { year: 'numeric', month: '2-digit', day: '2-digit' })
      + ' ' + d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
  }

  detailTechnicalEntries(d: Discrepancy): { key: string; value: string }[] {
    if (!d.detail_technical) return [];
    return Object.entries(d.detail_technical).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }));
  }
}
