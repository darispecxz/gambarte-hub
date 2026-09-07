import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionOperativaService } from '../../gestion-operativa.service';
import {
  Consolidado, AgenciaConsolidada, DetalleAgencia, MonedaSaldo,
  ResumenEjecutivo, ComparativaAgencia,
} from '../../gestion-operativa.models';
import { fmt, fmtCompact, alertPill, alertIcon, alertLabel } from '../../gestion-operativa.utils';

@Component({
  selector: 'app-consolidado-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consolidado-tab.component.html',
  styleUrl: './consolidado-tab.component.scss',
})
export class ConsolidadoTabComponent implements OnInit, OnChanges {
  @Input({ required: true }) fecha!: string;
  @Input() version = 0;

  private svc = inject(GestionOperativaService);

  consolidado: Consolidado | null = null;
  resumen: ResumenEjecutivo | null = null;
  loading = true;
  error = '';

  selectedAgency: AgenciaConsolidada | null = null;
  detalle: DetalleAgencia | null = null;
  detalleLoading = false;
  searchTerm = '';

  fmt = fmt;
  fmtCompact = fmtCompact;
  alertPill = alertPill;
  alertIcon = alertIcon;
  alertLabel = alertLabel;

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
    this.error = '';
    this.selectedAgency = null;
    this.detalle = null;

    this.svc.getConsolidado(this.fecha).subscribe({
      next: (d) => { this.consolidado = d; this.loading = false; },
      error: (e) => { this.error = e.message || 'Error al cargar consolidado'; this.loading = false; },
    });
    this.svc.getResumenEjecutivo(this.fecha).subscribe({
      next: (d) => { this.resumen = d; },
    });
  }

  selectAgency(ag: AgenciaConsolidada): void {
    if (this.selectedAgency?.idAgencia === ag.idAgencia) {
      this.selectedAgency = null;
      this.detalle = null;
      return;
    }
    this.selectedAgency = ag;
    this.detalle = null;
    this.detalleLoading = true;
    this.svc.getDetalleAgencia(this.fecha, ag.idAgencia).subscribe({
      next: (d) => { this.detalle = d; this.detalleLoading = false; },
      error: () => { this.detalleLoading = false; },
    });
  }

  backToList(): void {
    this.selectedAgency = null;
    this.detalle = null;
  }

  get filteredAgencias(): AgenciaConsolidada[] {
    if (!this.consolidado) return [];
    const term = this.searchTerm.toLowerCase();
    let list = this.consolidado.agencias;
    if (term) {
      list = list.filter(a =>
        a.agencia.toLowerCase().includes(term) || a.abreviatura.toLowerCase().includes(term)
      );
    }
    return [...list].sort((a, b) => b.totalBOB - a.totalBOB);
  }

  maxTotalBOB(): number {
    if (!this.consolidado) return 1;
    return Math.max(...this.consolidado.agencias.map(a => a.totalBOB), 1);
  }

  barPct(val: number): number {
    return Math.min((val / this.maxTotalBOB()) * 100, 100);
  }

  agTotalEfectivo(ag: AgenciaConsolidada): number {
    return ag.monedas.reduce((s, m) => s + m.caja * m.tcBob, 0);
  }

  agTotalBoveda(ag: AgenciaConsolidada): number {
    return ag.monedas.reduce((s, m) => s + m.boveda * m.tcBob, 0);
  }

  agTotalBanco(ag: AgenciaConsolidada): number {
    return ag.monedas.reduce((s, m) => s + m.banco * m.tcBob, 0);
  }

  comparativaAgencia(idAgencia: number): ComparativaAgencia | undefined {
    return this.resumen?.comparativa.porAgencia.find(c => c.idAgencia === idAgencia);
  }

  saldoClass(mon: MonedaSaldo): string {
    if (mon.alertas.some(a => a.tipo === 'saldo_bajo')) return 'saldo-bajo';
    if (mon.alertas.some(a => a.tipo === 'saldo_excedido')) return 'saldo-excedido';
    return '';
  }
}
