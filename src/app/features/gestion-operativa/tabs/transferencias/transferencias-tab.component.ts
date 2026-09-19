import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionOperativaService } from '../../gestion-operativa.service';
import { TransferenciaBoveda } from '../../gestion-operativa.models';
import { fmt, estadoPill } from '../../gestion-operativa.utils';

@Component({
  selector: 'app-transferencias-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transferencias-tab.component.html',
  styleUrl: './transferencias-tab.component.scss',
})
export class TransferenciasTabComponent implements OnInit, OnChanges {
  @Input({ required: true }) fecha!: string;
  @Input() version = 0;

  private svc = inject(GestionOperativaService);

  transferencias: TransferenciaBoveda[] = [];
  loading = true;
  error = '';
  search = '';

  fmt = fmt;
  estadoPill = estadoPill;

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
    this.svc.getTransferencias(this.fecha).subscribe({
      next: (d) => { this.transferencias = d; this.loading = false; },
      error: (e) => { this.error = e.message || 'Error al cargar transferencias'; this.loading = false; },
    });
  }

  get filtered(): TransferenciaBoveda[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.transferencias;
    return this.transferencias.filter(t =>
      t.agenciaOrigen.toLowerCase().includes(q) ||
      t.agenciaDestino.toLowerCase().includes(q) ||
      t.moneda.toLowerCase().includes(q) ||
      t.estadoDesc.toLowerCase().includes(q)
    );
  }

  get totalMonto(): number {
    return this.transferencias.reduce((s, t) => s + t.monto, 0);
  }
}
