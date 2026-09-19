import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionOperativaService } from '../../gestion-operativa.service';
import { CotizacionAgencia } from '../../gestion-operativa.models';
import { fmt } from '../../gestion-operativa.utils';
import { currencyFlag, currencyName } from '../../../../core/currency';

type SortKey = 'agencia' | 'compra' | 'venta' | 'spread' | 'diff';

@Component({
  selector: 'app-cotizaciones-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cotizaciones-tab.component.html',
  styleUrl: './cotizaciones-tab.component.scss',
})
export class CotizacionesTabComponent implements OnInit, OnChanges {
  @Input() version = 0;

  private svc = inject(GestionOperativaService);

  cotizacionesAgencia: CotizacionAgencia[] = [];
  loading = true;
  selectedMoneda = '';
  selectedAgencia = '';
  viewMode: 'table' | 'cards' = 'table';
  sortKey: SortKey = 'spread';
  sortAsc = false;

  fmt = fmt;
  flag = currencyFlag;
  cname = currencyName;

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

  get agencias(): { id: number; nombre: string }[] {
    const seen = new Map<number, string>();
    for (const c of this.cotizacionesAgencia) {
      if (!seen.has(c.idAgencia)) seen.set(c.idAgencia, c.agencia);
    }
    return [...seen.entries()].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  get filtered(): CotizacionAgencia[] {
    let list = this.cotizacionesAgencia;
    if (this.selectedMoneda) list = list.filter(c => c.moneda === this.selectedMoneda);
    if (this.selectedAgencia) list = list.filter(c => c.idAgencia === +this.selectedAgencia);
    return list;
  }

  get sorted(): CotizacionAgencia[] {
    const list = [...this.filtered];
    const dir = this.sortAsc ? 1 : -1;
    list.sort((a, b) => {
      let va: number | string, vb: number | string;
      switch (this.sortKey) {
        case 'agencia': va = a.agencia; vb = b.agencia; break;
        case 'compra': va = a.compra; vb = b.compra; break;
        case 'venta': va = a.venta; vb = b.venta; break;
        case 'spread': va = a.spread; vb = b.spread; break;
        case 'diff': va = a.diffCompra ?? 0; vb = b.diffCompra ?? 0; break;
        default: return 0;
      }
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return list;
  }

  toggleSort(key: SortKey): void {
    if (this.sortKey === key) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortKey = key;
      this.sortAsc = key === 'agencia';
    }
  }

  sortIcon(key: SortKey): string {
    if (this.sortKey !== key) return 'ti-arrows-sort';
    return this.sortAsc ? 'ti-sort-ascending' : 'ti-sort-descending';
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

  diffClass(c: CotizacionAgencia): string {
    if (c.diffCompra == null || c.diffCompra === 0) return '';
    if (c.diffCompra < -0.2) return 'p-bad';
    if (c.diffCompra < 0) return 'p-warn';
    return 'p-ok';
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

  get minSpreadAgencia(): CotizacionAgencia | null {
    const f = this.filtered;
    return f.length ? f.reduce((a, b) => a.spread < b.spread ? a : b) : null;
  }

  get maxSpreadAgencia(): CotizacionAgencia | null {
    const f = this.filtered;
    return f.length ? f.reduce((a, b) => a.spread > b.spread ? a : b) : null;
  }
}
