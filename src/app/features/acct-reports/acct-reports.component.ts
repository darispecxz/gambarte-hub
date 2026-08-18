import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountingService } from '../accounting/accounting.service';
import { LoadingComponent } from '../../shared/loading.component';
import {
  Ejercicio,
  SubcuentaOption,
  BalanceSumasYSaldosReport,
  BalanceCuenta,
  LibroMayorReport,
  AsientoDetalle,
} from '../accounting/accounting.models';

type ReportType = 'balance' | 'libro-mayor';

interface ReportTab {
  key: ReportType;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-acct-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
  templateUrl: './acct-reports.component.html',
  styleUrl: './acct-reports.component.scss',
})
export class AcctReportsComponent implements OnInit {
  private svc = inject(AccountingService);

  tabs: ReportTab[] = [
    { key: 'balance',     label: 'Balance Sumas y Saldos', icon: 'ti-scale' },
    { key: 'libro-mayor', label: 'Libro Mayor',            icon: 'ti-book' },
  ];

  selected: ReportType = 'balance';

  ejercicio = new Date().getFullYear().toString();
  ejercicios: Ejercicio[] = [];
  desde = new Date().getFullYear() + '-01-01';
  hasta = new Date().toISOString().slice(0, 10);

  subcuentas: SubcuentaOption[] = [];
  subcuentaFilter = '';
  codsubcuenta = '';

  loading = false;
  loadingPage = false;
  loadingAsiento = false;
  error = '';

  conceptoFilter = '';
  tipoFilter = '';

  balanceReport: BalanceSumasYSaldosReport | null = null;
  libroMayorReport: LibroMayorReport | null = null;
  asientoDetalle: AsientoDetalle | null = null;

  expandedCuentas = new Set<string>();
  page = 1;

  ngOnInit(): void {
    this.svc.getEjercicios().subscribe({
      next: (list) => (this.ejercicios = list),
    });
    this.svc.getSubcuentas(this.ejercicio).subscribe({
      next: (list) => (this.subcuentas = list),
    });
    this.load();
  }

  select(key: ReportType): void {
    this.selected = key;
    this.load();
  }

  onEjercicioChange(): void {
    this.svc.getSubcuentas(this.ejercicio).subscribe({
      next: (list) => (this.subcuentas = list),
    });
  }

  get filteredSubcuentas(): SubcuentaOption[] {
    if (!this.subcuentaFilter) return this.subcuentas.slice(0, 50);
    const q = this.subcuentaFilter.toLowerCase();
    return this.subcuentas
      .filter((s) => s.codsubcuenta.includes(q) || s.descripcion.toLowerCase().includes(q))
      .slice(0, 50);
  }

  onSubcuentaFilterChange(): void {
    this.codsubcuenta = '';
  }

  selectSubcuenta(s: SubcuentaOption): void {
    this.codsubcuenta = s.codsubcuenta;
    this.subcuentaFilter = s.codsubcuenta + ' — ' + s.descripcion;
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.balanceReport = null;
    this.libroMayorReport = null;
    this.asientoDetalle = null;
    this.conceptoFilter = '';
    this.tipoFilter = '';
    this.allTipos.clear();
    this.tipoOptions = [];

    switch (this.selected) {
      case 'balance':
        this.svc.getBalance(this.ejercicio, this.desde, this.hasta).subscribe({
          next: (d) => { this.balanceReport = d; this.expandedCuentas.clear(); this.loading = false; },
          error: (e: Error) => this.fail(e),
        });
        break;
      case 'libro-mayor':
        if (!this.codsubcuenta) {
          this.error = 'Seleccione una subcuenta para consultar el Libro Mayor.';
          this.loading = false;
          return;
        }
        this.page = 1;
        this.loadLibroMayor();
        break;
    }
  }

  private loadLibroMayor(): void {
    const isPageChange = this.libroMayorReport !== null;
    if (isPageChange) {
      this.loadingPage = true;
    } else {
      this.loading = true;
    }
    this.svc.getLibroMayor(this.codsubcuenta, this.ejercicio, this.desde, this.hasta, this.page).subscribe({
      next: (d) => {
        this.libroMayorReport = d;
        this.loading = false;
        this.loadingPage = false;
        this.collectTipos();
      },
      error: (e: Error) => { this.loadingPage = false; this.fail(e); },
    });
  }

  tipoOptions: string[] = [];
  private allTipos = new Set<string>();

  private collectTipos(): void {
    if (!this.libroMayorReport) return;
    for (const m of this.libroMayorReport.movimientos) {
      if (m.tipodocumento) this.allTipos.add(m.tipodocumento);
    }
    this.tipoOptions = Array.from(this.allTipos).sort();
  }

  get filteredMovimientos() {
    if (!this.libroMayorReport) return [];
    let items = this.libroMayorReport.movimientos;
    if (this.conceptoFilter) {
      const q = this.conceptoFilter.toLowerCase();
      items = items.filter(m => m.concepto.toLowerCase().includes(q));
    }
    if (this.tipoFilter) {
      items = items.filter(m => m.tipodocumento === this.tipoFilter);
    }
    return items;
  }

  goToPage(p: number): void {
    if (!this.libroMayorReport || p < 1 || p > this.libroMayorReport.totalPages) return;
    this.page = p;
    this.loadLibroMayor();
  }

  get pageNumbers(): number[] {
    if (!this.libroMayorReport) return [];
    const total = this.libroMayorReport.totalPages;
    const current = this.page;
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  private fail(e: Error): void {
    this.error = e?.message || 'Error al cargar el reporte';
    this.loading = false;
  }

  toggleCuenta(c: BalanceCuenta): void {
    const k = c.codcuenta;
    this.expandedCuentas.has(k) ? this.expandedCuentas.delete(k) : this.expandedCuentas.add(k);
  }

  isCuentaOpen(c: BalanceCuenta): boolean {
    return this.expandedCuentas.has(c.codcuenta);
  }

  showAsiento(id: number): void {
    this.asientoDetalle = null;
    this.loadingAsiento = true;
    this.svc.getAsientoDetalle(id).subscribe({
      next: (d) => { this.asientoDetalle = d; this.loadingAsiento = false; },
      error: () => { this.loadingAsiento = false; },
    });
  }

  closeAsiento(): void {
    this.asientoDetalle = null;
    this.loadingAsiento = false;
  }
}
