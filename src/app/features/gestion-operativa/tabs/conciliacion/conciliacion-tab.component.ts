import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionOperativaService } from '../../gestion-operativa.service';
import { ConciliacionRemesas } from '../../gestion-operativa.models';
import { fmt } from '../../gestion-operativa.utils';

@Component({
  selector: 'app-conciliacion-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conciliacion-tab.component.html',
  styleUrl: './conciliacion-tab.component.scss',
})
export class ConciliacionTabComponent implements OnInit, OnChanges {
  @Input({ required: true }) fecha!: string;
  @Input() version = 0;

  private svc = inject(GestionOperativaService);

  conciliacion: ConciliacionRemesas | null = null;
  loading = true;
  search = '';

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
    this.loading = true;
    this.svc.getConciliacionRemesas(this.fecha).subscribe({
      next: (d) => { this.conciliacion = d; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  get filteredAgencias() {
    if (!this.conciliacion) return [];
    const q = this.search.trim().toLowerCase();
    if (!q) return this.conciliacion.porAgencia;
    return this.conciliacion.porAgencia.filter(ag =>
      ag.agencia.toLowerCase().includes(q)
    );
  }

  pctPagado(ag: { pagadasHoy: number; pendientes: number; atrasadas: number }): number {
    const total = ag.pagadasHoy + ag.pendientes + ag.atrasadas;
    return total > 0 ? Math.round((ag.pagadasHoy / total) * 100) : 0;
  }
}
