import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GestionOperativaService } from '../../gestion-operativa.service';
import { CotizacionAgencia } from '../../gestion-operativa.models';
import { fmt } from '../../gestion-operativa.utils';

@Component({
  selector: 'app-cotizaciones-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cotizaciones-tab.component.html',
  styleUrl: './cotizaciones-tab.component.scss',
})
export class CotizacionesTabComponent implements OnInit, OnChanges {
  @Input() version = 0;

  private svc = inject(GestionOperativaService);

  cotizacionesAgencia: CotizacionAgencia[] = [];
  loading = true;
  selectedMoneda = '';

  fmt = fmt;

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['version']?.firstChange) {
      this.loadData();
    }
  }

  private loadData(): void {
    this.loading = true;
    this.svc.getCotizacionesAgencia().subscribe({
      next: (d) => { this.cotizacionesAgencia = d; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  get monedas(): string[] {
    return [...new Set(this.cotizacionesAgencia.map(c => c.moneda))];
  }

  get filtered(): CotizacionAgencia[] {
    if (!this.selectedMoneda) return this.cotizacionesAgencia;
    return this.cotizacionesAgencia.filter(c => c.moneda === this.selectedMoneda);
  }

  get maxSpread(): number {
    const vals = this.filtered.map(c => c.spread);
    return vals.length ? Math.max(...vals, 0.001) : 1;
  }

  spreadPct(spread: number): number {
    return Math.min((spread / this.maxSpread) * 100, 100);
  }

  spreadColor(c: CotizacionAgencia): string {
    if (c.diffCompra != null && Math.abs(c.diffCompra) > 0.3) return 'var(--red)';
    if (c.spread > 0.15) return 'var(--amber)';
    return 'var(--green)';
  }

  get oficial(): { compra: number | null; venta: number | null } {
    const f = this.filtered;
    if (!f.length) return { compra: null, venta: null };
    return { compra: f[0].oficialCompra, venta: f[0].oficialVenta };
  }

  get promedioCompra(): number {
    const f = this.filtered;
    return f.length ? f.reduce((s, c) => s + c.compra, 0) / f.length : 0;
  }

  get promedioVenta(): number {
    const f = this.filtered;
    return f.length ? f.reduce((s, c) => s + c.venta, 0) / f.length : 0;
  }

  get promedioSpread(): number {
    const f = this.filtered;
    return f.length ? f.reduce((s, c) => s + c.spread, 0) / f.length : 0;
  }
}
