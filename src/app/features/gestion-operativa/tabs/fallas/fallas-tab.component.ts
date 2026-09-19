import { Component, Input, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PosAdminService } from '../../../pos-admin/pos-admin.service';
import { FallaCaja } from '../../../pos-admin/pos-admin.models';
import { fmt } from '../../gestion-operativa.utils';

@Component({
  selector: 'app-fallas-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fallas-tab.component.html',
  styleUrl: './fallas-tab.component.scss',
})
export class FallasTabComponent implements OnInit, OnChanges {
  @Input({ required: true }) fecha!: string;
  @Input() version = 0;

  private posSvc = inject(PosAdminService);

  fmt = fmt;
  Math = Math;

  fallas: FallaCaja[] = [];
  loading = false;
  search = '';

  desde = '';
  hasta = '';
  holgura = 1;

  confirmTarget: FallaCaja | null = null;
  ratificando = false;

  anularCierreTarget: FallaCaja | null = null;
  anulando = false;

  ngOnInit(): void {
    this.setRangeFromFecha();
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['fecha']?.firstChange) {
      this.setRangeFromFecha();
      this.load();
    }
  }

  private setRangeFromFecha(): void {
    this.desde = this.fecha;
    this.hasta = this.fecha;
  }

  load(): void {
    this.loading = true;
    this.posSvc.getFallasCaja(this.desde, this.hasta, undefined, this.holgura).subscribe({
      next: (r) => { this.fallas = r.fallas; this.loading = false; },
      error: () => { this.fallas = []; this.loading = false; },
    });
  }

  get filtered(): FallaCaja[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.fallas;
    return this.fallas.filter(f =>
      f.cajero.toLowerCase().includes(q) ||
      f.agencia.toLowerCase().includes(q) ||
      f.agenciaAbr.toLowerCase().includes(q) ||
      f.moneda.toLowerCase().includes(q) ||
      String(f.numCaja).includes(q)
    );
  }

  get countFaltantes(): number {
    return this.fallas.filter(f => f.tipo === 'faltante').length;
  }

  get countSobrantes(): number {
    return this.fallas.filter(f => f.tipo === 'sobrante').length;
  }

  get totalesByMoneda(): { moneda: string; faltantes: number; sobrantes: number }[] {
    const map: Record<string, { faltantes: number; sobrantes: number }> = {};
    for (const f of this.fallas) {
      if (!map[f.moneda]) map[f.moneda] = { faltantes: 0, sobrantes: 0 };
      if (f.tipo === 'faltante') map[f.moneda].faltantes += Math.abs(f.diferencia);
      else map[f.moneda].sobrantes += f.diferencia;
    }
    return Object.entries(map).map(([moneda, v]) => ({ moneda, faltantes: v.faltantes, sobrantes: v.sobrantes }));
  }

  estadoPill(f: FallaCaja): string {
    if (f.estadoFalla === 'P') return 'p-warn';
    if (f.estadoFalla === 'C') return 'p-ok';
    return 'p-muted';
  }

  estadoLabel(f: FallaCaja): string {
    if (f.estadoFalla === 'P') return 'Ratificado';
    if (f.estadoFalla === 'C') return 'Cerrado';
    return 'Pendiente';
  }

  canRatificar(f: FallaCaja): boolean {
    return !f.estadoFalla;
  }

  canAnularCierre(f: FallaCaja): boolean {
    return f.fecha === new Date().toISOString().slice(0, 10) && f.estadoFalla !== 'C';
  }

  askRatificar(f: FallaCaja): void {
    this.confirmTarget = f;
  }

  cancelConfirm(): void {
    this.confirmTarget = null;
  }

  doRatificar(): void {
    if (!this.confirmTarget) return;
    const f = this.confirmTarget;
    this.ratificando = true;
    this.posSvc.ratificarFalla(f.idCaja, f.fecha, f.diferencia).subscribe({
      next: () => {
        f.estadoFalla = 'P';
        this.confirmTarget = null;
        this.ratificando = false;
      },
      error: () => {
        this.ratificando = false;
        this.confirmTarget = null;
      },
    });
  }

  askAnularCierre(f: FallaCaja): void {
    this.anularCierreTarget = f;
  }

  cancelAnularCierre(): void {
    this.anularCierreTarget = null;
  }

  doAnularCierre(): void {
    if (!this.anularCierreTarget) return;
    const f = this.anularCierreTarget;
    this.anulando = true;
    this.posSvc.anularCierre(f.idCaja, f.fecha).subscribe({
      next: () => {
        this.anularCierreTarget = null;
        this.anulando = false;
        this.load();
      },
      error: () => {
        this.anulando = false;
        this.anularCierreTarget = null;
      },
    });
  }
}
