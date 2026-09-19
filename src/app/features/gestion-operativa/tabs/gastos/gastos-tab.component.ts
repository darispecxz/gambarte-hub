import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GestionOperativaService } from '../../gestion-operativa.service';
import { GastosOperativoResumen, GastosDetalleSubcuenta, GastosSubcuenta, GastosAgencia, GastosAgenciaDetalle } from '../../gestion-operativa.models';
import { fmtCompact, fmt } from '../../gestion-operativa.utils';

type SubView = 'resumen' | 'categorias' | 'agencias';

@Component({
  selector: 'app-gastos-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gastos-tab.component.html',
  styleUrl: './gastos-tab.component.scss',
})
export class GastosTabComponent implements OnInit, OnChanges {
  @Input({ required: true }) fecha!: string;
  @Input() version = 0;

  private svc = inject(GestionOperativaService);

  data: GastosOperativoResumen | null = null;
  loading = true;
  subView: SubView = 'resumen';
  expandedCat = new Set<string>();

  // Subcuenta modal state
  modalOpen = false;
  modalLoading = false;
  modalSubcuenta: GastosSubcuenta | null = null;
  modalDetalle: GastosDetalleSubcuenta | null = null;

  // Agency detail modal state
  agModalOpen = false;
  agModalLoading = false;
  agModalAgencia: GastosAgencia | null = null;
  agModalDetalle: GastosAgenciaDetalle | null = null;

  Math = Math;
  fmtCompact = fmtCompact;
  fmt = fmt;

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['fecha']?.firstChange && !changes['version']?.firstChange) {
      this.loadData();
    }
  }

  private loadData(): void {
    const mes = this.fecha.slice(0, 7);
    this.loading = true;
    this.svc.getGastosOperativo(mes).subscribe({
      next: (d) => { this.data = d; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  get mes(): string {
    return this.fecha.slice(0, 7);
  }

  setSubView(v: SubView): void {
    this.subView = v;
  }

  toggleCat(key: string): void {
    this.expandedCat.has(key) ? this.expandedCat.delete(key) : this.expandedCat.add(key);
  }

  openSubcuentaDetail(sub: GastosSubcuenta): void {
    this.modalOpen = true;
    this.modalSubcuenta = sub;
    this.modalDetalle = null;
    this.modalLoading = true;
    this.svc.getGastosDetalleSubcuenta(this.mes, sub.codsubcuenta).subscribe({
      next: (d) => { this.modalDetalle = d; this.modalLoading = false; },
      error: () => { this.modalLoading = false; },
    });
  }

  closeModal(): void {
    this.modalOpen = false;
    this.modalSubcuenta = null;
    this.modalDetalle = null;
  }

  openAgenciaDetail(ag: GastosAgencia): void {
    this.agModalOpen = true;
    this.agModalAgencia = ag;
    this.agModalDetalle = null;
    this.agModalLoading = true;
    this.svc.getGastosDetalleAgencia(this.mes, ag.agenciaId).subscribe({
      next: (d) => { this.agModalDetalle = d; this.agModalLoading = false; },
      error: () => { this.agModalLoading = false; },
    });
  }

  closeAgModal(): void {
    this.agModalOpen = false;
    this.agModalAgencia = null;
    this.agModalDetalle = null;
  }

  coberturaColor(pct: number): string {
    if (pct >= 100) return 'var(--green)';
    if (pct >= 70) return 'var(--amber)';
    return 'var(--red)';
  }

  coberturaBg(pct: number): string {
    if (pct >= 100) return 'var(--green-track)';
    if (pct >= 70) return 'rgba(255,180,50,.1)';
    return 'rgba(229,72,77,.08)';
  }

  fmtDec(n: number): string {
    return n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fmtK(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return n.toFixed(0);
  }

  pct(part: number, total: number): number {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }

  pctDec(part: number, total: number): string {
    if (total <= 0) return '0.0';
    return ((part / total) * 100).toFixed(1);
  }

  get maxCatTotal(): number {
    if (!this.data) return 1;
    return Math.max(...this.data.categorias.map(c => c.total), 1);
  }

  get maxAgTotal(): number {
    if (!this.data) return 1;
    return Math.max(...this.data.agencias.map(a => a.total), 1);
  }

  get chartMaxY(): number {
    if (!this.data) return 1;
    const maxG = Math.max(...this.data.acumulado.map(d => d.gastoAcumulado));
    const maxI = Math.max(...this.data.acumulado.map(d => d.ingresoAcumulado));
    const proy = this.data.proyeccion;
    return Math.max(maxG, maxI, proy, 1);
  }

  get activeCats(): { key: string; label: string; icon: string; total: number; subcuentas: GastosSubcuenta[] }[] {
    return this.data?.categorias.filter(c => c.total > 0) ?? [];
  }

  chartPoints(type: 'gastos' | 'ingresos'): string {
    if (!this.data) return '';
    const max = this.chartMaxY;
    const days = this.data.acumulado;
    return days.map((d, i) => {
      const x = (i / Math.max(days.length - 1, 1)) * 100;
      const val = type === 'gastos' ? d.gastoAcumulado : d.ingresoAcumulado;
      const y = 100 - (val / max) * 100;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  chartAreaPoints(type: 'gastos' | 'ingresos'): string {
    const line = this.chartPoints(type);
    if (!line) return '';
    const pts = line.split(' ');
    return `0,100 ${line} ${pts[pts.length - 1]?.split(',')[0] ?? 100},100`;
  }

  proyeccionY(): number {
    if (!this.data) return 0;
    return 100 - (this.data.proyeccion / this.chartMaxY) * 100;
  }

  currentDayX(): number {
    if (!this.data) return 0;
    const total = this.data.acumulado.length;
    return ((this.data.diaActual - 1) / Math.max(total - 1, 1)) * 100;
  }

  yLabels(): { y: number; label: string }[] {
    const max = this.chartMaxY;
    const step = this.niceStep(max);
    const labels: { y: number; label: string }[] = [];
    for (let v = 0; v <= max; v += step) {
      labels.push({ y: 100 - (v / max) * 100, label: this.fmtK(v) });
    }
    return labels;
  }

  private niceStep(max: number): number {
    const rough = max / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const norm = rough / mag;
    if (norm <= 1) return mag;
    if (norm <= 2) return 2 * mag;
    if (norm <= 5) return 5 * mag;
    return 10 * mag;
  }

  miniLinePoints(type: 'gastos' | 'ingresos'): string {
    if (!this.data) return '';
    const max = this.chartMaxY;
    const days = this.data.acumulado;
    return days.map((d, i) => {
      const x = (i / Math.max(days.length - 1, 1)) * 100;
      const val = type === 'gastos' ? d.gastoAcumulado : d.ingresoAcumulado;
      const y = 40 - (val / max) * 40;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  miniAreaPoints(type: 'gastos' | 'ingresos'): string {
    const line = this.miniLinePoints(type);
    if (!line) return '';
    const pts = line.split(' ');
    return `0,40 ${line} ${pts[pts.length - 1]?.split(',')[0] ?? 100},40`;
  }

  coberturaIcon(): string {
    if (!this.data) return 'ti-circle-check';
    if (this.data.cobertura >= 100) return 'ti-circle-check';
    if (this.data.cobertura >= 70) return 'ti-alert-circle';
    return 'ti-alert-triangle';
  }

  mesLabel(): string {
    if (!this.data) return '';
    const [y, m] = this.data.mes.split('-');
    const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${meses[+m]} ${y}`;
  }
}
