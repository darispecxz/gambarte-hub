import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GestionOperativaService } from '../../gestion-operativa.service';
import { ResumenEjecutivo, RendimientoCajero } from '../../gestion-operativa.models';

@Component({
  selector: 'app-rendimiento-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rendimiento-tab.component.html',
  styleUrl: './rendimiento-tab.component.scss',
})
export class RendimientoTabComponent implements OnInit, OnChanges {
  @Input({ required: true }) fecha!: string;
  @Input() version = 0;

  private svc = inject(GestionOperativaService);

  resumen: ResumenEjecutivo | null = null;
  loading = true;
  expandedAgencies = new Set<number>();

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['fecha']?.firstChange && !changes['version']?.firstChange) {
      this.loadData();
    }
  }

  private loadData(): void {
    this.loading = true;
    this.svc.getResumenEjecutivo(this.fecha).subscribe({
      next: (d) => { this.resumen = d; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  toggleAgency(id: number): void {
    this.expandedAgencies.has(id) ? this.expandedAgencies.delete(id) : this.expandedAgencies.add(id);
  }

  get totalOpsGlobal(): number {
    return this.resumen?.rendimientoCajeros.reduce((s, r) => s + r.ops, 0) ?? 0;
  }

  get maxActividad(): number {
    if (!this.resumen) return 1;
    return Math.max(...this.resumen.actividadAgencias.map(a => a.total), 1);
  }

  actividadColor(total: number): string {
    const pct = total / this.maxActividad;
    if (pct >= 0.75) return 'heat-high';
    if (pct >= 0.4) return 'heat-med';
    if (pct > 0) return 'heat-low';
    return 'heat-none';
  }

  rendimientoPorAgencia(idAgencia: number): RendimientoCajero[] {
    return this.resumen?.rendimientoCajeros.filter(r => r.idAgencia === idAgencia) ?? [];
  }

  maxOpsHora(idAgencia: number): number {
    const cajeros = this.rendimientoPorAgencia(idAgencia);
    return cajeros.length ? Math.max(...cajeros.map(c => c.opsHora), 1) : 1;
  }

  get rendimientoAgencias(): { idAgencia: number; agencia: string; cajeros: number; totalOps: number; promedioOpsH: number; cambios: number; giros: number; remesas: number; pagos: number }[] {
    if (!this.resumen) return [];
    const map = new Map<number, { agencia: string; cajeros: number; totalOps: number; sumOpsH: number; cambios: number; giros: number; remesas: number; pagos: number }>();
    for (const r of this.resumen.rendimientoCajeros) {
      const entry = map.get(r.idAgencia) ?? { agencia: r.agencia, cajeros: 0, totalOps: 0, sumOpsH: 0, cambios: 0, giros: 0, remesas: 0, pagos: 0 };
      entry.cajeros++;
      entry.totalOps += r.ops;
      entry.sumOpsH += r.opsHora;
      entry.cambios += r.cambios;
      entry.giros += r.giros;
      entry.remesas += r.remesas;
      entry.pagos += r.pagos;
      map.set(r.idAgencia, entry);
    }
    return Array.from(map.entries())
      .map(([id, e]) => ({ idAgencia: id, agencia: e.agencia, cajeros: e.cajeros, totalOps: e.totalOps, promedioOpsH: Math.round((e.sumOpsH / e.cajeros) * 10) / 10, cambios: e.cambios, giros: e.giros, remesas: e.remesas, pagos: e.pagos }))
      .sort((a, b) => b.totalOps - a.totalOps);
  }
}
