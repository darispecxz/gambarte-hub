import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PosAdminService } from './pos-admin.service';
import { LoadingComponent } from '../../shared/loading.component';
import {
  AgencyGroup, CashierInfo, CurrencyBalance,
  CashierMovement, ArqueoData, SaldoEntry, Agency,
} from './pos-admin.models';

type DetailView = 'movements' | 'arqueo' | 'saldo';

@Component({
  selector: 'app-pos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
  templateUrl: './pos-admin.component.html',
  styleUrls: ['./pos-admin.component.scss'],
})
export class PosAdminComponent implements OnInit {
  private svc = inject(PosAdminService);

  fecha = new Date().toISOString().slice(0, 10);
  agenciaFilter: number | null = null;
  agencies: Agency[] = [];
  agencyGroups: AgencyGroup[] = [];
  loading = false;
  error = '';

  expandedAgencies = new Set<number>();
  searchQuery = '';

  // detail panel
  detailOpen = false;
  detailView: DetailView = 'movements';
  detailCashier: CashierInfo | null = null;
  detailAgency: AgencyGroup | null = null;
  detailLoading = false;

  movements: CashierMovement[] = [];
  arqueoData: ArqueoData | null = null;
  arqueoTipo: 'apertura' | 'cierre' = 'apertura';
  saldoHistory: SaldoEntry[] = [];
  saldoCaja: CurrencyBalance | null = null;

  ngOnInit() {
    this.svc.getAgencies().subscribe(a => this.agencies = a);
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.svc.getDashboard(this.fecha, this.agenciaFilter ?? undefined).subscribe({
      next: (r) => {
        this.agencyGroups = r.agencies;
        this.loading = false;
        if (this.agencyGroups.length <= 3) {
          this.agencyGroups.forEach(a => this.expandedAgencies.add(a.idAgencia));
        }
      },
      error: (e) => { this.error = e.message || 'Error al cargar'; this.loading = false; },
    });
  }

  toggleAgency(id: number) {
    this.expandedAgencies.has(id) ? this.expandedAgencies.delete(id) : this.expandedAgencies.add(id);
  }

  get filteredGroups(): AgencyGroup[] {
    if (!this.searchQuery.trim()) return this.agencyGroups;
    const q = this.searchQuery.toLowerCase();
    return this.agencyGroups.map(ag => ({
      ...ag,
      cashiers: ag.cashiers.filter(c =>
        c.nombreCajero.toLowerCase().includes(q) ||
        c.loginUsuario.toLowerCase().includes(q) ||
        String(c.numCaja).includes(q)
      ),
    })).filter(ag => ag.cashiers.length > 0);
  }

  totalBalance(c: CashierInfo): number {
    return c.balances.reduce((s, b) => s + b.saldoActual, 0);
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

  openMovements(ag: AgencyGroup, c: CashierInfo) {
    this.detailAgency = ag;
    this.detailCashier = c;
    this.detailView = 'movements';
    this.detailOpen = true;
    this.loadMovements();
  }

  openArqueo(ag: AgencyGroup, c: CashierInfo, tipo: 'apertura' | 'cierre') {
    this.detailAgency = ag;
    this.detailCashier = c;
    this.detailView = 'arqueo';
    this.arqueoTipo = tipo;
    this.detailOpen = true;
    this.loadArqueo();
  }

  openSaldoHistory(ag: AgencyGroup, c: CashierInfo, bal: CurrencyBalance) {
    this.detailAgency = ag;
    this.detailCashier = c;
    this.detailView = 'saldo';
    this.saldoCaja = bal;
    this.detailOpen = true;
    this.loadSaldoHistory(bal.idCaja);
  }

  closeDetail() {
    this.detailOpen = false;
    this.detailCashier = null;
    this.detailAgency = null;
  }

  private loadMovements() {
    if (!this.detailCashier || !this.detailAgency) return;
    this.detailLoading = true;
    this.svc.getMovements(this.detailCashier.numCaja, this.detailAgency.idAgencia, this.fecha).subscribe({
      next: (r) => { this.movements = r.movements; this.detailLoading = false; },
      error: () => { this.movements = []; this.detailLoading = false; },
    });
  }

  private loadArqueo() {
    if (!this.detailCashier || !this.detailAgency) return;
    this.detailLoading = true;
    this.svc.getArqueo(this.detailCashier.numCaja, this.detailAgency.idAgencia, this.fecha, this.arqueoTipo).subscribe({
      next: (r) => { this.arqueoData = r.arqueo; this.detailLoading = false; },
      error: () => { this.arqueoData = null; this.detailLoading = false; },
    });
  }

  private loadSaldoHistory(idCaja: number) {
    this.detailLoading = true;
    this.svc.getSaldoHistory(idCaja, this.fecha).subscribe({
      next: (r) => { this.saldoHistory = r.history; this.detailLoading = false; },
      error: () => { this.saldoHistory = []; this.detailLoading = false; },
    });
  }

  // ── Stats ──

  countByStatus(group: AgencyGroup, estado: string): number {
    return group.cashiers.filter(c => c.estado === estado).length;
  }

  // ── Printing ──

  private esc(s: any): string {
    if (s == null) return '';
    const str = String(s);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  num(v: number | null | undefined, d = 2): string {
    if (v === null || v === undefined) return '0.00';
    return v.toFixed(d);
  }

  private openPrint(title: string, html: string) {
    const page = `<!DOCTYPE html><html><head><title>${title}</title>
<style>
  @page { size: 80mm 300mm; margin: 5mm; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #000; margin: 0; padding: 0; }
  h2 { text-align: center; font-size: 16px; margin: 4px 0; padding-bottom: 4px; border-bottom: 0.25pt solid #000; }
  img.logo { display: block; margin: 0 auto; width: 100%; max-width: 400px; }
  table { width: 100%; border-collapse: collapse; }
  td, th { padding: 1px 2px; font-size: 13px; vertical-align: top; }
  th { font-weight: bold; }
  .sep-td { border-top: 0.25pt solid #000; }
  .r { text-align: right; }
  .b { font-weight: bold; }
  .c { text-align: center; }
  .xxs { font-size: 8px; }
  .sig-table td.sig-space { border-bottom: 0.25pt solid #000; height: 80px; }
  .sig-table td.sig-label { text-align: center; font-weight: bold; padding-top: 4px; }
</style></head><body>
${html}
<script>window.onload=function(){window.print();}</script>
</body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(page); w.document.close(); }
  }

  private openPrintA4(title: string, html: string) {
    const page = `<!DOCTYPE html><html><head><title>${title}</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; margin: 0; padding: 0; }
  h2 { text-align: center; font-size: 16px; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th, td { padding: 4px 6px; border: 1px solid #ccc; font-size: 11px; }
  th { background: #f0f0f0; font-weight: bold; text-align: left; }
  .r { text-align: right; }
  .c { text-align: center; }
  .b { font-weight: bold; }
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

  printArqueo() {
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

    const html = `
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
      <p style="text-align:center;font-size:9px;margin-top:20px;">Esta entidad es supervisada por ASFI</p>`;
    this.openPrintA4(`${tipo} Caja ${c.numCaja} - ${ag.nombre}`, html);
  }

  printMovements() {
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

    const html = `
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
      </div>`;
    this.openPrintA4(`Movimientos Caja ${c.numCaja} - ${this.fecha}`, html);
  }

  printSaldoHistory() {
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

    const html = `
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
      </table>`;
    this.openPrintA4(`Saldo Caja ${c.numCaja} ${bal.moneda} - ${this.fecha}`, html);
  }
}
