import { Component, Input, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PosAdminService } from '../../../pos-admin/pos-admin.service';
import {
  AgencyGroup, CashierInfo, CurrencyBalance,
  CashierMovement, ArqueoData, SaldoEntry,
} from '../../../pos-admin/pos-admin.models';
import { fmt } from '../../gestion-operativa.utils';

type DetailView = 'movements' | 'arqueo' | 'saldo';

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
  detailView: DetailView = 'movements';

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

  toggleAgency(id: number): void {
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
        ),
    })).filter(ag => ag.cashiers.length > 0);
  }

  countByStatus(ag: AgencyGroup, estado: string): number {
    return ag.cashiers.filter(c => c.estado === estado).length;
  }

  statusLabel(estado: string): string {
    switch (estado) {
      case 'activo': return 'Activo';
      case 'cerrado': return 'Cerrado';
      default: return 'Sin apertura';
    }
  }

  statusIcon(estado: string): string {
    switch (estado) {
      case 'activo': return 'ti-circle-check';
      case 'cerrado': return 'ti-lock';
      default: return 'ti-circle-x';
    }
  }

  hora(dt: string | null): string {
    if (!dt) return '-';
    const parts = dt.split(' ');
    return parts.length > 1 ? parts[1].substring(0, 5) : dt;
  }

  // ── Detail Panel ──

  openMovements(ag: AgencyGroup, c: CashierInfo): void {
    this.detailAgency = ag;
    this.detailCashier = c;
    this.detailView = 'movements';
    this.detailOpen = true;
    this.loadMovements();
  }

  openArqueo(ag: AgencyGroup, c: CashierInfo, tipo: 'apertura' | 'cierre'): void {
    this.detailAgency = ag;
    this.detailCashier = c;
    this.detailView = 'arqueo';
    this.arqueoTipo = tipo;
    this.detailOpen = true;
    this.loadArqueo();
  }

  openSaldoHistory(ag: AgencyGroup, c: CashierInfo, bal: CurrencyBalance): void {
    this.detailAgency = ag;
    this.detailCashier = c;
    this.detailView = 'saldo';
    this.saldoCaja = bal;
    this.detailOpen = true;
    this.loadSaldoHistory(bal.idCaja);
  }

  closeDetail(): void {
    this.detailOpen = false;
    this.detailCashier = null;
    this.detailAgency = null;
  }

  private loadMovements(): void {
    if (!this.detailCashier || !this.detailAgency) return;
    this.detailLoading = true;
    this.posSvc.getMovements(this.detailCashier.numCaja, this.detailAgency.idAgencia, this.fecha).subscribe({
      next: (r) => { this.movements = r.movements; this.detailLoading = false; },
      error: () => { this.movements = []; this.detailLoading = false; },
    });
  }

  private loadArqueo(): void {
    if (!this.detailCashier || !this.detailAgency) return;
    this.detailLoading = true;
    this.posSvc.getArqueo(this.detailCashier.numCaja, this.detailAgency.idAgencia, this.fecha, this.arqueoTipo).subscribe({
      next: (r) => { this.arqueoData = r.arqueo; this.detailLoading = false; },
      error: () => { this.arqueoData = null; this.detailLoading = false; },
    });
  }

  private loadSaldoHistory(idCaja: number): void {
    this.detailLoading = true;
    this.posSvc.getSaldoHistory(idCaja, this.fecha).subscribe({
      next: (r) => { this.saldoHistory = r.history; this.detailLoading = false; },
      error: () => { this.saldoHistory = []; this.detailLoading = false; },
    });
  }

  changeSaldoCaja(bal: CurrencyBalance): void {
    this.saldoCaja = bal;
    this.loadSaldoHistory(bal.idCaja);
  }

  changeArqueoTipo(tipo: 'apertura' | 'cierre'): void {
    this.arqueoTipo = tipo;
    this.loadArqueo();
  }

  // ── Printing ──

  private esc(s: any): string {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private num(v: number | null | undefined, d = 2): string {
    if (v === null || v === undefined) return '0.00';
    return v.toFixed(d);
  }

  private openPrintA4(title: string, html: string): void {
    const page = `<!DOCTYPE html><html><head><title>${title}</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; margin: 0; padding: 0; }
  h2 { text-align: center; font-size: 16px; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th, td { padding: 4px 6px; border: 1px solid #ccc; font-size: 11px; }
  th { background: #f0f0f0; font-weight: bold; text-align: left; }
  .r { text-align: right; } .c { text-align: center; } .b { font-weight: bold; }
  .header-info { margin-bottom: 8px; }
  .header-info span { margin-right: 20px; }
  .sig-area { display: flex; justify-content: space-between; margin-top: 40px; }
  .sig-box { text-align: center; width: 40%; border-top: 1px solid #000; padding-top: 4px; font-weight: bold; }
  .total-row td { font-weight: bold; background: #f8f8f8; }
</style></head><body>
${html}
<script>window.onload=function(){window.print();}</script>
</body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(page); w.document.close(); }
  }

  printMovements(): void {
    if (!this.detailCashier || !this.detailAgency) return;
    const c = this.detailCashier;
    const ag = this.detailAgency;
    let rows = '';
    for (const m of this.movements) {
      const signo = m.tipo === 1 ? '+' : '-';
      rows += `<tr>
        <td class="c">${m.correlativo}</td>
        <td>${this.esc(m.tipoDesc)}</td>
        <td>${this.esc(m.nombre)}</td>
        <td>${this.esc(m.comprobante)}</td>
        <td class="c">${this.esc(m.moneda)}</td>
        <td class="r">${signo}${this.num(m.monto)}</td>
        <td class="c">${this.hora(m.fechaHora)}</td>
      </tr>`;
    }
    this.openPrintA4(`Movimientos Caja ${c.numCaja} - ${this.fecha}`, `
      <h2>MOVIMIENTOS DE CAJA [${c.numCaja}]</h2>
      <div class="header-info">
        <span><b>Agencia:</b> ${this.esc(ag.nombre)}</span>
        <span><b>Cajero:</b> ${this.esc(c.nombreCajero)}</span><br />
        <span><b>Fecha:</b> ${this.esc(this.fecha)}</span>
        <span><b>Total movimientos:</b> ${this.movements.length}</span>
      </div>
      <table>
        <tr><th>#</th><th>Tipo</th><th>Nombre</th><th>Comprobante</th><th>Mon</th><th class="r">Monto</th><th>Hora</th></tr>
        ${rows}
      </table>
      <div class="sig-area">
        <div class="sig-box">Firma Supervisor</div>
        <div class="sig-box">Firma Cajero</div>
      </div>`);
  }

  printArqueo(): void {
    if (!this.arqueoData || !this.detailCashier || !this.detailAgency) return;
    const c = this.detailCashier;
    const ag = this.detailAgency;
    const tipo = this.arqueoTipo === 'apertura' ? 'APERTURA' : 'CIERRE';
    let tablesHtml = '';
    for (const cur of this.arqueoData.currencies) {
      let rows = '';
      for (const item of cur.items) {
        rows += `<tr>
          <td class="r">${this.num(item.valor)}</td>
          <td class="c">${this.esc(item.agrupacion)}</td>
          <td class="c">${item.multiplicador}</td>
          <td class="r">${item.cantidad}</td>
          <td class="r b">${this.num(item.subtotal)}</td>
        </tr>`;
      }
      tablesHtml += `
        <table>
          <tr><th colspan="5" class="c">${this.esc(cur.moneda)}</th></tr>
          <tr><th class="r">Corte</th><th class="c">Tipo</th><th class="c">Mult</th><th class="r">Cant</th><th class="r">Subtotal</th></tr>
          ${rows}
          <tr class="total-row"><td colspan="4" class="r">TOTAL ${this.esc(cur.moneda)}</td><td class="r">${this.num(cur.total)}</td></tr>
        </table>`;
    }
    this.openPrintA4(`${tipo} Caja ${c.numCaja} - ${ag.nombre}`, `
      <h2>${tipo} DE CAJA [${c.numCaja}]</h2>
      <div class="header-info">
        <span><b>Agencia:</b> ${this.esc(ag.nombre)}</span>
        <span><b>Cajero:</b> ${this.esc(c.nombreCajero)}</span><br />
        <span><b>Fecha:</b> ${this.esc(this.fecha)}</span>
        <span><b>Hora:</b> ${this.esc(this.arqueoTipo === 'apertura' ? this.hora(c.horaApertura) : this.hora(c.horaCierre))}</span>
      </div>
      ${tablesHtml}
      <div class="sig-area">
        <div class="sig-box">Firma y Sello Supervisor</div>
        <div class="sig-box">Firma y Sello Cajero</div>
      </div>
      <p style="text-align:center;font-size:9px;margin-top:20px;">Esta entidad es supervisada por ASFI</p>`);
  }

  printSaldoHistory(): void {
    if (!this.detailCashier || !this.detailAgency || !this.saldoCaja) return;
    const c = this.detailCashier;
    const ag = this.detailAgency;
    const bal = this.saldoCaja;
    let rows = '';
    for (const s of this.saldoHistory) {
      rows += `<tr>
        <td>${this.esc(s.tipoDesc)}</td>
        <td class="c">${this.esc(s.conciliacion)}</td>
        <td class="r">${s.monto >= 0 ? '+' : ''}${this.num(s.monto)}</td>
        <td class="r b">${this.num(s.acumulado)}</td>
        <td class="c">${this.hora(s.fechaHora)}</td>
      </tr>`;
    }
    this.openPrintA4(`Saldo Caja ${c.numCaja} ${bal.moneda} - ${this.fecha}`, `
      <h2>HISTORIAL DE SALDO - CAJA [${c.numCaja}] ${this.esc(bal.moneda)}</h2>
      <div class="header-info">
        <span><b>Agencia:</b> ${this.esc(ag.nombre)}</span>
        <span><b>Cajero:</b> ${this.esc(c.nombreCajero)}</span><br />
        <span><b>Fecha:</b> ${this.esc(this.fecha)}</span>
        <span><b>Moneda:</b> ${this.esc(bal.moneda)}</span>
      </div>
      <table>
        <tr><th>Concepto</th><th>Cod</th><th class="r">Monto</th><th class="r">Acumulado</th><th>Hora</th></tr>
        ${rows}
      </table>`);
  }
}
