import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BankingService } from './banking.service';
import { LoadingComponent } from '../../shared/loading.component';
import { environment } from '../../../environments/environment';
import { Agency } from '../accounting/accounting.models';
import {
  BankMovement,
  BankMovementsReport,
  ConciliacionContableReport,
  ConciliacionCuenta,
  ConciliacionDetalleResponse,
  BankDailySummaryReport,
  BankTransfersReport,
  MovementDetailResponse,
} from './banking.models';

type ReportType = 'conciliacion' | 'daily' | 'movements' | 'transfers';

interface ReportTab {
  key: ReportType;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-banking',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
  templateUrl: './banking.component.html',
  styleUrl: './banking.component.scss',
})
export class BankingComponent implements OnInit {
  private svc = inject(BankingService);

  tabs: ReportTab[] = [
    { key: 'conciliacion', label: 'Conciliación Contable', icon: 'ti-scale' },
    { key: 'daily',        label: 'Resumen Diario',        icon: 'ti-calendar-stats' },
    { key: 'movements',    label: 'Movimientos',           icon: 'ti-list-details' },
    { key: 'transfers',    label: 'Traspasos',             icon: 'ti-transfer-vertical' },
  ];

  selected: ReportType = 'conciliacion';
  desde = new Date().toISOString().slice(0, 10);
  hasta = '';
  agencia: number | null = null;
  estadoTraspaso = '';
  conciliacionFilter = '';
  agencies: Agency[] = [];

  loading = false;
  error = '';

  conciliacionReport: ConciliacionContableReport | null = null;
  dailyReport: BankDailySummaryReport | null = null;
  movementsReport: BankMovementsReport | null = null;
  transfersReport: BankTransfersReport | null = null;

  expandedCuentas = new Set<string>();
  cuentaDetalles = new Map<string, ConciliacionDetalleResponse>();
  cuentaDetalleLoading = new Set<string>();

  movSearch = '';

  // ── Movement detail panel ──
  detailOpen = false;
  detailLoading = false;
  detailError = '';
  movDetail: MovementDetailResponse | null = null;

  conciliacionOptions = [
    { value: '', label: 'Todos' },
    { value: 'A',  label: 'Apertura' },
    { value: 'C',  label: 'Cierre' },
    { value: 'DE', label: 'Dep. Efectivo' },
    { value: 'ST', label: 'Salida Traspaso' },
    { value: 'RT', label: 'Reversión' },
    { value: 'CC', label: 'Cobro Cheque' },
    { value: 'DR', label: 'Débito Remesa' },
    { value: 'EX', label: 'Ingreso Externo' },
  ];

  ngOnInit(): void {
    this.svc.getAgencies().subscribe({
      next: (list) => (this.agencies = list),
    });
    this.load();
  }

  select(key: ReportType): void {
    this.selected = key;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.conciliacionReport = this.dailyReport = null;
    this.movementsReport = this.transfersReport = null;

    switch (this.selected) {
      case 'conciliacion':
        this.svc.getConciliacion(this.desde, this.agencia ?? undefined).subscribe({
          next: (d) => { this.conciliacionReport = d; this.loading = false; },
          error: (e: Error) => this.fail(e),
        });
        break;
      case 'daily':
        this.svc.getDailySummary(this.desde).subscribe({
          next: (d) => { this.dailyReport = d.report; this.loading = false; },
          error: (e: Error) => this.fail(e),
        });
        break;
      case 'movements':
        this.svc.getMovements(
          this.desde, this.hasta || undefined,
          this.agencia ?? undefined, undefined, undefined,
          this.conciliacionFilter || undefined
        ).subscribe({
          next: (d) => { this.movementsReport = d; this.loading = false; },
          error: (e: Error) => this.fail(e),
        });
        break;
      case 'transfers':
        this.svc.getTransfers(
          this.desde, this.hasta || undefined,
          this.estadoTraspaso || undefined
        ).subscribe({
          next: (d) => { this.transfersReport = d; this.loading = false; },
          error: (e: Error) => this.fail(e),
        });
        break;
    }
  }

  private fail(e: Error): void {
    this.error = e?.message || 'Error al cargar el reporte';
    this.loading = false;
  }

  // ── Conciliación helpers ──

