import { Component, Input, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PosAdminService } from '../../../pos-admin/pos-admin.service';
import {
  AgencyGroup, CashierInfo, CurrencyBalance,
  CashierMovement, ArqueoData, SaldoEntry,
} from '../../../pos-admin/pos-admin.models';
import { fmt } from '../../gestion-operativa.utils';

@Component({
  selector: 'app-cajas-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cajas-tab.component.html',
  styleUrl: './cajas-tab.component.scss',
})
export class CajasTabComponent implements OnInit, OnChanges {
  @Input({ required: true }) fecha!: string;
  @Input() version = 0;

  private posSvc = inject(PosAdminService);

  fmt = fmt;

  posGroups: AgencyGroup[] = [];
  posLoading = false;
  posSearch = '';
  expandedAgencies = new Set<number>();

  detailOpen = false;
  detailCashier: CashierInfo | null = null;
  detailAgency: AgencyGroup | null = null;
  detailLoading = false;
  detailView: 'movements' | 'arqueo' | 'saldo' = 'movements';

  movements: CashierMovement[] = [];
  arqueoData: ArqueoData | null = null;
  arqueoTipo: 'apertura' | 'cierre' = 'apertura';
  saldoHistory: SaldoEntry[] = [];
  saldoCaja: CurrencyBalance | null = null;

  ngOnInit(): void {
    this.loadCajas();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['fecha']?.firstChange && !changes['version']?.firstChange) {
      this.loadCajas();
    }
  }

  loadCajas(): void {
    this.posLoading = true;
    this.posSvc.getDashboard(this.fecha).subscribe({
      next: (r) => {
        this.posGroups = r.agencies;
        this.posLoading = false;
        if (this.posGroups.length <= 3) {
          this.posGroups.forEach(a => this.expandedAgencies.add(a.idAgencia));
        }
      },
      error: () => { this.posLoading = false; },
    });
  }

  togglePosAgency(id: number): void {
    this.expandedAgencies.has(id) ? this.expandedAgencies.delete(id) : this.expandedAgencies.add(id);
  }

  get filteredPosGroups(): AgencyGroup[] {
    const q = this.posSearch.trim().toLowerCase();
    return this.posGroups.map(ag => ({
      ...ag,
      cashiers: ag.cashiers
        .filter(c => c.estado !== 'sin_apertura')
        .filter(c => !q ||
          c.nombreCajero.toLowerCase().includes(q) ||
          c.loginUsuario.toLowerCase().includes(q) ||
          String(c.numCaja).includes(q)
        )
        .map(c => ({
          ...c,
          balances: c.balances.filter(b => b.saldoActual !== 0),
        })),
    })).filter(ag => ag.cashiers.length > 0);
  }

  posCountByEstado(ag: AgencyGroup, estado: string): number {
    return ag.cashiers.filter(c => c.estado === estado).length;
  }

  openDetail(cashier: CashierInfo, agency: AgencyGroup, view: 'movements' | 'arqueo' | 'saldo' = 'movements'): void {
    this.detailCashier = cashier;
    this.detailAgency = agency;
    this.detailView = view;
    this.detailOpen = true;
    this.loadDetailView();
  }

  closeDetail(): void {
    this.detailOpen = false;
    this.detailCashier = null;
  }

  setDetailView(view: 'movements' | 'arqueo' | 'saldo'): void {
    this.detailView = view;
    this.loadDetailView();
  }

  private loadDetailView(): void {
    if (!this.detailCashier || !this.detailAgency) return;
    const c = this.detailCashier;
    const agId = this.detailAgency.idAgencia;
    this.detailLoading = true;

    if (this.detailView === 'movements') {
      this.posSvc.getMovements(c.numCaja, agId, this.fecha).subscribe({
        next: (r) => { this.movements = r.movements; this.detailLoading = false; },
        error: () => { this.detailLoading = false; },
      });
    } else if (this.detailView === 'arqueo') {
      this.posSvc.getArqueo(c.numCaja, agId, this.fecha, this.arqueoTipo).subscribe({
        next: (r) => { this.arqueoData = r.arqueo; this.detailLoading = false; },
        error: () => { this.detailLoading = false; },
      });
    } else if (this.detailView === 'saldo' && this.saldoCaja) {
      this.posSvc.getSaldoHistory(this.saldoCaja.idCaja, this.fecha).subscribe({
        next: (r) => { this.saldoHistory = r.history; this.detailLoading = false; },
        error: () => { this.detailLoading = false; },
      });
    } else {
      this.detailLoading = false;
    }
  }

  selectSaldoCaja(bal: CurrencyBalance): void {
    this.saldoCaja = bal;
    this.detailView = 'saldo';
    this.loadDetailView();
  }

  changeArqueoTipo(tipo: 'apertura' | 'cierre'): void {
    this.arqueoTipo = tipo;
    this.loadDetailView();
  }

  estadoCajaPill(estado: string): string {
    switch (estado) {
      case 'activo': return 'p-ok';
      case 'cerrado': return 'p-info';
      case 'sin_apertura': return 'p-warn';
      default: return '';
    }
  }

  estadoCajaLabel(estado: string): string {
    switch (estado) {
      case 'activo': return 'Activa';
      case 'cerrado': return 'Cerrada';
      case 'sin_apertura': return 'Sin apertura';
      default: return estado;
    }
  }
}