  toggleCuenta(c: ConciliacionCuenta): void {
    const k = this.cuentaKey(c);
    if (this.expandedCuentas.has(k)) {
      this.expandedCuentas.delete(k);
    } else {
      this.expandedCuentas.add(k);
      if (!c.conciliado && !this.cuentaDetalles.has(k) && !this.cuentaDetalleLoading.has(k)) {
        this.cuentaDetalleLoading.add(k);
        this.svc.getConciliacionDetalle(
          this.desde, c.idAgencia, c.idEntidadFinanciera, c.numCuenta, c.idMoneda
        ).subscribe({
          next: (d) => { this.cuentaDetalles.set(k, d); this.cuentaDetalleLoading.delete(k); },
          error: () => { this.cuentaDetalleLoading.delete(k); },
        });
      }
    }
  }

  isOpen(c: ConciliacionCuenta): boolean {
    return this.expandedCuentas.has(this.cuentaKey(c));
  }

  cuentaKey(c: ConciliacionCuenta): string {
    return `${c.idAgencia}-${c.entidad}-${c.numCuenta}-${c.moneda}`;
  }

  getDetalle(c: ConciliacionCuenta): ConciliacionDetalleResponse | undefined {
    return this.cuentaDetalles.get(this.cuentaKey(c));
  }

  isDetalleLoading(c: ConciliacionCuenta): boolean {
    return this.cuentaDetalleLoading.has(this.cuentaKey(c));
  }

  // ── Movement detail ──

  openDetail(m: BankMovement): void {
    this.detailOpen = true;
    this.detailLoading = true;
    this.detailError = '';
    this.movDetail = null;

    this.svc.getMovementDetail(
      m.idAgencia, m.idEntidadFinanciera, m.numCuenta, m.idMoneda,
      m.fechaRegistro, m.conciliacion, m.monto
    ).subscribe({
      next: (d) => { this.movDetail = d; this.detailLoading = false; },
      error: (e: Error) => { this.detailError = e?.message || 'Error al cargar detalle'; this.detailLoading = false; },
    });
  }

  closeDetail(): void {
    this.detailOpen = false;
    this.movDetail = null;
    this.detailError = '';
  }

  get comprobanteFullUrl(): string | null {
    const rel = this.movDetail?.comprobanteUrl;
    if (!rel) return null;
    return environment.legacyBase + rel;
  }

  exportDetailPdf(): void {
    const d = this.movDetail;
    if (!d) return;
    const m = d.movimiento;
    const montoAbs = Math.abs(m.monto).toFixed(2);
    const esIngreso = m.concepto === 'INGRESO';

    let partidasHtml = '';
    if (d.asiento) {
      const rows = d.asiento.partidas.map(p => {
        const hl = p.codsubcuenta === d.codsubcuenta ? 'background:#fff7ed;font-weight:600;' : '';
        return `<tr style="${hl}">
          <td style="padding:4px 8px;border:1px solid #e5e7eb;font-family:monospace;font-size:10px">${this.esc(p.codsubcuenta)}</td>
          <td style="padding:4px 8px;border:1px solid #e5e7eb;font-size:10px">${this.esc(p.subcuentaDesc)}</td>
          <td style="padding:4px 8px;border:1px solid #e5e7eb;font-size:10px">${this.esc(p.detalle || '')}</td>
          <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;font-size:10px">${p.debe.toFixed(2)}</td>
          <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;font-size:10px">${p.haber.toFixed(2)}</td>
        </tr>`;
      }).join('');

      partidasHtml = `
        <div style="margin-top:20px">
          <h3 style="font-size:13px;color:#374151;border-bottom:2px solid #e5e7eb;padding-bottom:4px;margin:0 0 8px">
            ASIENTO CONTABLE — ${this.esc(d.asiento.tipoLabel)} N° ${this.esc(d.asiento.idconcepto)}-${d.asiento.numero}
          </h3>
          <table style="font-size:10px;margin-bottom:6px">
            <tr><td style="color:#6b7280;width:100px">ID Asiento:</td><td><strong>#${d.asiento.idasiento}</strong></td>
                <td style="color:#6b7280;width:100px;padding-left:20px">Fecha:</td><td>${this.esc(d.asiento.fecha)}</td>
                <td style="color:#6b7280;width:100px;padding-left:20px">Tipo Doc.:</td><td>${this.esc(d.asiento.tipodocumento)}</td></tr>
            <tr><td style="color:#6b7280">Concepto:</td><td colspan="5">${this.esc(d.asiento.concepto)}</td></tr>
          </table>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:#f3f4f6">
              <th style="padding:5px 8px;border:1px solid #d1d5db;text-align:left;font-size:9px;text-transform:uppercase">Código</th>
              <th style="padding:5px 8px;border:1px solid #d1d5db;text-align:left;font-size:9px;text-transform:uppercase">Subcuenta</th>
              <th style="padding:5px 8px;border:1px solid #d1d5db;text-align:left;font-size:9px;text-transform:uppercase">Detalle</th>
              <th style="padding:5px 8px;border:1px solid #d1d5db;text-align:right;font-size:9px;text-transform:uppercase">Debe</th>
              <th style="padding:5px 8px;border:1px solid #d1d5db;text-align:right;font-size:9px;text-transform:uppercase">Haber</th>
            </tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr style="border-top:2px solid #374151;font-weight:bold">
              <td colspan="3" style="padding:5px 8px;border:1px solid #d1d5db;text-align:right;font-size:10px">TOTALES</td>
              <td style="padding:5px 8px;border:1px solid #d1d5db;text-align:right;font-size:10px">${d.asiento.totalDebe.toFixed(2)}</td>
              <td style="padding:5px 8px;border:1px solid #d1d5db;text-align:right;font-size:10px">${d.asiento.totalHaber.toFixed(2)}</td>
            </tr></tfoot>
          </table>
        </div>`;
    }

    let traspasoHtml = '';
    if (d.traspaso) {
      traspasoHtml = `
        <div style="margin-top:20px">
          <h3 style="font-size:13px;color:#374151;border-bottom:2px solid #e5e7eb;padding-bottom:4px;margin:0 0 8px">TRASPASO RELACIONADO</h3>
          <table style="font-size:11px">
            <tr><td style="color:#6b7280;width:120px">ID Traspaso:</td><td><strong>#${d.traspaso.id}</strong></td>
                <td style="color:#6b7280;width:80px;padding-left:20px">Estado:</td><td>${this.esc(d.traspaso.estadoDesc)}</td>
                <td style="color:#6b7280;width:80px;padding-left:20px">Monto:</td><td><strong>${d.traspaso.monto.toFixed(2)}</strong></td></tr>
            <tr><td style="color:#6b7280">Origen:</td><td colspan="5">${this.esc(d.traspaso.origenAgencia)} — ${this.esc(d.traspaso.origenEntidad)} ${this.esc(d.traspaso.origenCuenta)}</td></tr>
            <tr><td style="color:#6b7280">Destino:</td><td colspan="5">${this.esc(d.traspaso.destinoAgencia)} — ${this.esc(d.traspaso.destinoEntidad)} ${this.esc(d.traspaso.destinoCuenta)}</td></tr>
          </table>
        </div>`;
    }

    const html = `<!DOCTYPE html><html><head><title>Detalle Movimiento — ${this.esc(m.entidad)} ${this.esc(m.numCuenta)}</title>
<style>
  @page { size: portrait; margin: 15mm; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; margin: 0; padding: 20px; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #374151; padding-bottom: 12px; }
  .header h1 { font-size: 16px; margin: 0 0 2px; color: #111827; }
  .header h2 { font-size: 13px; margin: 0; color: #6b7280; font-weight: 400; }
  .entity { font-size: 14px; font-weight: 700; color: #374151; margin: 0 0 4px; }
  .section { margin-bottom: 16px; }
  .section h3 { font-size: 13px; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; margin: 0 0 10px; }
  .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; }
  .field { display: flex; flex-direction: column; }
  .field.full { grid-column: 1 / -1; }
  .field-label { font-size: 9px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; }
  .field-value { font-size: 12px; color: #111827; }
  .amount { font-size: 18px; font-weight: 700; }
  .amount.ingreso { color: #16a34a; }
  .amount.egreso { color: #dc2626; }
  .footer { margin-top: 30px; font-size: 9px; color: #9ca3af; display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 8px; }
</style></head><body>
<div class="header">
  <p class="entity">${this.esc(m.entidadDesc)}</p>
  <h1>DETALLE DE MOVIMIENTO BANCARIO</h1>
  <h2>Cuenta ${this.esc(m.numCuenta)} · ${this.esc(m.moneda)} — ${this.esc(m.tipoCuenta)}</h2>
</div>

<div class="section">
  <h3>DATOS DEL MOVIMIENTO</h3>
  <div class="fields">
    <div class="field"><span class="field-label">Agencia</span><span class="field-value">${this.esc(m.agencia)}</span></div>
    <div class="field"><span class="field-label">Entidad Financiera</span><span class="field-value">${this.esc(m.entidadDesc)}</span></div>
    <div class="field"><span class="field-label">Cuenta Bancaria</span><span class="field-value" style="font-family:monospace">${this.esc(m.numCuenta)}</span></div>
    <div class="field"><span class="field-label">Tipo de Cuenta</span><span class="field-value">${this.esc(m.tipoCuenta)}</span></div>
    <div class="field"><span class="field-label">Moneda</span><span class="field-value">${this.esc(m.monedaDesc)} (${this.esc(m.moneda)})</span></div>
    <div class="field"><span class="field-label">Fecha de Registro</span><span class="field-value" style="font-family:monospace">${this.esc(m.fechaRegistro)}</span></div>
    <div class="field"><span class="field-label">Monto</span><span class="field-value amount ${esIngreso ? 'ingreso' : 'egreso'}">${montoAbs} ${this.esc(m.moneda)}</span></div>
    <div class="field"><span class="field-label">Concepto</span><span class="field-value">${m.concepto}</span></div>
    <div class="field"><span class="field-label">Tipo de Operación</span><span class="field-value">${this.esc(m.conciliacionDesc)}</span></div>
    <div class="field"><span class="field-label">Usuario</span><span class="field-value">${this.esc(m.usuario)}</span></div>
    <div class="field full"><span class="field-label">Glosa</span><span class="field-value">${this.esc(m.glosa || '—')}</span></div>
    ${d.codsubcuenta ? `<div class="field"><span class="field-label">Subcuenta Contable</span><span class="field-value" style="font-family:monospace">${this.esc(d.codsubcuenta)}</span></div>` : ''}
  </div>
</div>

${partidasHtml}
${traspasoHtml}

<div class="footer">
  <span>Generado: ${new Date().toLocaleString()}</span>
  <span>CGR — Sistema de Gestión y Reportes</span>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  }

  // ── Filtered movements (client-side search) ──

  get filteredMovements(): BankMovement[] {
    const list = this.movementsReport?.movements ?? [];
    const q = this.movSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(m =>
      m.glosa?.toLowerCase().includes(q) ||
      m.numCuenta?.toLowerCase().includes(q) ||
      m.entidad?.toLowerCase().includes(q) ||
      m.usuario?.toLowerCase().includes(q)
    );
  }

  // ── Export movements ──

  exportMovements(format: 'xlsx' | 'pdf'): void {
    const rows = this.filteredMovements;
    if (!rows.length) return;
    if (format === 'xlsx') this.exportMovementsExcel(rows);
    else this.exportMovementsPdf(rows);
  }

  private exportMovementsExcel(rows: BankMovement[]): void {
    const hdr = ['#', 'Fecha', 'Agencia', 'Banco', 'Cuenta', 'Moneda', 'Concepto', 'Tipo Operación', 'Glosa', 'Ingreso', 'Egreso', 'Usuario'];
    const xml = rows.map((m, i) => {
      const ing = m.concepto === 'INGRESO' ? Math.abs(m.monto) : 0;
      const egr = m.concepto === 'EGRESO' ? Math.abs(m.monto) : 0;
      return `<Row>
        <Cell><Data ss:Type="Number">${i + 1}</Data></Cell>
        <Cell><Data ss:Type="String">${this.esc(m.fechaRegistro)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.esc(m.agencia)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.esc(m.entidad)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.esc(m.numCuenta)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.esc(m.moneda)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.esc(m.concepto)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.esc(m.conciliacionDesc)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.esc(m.glosa)}</Data></Cell>
        <Cell><Data ss:Type="Number">${ing.toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">${egr.toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.esc(m.usuario)}</Data></Cell>
      </Row>`;
    }).join('');

    const headerRow = `<Row ss:StyleID="hdr">${hdr.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>`;
    const periodo = this.hasta ? `${this.desde} al ${this.hasta}` : this.desde;

    const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
 <Style ss:ID="hdr"><Font ss:Bold="1" ss:Size="10"/><Interior ss:Color="#F3F4F6" ss:Pattern="Solid"/></Style>
 <Style ss:ID="title"><Font ss:Bold="1" ss:Size="12"/></Style>
</Styles>
<Worksheet ss:Name="Extracto Bancario">
<Table>
 <Row ss:StyleID="title"><Cell ss:MergeAcross="11"><Data ss:Type="String">EXTRACTO BANCARIO — Movimientos ${periodo}</Data></Cell></Row>
 <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
 ${headerRow}
 ${xml}
</Table>
</Worksheet>
</Workbook>`;

    const blob = new Blob([workbook], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracto_bancario_${this.desde}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private exportMovementsPdf(rows: BankMovement[]): void {
    const periodo = this.hasta ? `${this.desde} al ${this.hasta}` : this.desde;
    const trs = rows.map((m, i) => {
      const ing = m.concepto === 'INGRESO' ? Math.abs(m.monto).toFixed(2) : '';
      const egr = m.concepto === 'EGRESO' ? Math.abs(m.monto).toFixed(2) : '';
      return `<tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${this.esc(m.fechaRegistro)}</td>
        <td>${this.esc(m.agencia)}</td>
        <td>${this.esc(m.entidad)} ${this.esc(m.numCuenta)}</td>
        <td>${this.esc(m.moneda)}</td>
        <td>${this.esc(m.conciliacionDesc)}</td>
        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this.esc(m.glosa)}</td>
        <td style="text-align:right;color:green">${ing}</td>
        <td style="text-align:right;color:red">${egr}</td>
        <td>${this.esc(m.usuario)}</td>
      </tr>`;
    }).join('');

    const totalIng = rows.filter(m => m.concepto === 'INGRESO').reduce((s, m) => s + Math.abs(m.monto), 0);
    const totalEgr = rows.filter(m => m.concepto === 'EGRESO').reduce((s, m) => s + Math.abs(m.monto), 0);

    const html = `<!DOCTYPE html><html><head><title>Extracto Bancario ${periodo}</title>
<style>
  @page { size: landscape; margin: 12mm; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #1a1a1a; margin: 0; padding: 20px; }
  .header { text-align: center; margin-bottom: 16px; }
  .header h1 { font-size: 16px; margin: 0 0 4px; }
  .header p { font-size: 11px; color: #555; margin: 0; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f3f4f6; font-size: 9px; text-transform: uppercase; letter-spacing: .5px;
       padding: 6px 8px; text-align: left; border-bottom: 2px solid #d1d5db; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
  tr:nth-child(even) { background: #f9fafb; }
  .totals td { font-weight: bold; border-top: 2px solid #374151; font-size: 11px; }
  .footer { margin-top: 20px; font-size: 9px; color: #888; display: flex; justify-content: space-between; }
</style></head><body>
<div class="header">
  <h1>EXTRACTO BANCARIO</h1>
  <p>Período: ${periodo} &nbsp;|&nbsp; ${rows.length} movimiento(s)</p>
</div>
<table>
  <thead><tr>
    <th>#</th><th>Fecha</th><th>Agencia</th><th>Cuenta</th><th>Mon.</th><th>Tipo</th><th>Glosa</th><th style="text-align:right">Ingreso</th><th style="text-align:right">Egreso</th><th>Usuario</th>
  </tr></thead>
  <tbody>${trs}</tbody>
  <tfoot><tr class="totals">
    <td colspan="7" style="text-align:right">TOTALES</td>
    <td style="text-align:right;color:green">${totalIng.toFixed(2)}</td>
    <td style="text-align:right;color:red">${totalEgr.toFixed(2)}</td>
    <td></td>
  </tr></tfoot>
</table>
<div class="footer">
  <span>Generado: ${new Date().toLocaleString()}</span>
  <span>CGR — Sistema de Gestión y Reportes</span>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  }

  private esc(s: string): string {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Generic helpers ──

  needsDateRange(): boolean {
    return this.selected === 'movements' || this.selected === 'transfers';
  }

  transferEstadoClass(estado: string): string {
    switch (estado) {
      case 'A': return 'sem-ok';
      case 'P': return 'sem-warn';
      case 'R': return 'sem-bad';
      default: return '';
    }
  }
}
