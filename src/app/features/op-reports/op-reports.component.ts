import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpReportsService } from './op-reports.service';
import { LoadingComponent } from '../../shared/loading.component';
import {
  OpReportType, OpReportTab, Agency,
  CambioRow, CambioDetail,
  GiroRow, GiroDetail,
  RemesaRow, RemesaDetail,
} from './op-reports.models';

export interface ExportColumn {
  key: string;
  label: string;
  selected: boolean;
  align?: 'left' | 'right' | 'center';
  format?: 'number' | 'number4' | 'text' | 'date';
}

@Component({
  selector: 'app-op-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
  templateUrl: './op-reports.component.html',
  styleUrl: './op-reports.component.scss',
})
export class OpReportsComponent implements OnInit {
  private svc = inject(OpReportsService);

  tabs: OpReportTab[] = [
    { key: 'cambios', label: 'Cambios', icon: 'ti-currency-dollar' },
    { key: 'giros',   label: 'Giros Nacionales', icon: 'ti-transfer-vertical' },
    { key: 'remesas', label: 'Remesas / Giros Int.', icon: 'ti-world' },
  ];

  selected: OpReportType = 'cambios';
  desde = new Date().toISOString().slice(0, 10);
  hasta = '';
  agencia: number | null = null;
  tipoOperacion: number | null = null;
  estadoFilter = '';
  subtipoFilter = '';
  codigoFilter = '';
  searchQuery = '';
  agencies: Agency[] = [];

  loading = false;
  error = '';

  cambiosData: CambioRow[] = [];
  girosData: GiroRow[] = [];
  remesasData: RemesaRow[] = [];
  totalRecords = 0;

  // Detail panel
  detailOpen = false;
  detailLoading = false;
  detailError = '';
  detailType: OpReportType | null = null;
  cambioDetail: CambioDetail | null = null;
  giroDetail: GiroDetail | null = null;
  remesaDetail: RemesaDetail | null = null;

  // Export dialog
  exportOpen = false;
  exportColumns: ExportColumn[] = [];

  private readonly cambioColumns: ExportColumn[] = [
    { key: 'id', label: '#', selected: true, align: 'center', format: 'text' },
    { key: 'agencia', label: 'Agencia', selected: true },
    { key: 'operador', label: 'Operador', selected: true },
    { key: 'usuarioFinanciero', label: 'Usuario Financiero', selected: true },
    { key: 'documento', label: 'Documento', selected: false },
    { key: 'fecha', label: 'Fecha', selected: true, format: 'date' },
    { key: 'tipo', label: 'Tipo', selected: true },
    { key: 'moneda', label: 'Moneda', selected: true, align: 'center' },
    { key: 'monto', label: 'Monto', selected: true, align: 'right', format: 'number' },
    { key: 'tipoCambio', label: 'T.C.', selected: true, align: 'right', format: 'number4' },
    { key: 'tipoCambioBob', label: 'T.C. BOB', selected: false, align: 'right', format: 'number4' },
    { key: 'totalOperacion', label: 'Total Operacion', selected: false, align: 'right', format: 'number' },
    { key: 'totalOperacionBob', label: 'Total BOB', selected: true, align: 'right', format: 'number' },
    { key: 'recibido', label: 'Recibido', selected: false, align: 'right', format: 'number' },
    { key: 'entregado', label: 'Entregado', selected: false, align: 'right', format: 'number' },
  ];

  private readonly giroColumns: ExportColumn[] = [
    { key: 'codigo', label: 'Codigo', selected: true, align: 'center' },
    { key: 'fecha', label: 'Fecha Registro', selected: true, format: 'date' },
    { key: 'usuarioFinanciero', label: 'Remitente', selected: true },
    { key: 'documento', label: 'Documento', selected: false },
    { key: 'telefonoUf', label: 'Telefono Remitente', selected: false },
    { key: 'destinatario', label: 'Destinatario', selected: true },
    { key: 'telefonoDest', label: 'Telefono Destinatario', selected: false },
    { key: 'agenciaOrigen', label: 'Origen', selected: true },
    { key: 'agenciaDestino', label: 'Destino', selected: true },
    { key: 'operador', label: 'Operador', selected: true },
    { key: 'moneda', label: 'Moneda', selected: true, align: 'center' },
    { key: 'monto', label: 'Monto Enviado', selected: true, align: 'right', format: 'number' },
    { key: 'tipoCambio', label: 'T.C.', selected: false, align: 'right', format: 'number4' },
    { key: 'totalCambio', label: 'Total a Entregar', selected: false, align: 'right', format: 'number' },
    { key: 'comision', label: 'Comision', selected: false, align: 'right', format: 'number' },
    { key: 'comisionBob', label: 'Comision BOB', selected: true, align: 'right', format: 'number' },
    { key: 'itf', label: 'ITF', selected: false, align: 'right', format: 'number' },
    { key: 'total', label: 'Total Cobrado', selected: false, align: 'right', format: 'number' },
    { key: 'totalBob', label: 'Total BOB', selected: false, align: 'right', format: 'number' },
    { key: 'fechaPago', label: 'Fecha Pago', selected: false, format: 'date' },
    { key: 'estadoDesc', label: 'Estado', selected: true },
    { key: 'correlativoOrigen', label: 'Correlativo Origen', selected: false },
    { key: 'correlativoDestino', label: 'Correlativo Destino', selected: false },
  ];

  private readonly remesaColumns: ExportColumn[] = [
    { key: 'codigo', label: 'Codigo', selected: true, align: 'center' },
    { key: 'fecha', label: 'Fecha Registro', selected: true, format: 'date' },
    { key: 'subtipoDesc', label: 'Tipo', selected: true },
    { key: 'usuarioFinanciero', label: 'Remitente', selected: true },
    { key: 'documento', label: 'Documento', selected: false },
    { key: 'telefonoUf', label: 'Telefono Remitente', selected: false },
    { key: 'destinatario', label: 'Destinatario', selected: true },
    { key: 'telefonoDest', label: 'Telefono Destinatario', selected: false },
    { key: 'agencia', label: 'Agencia', selected: true },
    { key: 'destino', label: 'Destino', selected: true },
    { key: 'operador', label: 'Operador', selected: false },
    { key: 'moneda', label: 'Moneda', selected: true, align: 'center' },
    { key: 'monto', label: 'Monto Enviado', selected: true, align: 'right', format: 'number' },
    { key: 'tipoCambio', label: 'T.C.', selected: false, align: 'right', format: 'number4' },
    { key: 'totalCambio', label: 'Total a Entregar', selected: false, align: 'right', format: 'number' },
    { key: 'comision', label: 'Comision', selected: false, align: 'right', format: 'number' },
    { key: 'comisionBob', label: 'Comision BOB', selected: true, align: 'right', format: 'number' },
    { key: 'comisionGambarte', label: 'Com. Gambarte BOB', selected: false, align: 'right', format: 'number' },
    { key: 'gastosCorresponsal', label: 'Costos Corresp. BOB', selected: false, align: 'right', format: 'number' },
    { key: 'iva', label: 'IVA BOB', selected: false, align: 'right', format: 'number' },
    { key: 'itf', label: 'ITF BOB', selected: false, align: 'right', format: 'number' },
    { key: 'total', label: 'Total Cobrado', selected: false, align: 'right', format: 'number' },
    { key: 'totalBob', label: 'Total BOB', selected: false, align: 'right', format: 'number' },
    { key: 'fechaPago', label: 'Fecha Pago', selected: false, format: 'date' },
    { key: 'estadoDesc', label: 'Estado', selected: true },
    { key: 'correlativo', label: 'Correlativo', selected: false },
  ];

  ngOnInit(): void {
    this.svc.getAgencies().subscribe({
      next: (list) => (this.agencies = list),
    });
    this.load();
  }

  select(key: OpReportType): void {
    this.selected = key;
    this.searchQuery = '';
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.cambiosData = [];
    this.girosData = [];
    this.remesasData = [];
    this.totalRecords = 0;

    const hasta = this.hasta || undefined;
    const ag = this.agencia ?? undefined;

    switch (this.selected) {
      case 'cambios':
        this.svc.getCambios(this.desde, hasta, ag, this.tipoOperacion ?? undefined).subscribe({
          next: (d) => { this.cambiosData = d.records; this.totalRecords = d.total; this.loading = false; },
          error: (e: Error) => this.fail(e),
        });
        break;
      case 'giros':
        this.svc.getGiros(
          this.desde, hasta, ag,
          this.estadoFilter || undefined,
          this.codigoFilter ? parseInt(this.codigoFilter) : undefined
        ).subscribe({
          next: (d) => { this.girosData = d.records; this.totalRecords = d.total; this.loading = false; },
          error: (e: Error) => this.fail(e),
        });
        break;
      case 'remesas':
        this.svc.getRemesas(
          this.desde, hasta, ag,
          this.estadoFilter || undefined,
          this.subtipoFilter || undefined,
          this.codigoFilter ? parseInt(this.codigoFilter) : undefined
        ).subscribe({
          next: (d) => { this.remesasData = d.records; this.totalRecords = d.total; this.loading = false; },
          error: (e: Error) => this.fail(e),
        });
        break;
    }
  }

  private fail(e: Error): void {
    this.error = e?.message || 'Error al cargar el reporte';
    this.loading = false;
  }

  // ── Detail panel ──

  openCambioDetail(row: CambioRow): void {
    this.openPanel('cambios');
    this.svc.getCambioDetail(row.id).subscribe({
      next: (d) => { this.cambioDetail = d; this.detailLoading = false; },
      error: (e: Error) => this.detailFail(e),
    });
  }

  openGiroDetail(row: GiroRow): void {
    this.openPanel('giros');
    this.svc.getGiroDetail(row.id).subscribe({
      next: (d) => { this.giroDetail = d; this.detailLoading = false; },
      error: (e: Error) => this.detailFail(e),
    });
  }

  openRemesaDetail(row: RemesaRow): void {
    this.openPanel('remesas');
    this.svc.getRemesaDetail(row.id).subscribe({
      next: (d) => { this.remesaDetail = d; this.detailLoading = false; },
      error: (e: Error) => this.detailFail(e),
    });
  }

  private openPanel(type: OpReportType): void {
    this.detailOpen = true;
    this.detailLoading = true;
    this.detailError = '';
    this.detailType = type;
    this.cambioDetail = null;
    this.giroDetail = null;
    this.remesaDetail = null;
  }

  private detailFail(e: Error): void {
    this.detailError = e?.message || 'Error al cargar detalle';
    this.detailLoading = false;
  }

  closeDetail(): void {
    this.detailOpen = false;
    this.detailType = null;
    this.cambioDetail = null;
    this.giroDetail = null;
    this.remesaDetail = null;
    this.detailError = '';
  }

  // ── Search filter ──

  get filteredCambios(): CambioRow[] {
    return this.filterList(this.cambiosData, (m) =>
      (m.usuarioFinanciero || '') + (m.agencia || '') +
      (m.operador || '') + (m.moneda || '')
    );
  }

  get filteredGiros(): GiroRow[] {
    return this.filterList(this.girosData, (m) =>
      (m.usuarioFinanciero || '') + (m.destinatario || '') + (m.agenciaOrigen || '') +
      (m.agenciaDestino || '') + (m.operador || '') + String(m.codigo)
    );
  }

  get filteredRemesas(): RemesaRow[] {
    return this.filterList(this.remesasData, (m) =>
      (m.usuarioFinanciero || '') + (m.destinatario || '') + (m.agencia || '') +
      (m.destino || '') + (m.operador || '') + String(m.codigo)
    );
  }

  private filterList<T>(list: T[], toStr: (item: T) => string): T[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(item => toStr(item).toLowerCase().includes(q));
  }

  // ── Estado helpers ──

  estadoClass(estado: number): string {
    switch (estado) {
      case 0: return 'sem-warn';
      case 1: return 'sem-ok';
      case 2: return 'sem-bad';
      case 5: return 'sem-bad';
      default: return '';
    }
  }

  tipoClass(tipo: string): string {
    return tipo === 'COMPRA' ? 'sem-ok' : 'sem-warn';
  }

  // ═══════════════════════════════════════════════════════════
  // EXPORT DIALOG
  // ═══════════════════════════════════════════════════════════

  openExport(): void {
    const source = this.selected === 'cambios' ? this.cambioColumns
                 : this.selected === 'giros'   ? this.giroColumns
                 : this.remesaColumns;
    this.exportColumns = source.map(c => ({ ...c }));
    this.exportOpen = true;
  }

  closeExport(): void {
    this.exportOpen = false;
  }

  get selectedExportColumns(): ExportColumn[] {
    return this.exportColumns.filter(c => c.selected);
  }

  get exportData(): Record<string, unknown>[] {
    switch (this.selected) {
      case 'cambios': return this.filteredCambios as any[];
      case 'giros': return this.filteredGiros as any[];
      case 'remesas': return this.filteredRemesas as any[];
      default: return [];
    }
  }

  get exportPreviewRows(): Record<string, unknown>[] {
    return this.exportData.slice(0, 10);
  }

  get exportTitle(): string {
    const titles: Record<OpReportType, string> = {
      cambios: 'REPORTE DE CAMBIOS',
      giros: 'REPORTE DE GIROS NACIONALES',
      remesas: 'REPORTE DE REMESAS / GIROS INTERNACIONALES',
    };
    return titles[this.selected];
  }

  selectAllColumns(): void {
    this.exportColumns.forEach(c => c.selected = true);
  }

  deselectAllColumns(): void {
    this.exportColumns.forEach(c => c.selected = false);
  }

  formatCell(value: unknown, col: ExportColumn): string {
    if (value === null || value === undefined || value === '') return '-';
    if (col.format === 'number') return Number(value).toFixed(2);
    if (col.format === 'number4') return Number(value).toFixed(4);
    return String(value);
  }

  exportExcel(): void {
    const cols = this.selectedExportColumns;
    const rows = this.exportData;
    if (!cols.length || !rows.length) return;

    const periodo = this.hasta ? `${this.desde} al ${this.hasta}` : this.desde;

    const headerRow = `<Row ss:StyleID="hdr">${cols.map(c =>
      `<Cell><Data ss:Type="String">${this.esc(c.label)}</Data></Cell>`
    ).join('')}</Row>`;

    const dataRows = rows.map(row => {
      const cells = cols.map(col => {
        const v = (row as Record<string, unknown>)[col.key];
        const isNum = col.format === 'number' || col.format === 'number4';
        const type = isNum ? 'Number' : 'String';
        const val = this.formatCell(v, col);
        return `<Cell><Data ss:Type="${type}">${isNum ? val : this.esc(val)}</Data></Cell>`;
      }).join('');
      return `<Row>${cells}</Row>`;
    }).join('\n');

    const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
 <Style ss:ID="hdr"><Font ss:Bold="1" ss:Size="10"/><Interior ss:Color="#F3F4F6" ss:Pattern="Solid"/></Style>
 <Style ss:ID="title"><Font ss:Bold="1" ss:Size="12"/></Style>
</Styles>
<Worksheet ss:Name="${this.esc(this.exportTitle)}">
<Table>
 <Row ss:StyleID="title"><Cell ss:MergeAcross="${cols.length - 1}"><Data ss:Type="String">${this.esc(this.exportTitle)} - ${periodo}</Data></Cell></Row>
 <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
 ${headerRow}
 ${dataRows}
</Table>
</Worksheet>
</Workbook>`;

    const blob = new Blob([workbook], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = this.selected;
    a.download = `reporte_${slug}_${this.desde}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportPdf(): void {
    const cols = this.selectedExportColumns;
    const rows = this.exportData;
    if (!cols.length || !rows.length) return;

    const periodo = this.hasta ? `${this.desde} al ${this.hasta}` : this.desde;

    const ths = cols.map(c => {
      const align = c.align === 'right' ? 'text-align:right' : c.align === 'center' ? 'text-align:center' : 'text-align:left';
      return `<th style="${align}">${this.esc(c.label)}</th>`;
    }).join('');

    const trs = rows.map((row, i) => {
      const tds = cols.map(col => {
        const v = (row as Record<string, unknown>)[col.key];
        const val = this.formatCell(v, col);
        const align = col.align === 'right' ? 'text-align:right' : col.align === 'center' ? 'text-align:center' : '';
        return `<td style="${align}">${this.esc(val)}</td>`;
      }).join('');
      return `<tr>${tds}</tr>`;
    }).join('\n');

    const html = `<!DOCTYPE html><html><head><title>${this.esc(this.exportTitle)} ${periodo}</title>
<style>
  @page { size: landscape; margin: 12mm; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #1a1a1a; margin: 0; padding: 20px; }
  .header { text-align: center; margin-bottom: 16px; }
  .header h1 { font-size: 16px; margin: 0 0 4px; }
  .header p { font-size: 11px; color: #555; margin: 0; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f3f4f6; font-size: 9px; text-transform: uppercase; letter-spacing: .5px;
       padding: 6px 8px; border-bottom: 2px solid #d1d5db; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
  tr:nth-child(even) { background: #f9fafb; }
  .footer { margin-top: 20px; font-size: 9px; color: #888; display: flex; justify-content: space-between; }
</style></head><body>
<div class="header">
  <h1>${this.esc(this.exportTitle)}</h1>
  <p>Periodo: ${periodo} &nbsp;|&nbsp; ${rows.length} registro(s)</p>
</div>
<table>
  <thead><tr>${ths}</tr></thead>
  <tbody>${trs}</tbody>
</table>
<div class="footer">
  <span>Generado: ${new Date().toLocaleString()}</span>
  <span>CGR - Sistema de Gestion y Reportes</span>
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

  private num(v: number | null | undefined, decimals = 2): string {
    if (v === null || v === undefined) return '0.00';
    return v.toFixed(decimals);
  }

  private openPrint(title: string, html: string): void {
    const page = `<!DOCTYPE html><html><head><title>${title}</title>
<style>
  @page { size: portrait; margin: 10mm; }
  body { font-family: 'Courier New', monospace; font-size: 11px; color: #000; margin: 0; padding: 16px; max-width: 400px; margin: 0 auto; }
  h2 { text-align: center; font-size: 14px; margin: 8px 0; padding-bottom: 6px; border-bottom: 1px solid #000; }
  .logo { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 4px; }
  .sub { text-align: center; font-size: 10px; margin-bottom: 8px; }
  .sep { border-top: 1px solid #000; margin: 6px 0; }
  .section-title { font-weight: bold; text-align: center; margin: 4px 0; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; }
  td, th { padding: 2px 4px; font-size: 11px; vertical-align: top; }
  .r { text-align: right; }
  .b { font-weight: bold; }
  .c { text-align: center; }
  .big { font-size: 20px; font-weight: bold; }
  .code-box { text-align: center; margin: 8px 0; }
  .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 60px; }
  .sig { text-align: center; border-top: 1px solid #000; padding-top: 4px; width: 45%; font-weight: bold; font-size: 10px; }
  .note { font-size: 8px; margin-top: 12px; text-align: justify; }
  .footer-info { font-size: 9px; color: #555; margin-top: 8px; text-align: right; }
</style></head><body>
${html}
<script>window.onload=function(){window.print();}</script>
</body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(page); w.document.close(); }
  }

  // ═══════════════════════════════════════════════════════════
  // DOCUMENT PRINTING
  // ═══════════════════════════════════════════════════════════

  printCambioFactura(): void {
    const d = this.cambioDetail;
    if (!d?.factura) return;
    const f = d.factura;
    const html = `
      <div class="logo">GAMBARTE S.R.L.</div>
      <div class="sub">CASA DE CAMBIOS Y GIROS</div>
      <h2>FACTURA</h2>
      <table>
        <tr><td class="b">Numero</td><td class="r">${this.esc(f.numero)}</td></tr>
        <tr><td class="b">Autorizacion</td><td class="r" style="font-size:9px">${this.esc(f.autorizacion)}</td></tr>
        <tr><td class="b">Fecha</td><td class="r">${this.esc(f.fecha)} ${this.esc(f.hora)}</td></tr>
      </table>
      <div class="sep"></div>
      <table>
        <tr><td class="b">NIT/CI</td><td class="r">${this.esc(f.nit)}</td></tr>
        <tr><td class="b">Nombre</td><td class="r">${this.esc(f.nombre)}</td></tr>
      </table>
      <div class="sep"></div>
      <table>
        <tr><td class="b">Operacion</td><td class="r">${this.esc(d.tipoDesc)}</td></tr>
        <tr><td class="b">Moneda</td><td class="r">${this.esc(d.monedaRecibida)} / ${this.esc(d.monedaEntregada)}</td></tr>
        <tr><td class="b">Monto</td><td class="r">${this.num(d.monto)}</td></tr>
        <tr><td class="b">T.C.</td><td class="r">${this.num(d.tipoCambio, 4)}</td></tr>
      </table>
      <div class="sep"></div>
      <table>
        <tr><td class="b">Detalle</td><td class="r" style="font-size:10px">${this.esc(f.detalle)}</td></tr>
        <tr><td class="b">Importe</td><td class="r b">${this.num(f.importe)} BOB</td></tr>
      </table>
      <div class="sep"></div>
      <div class="footer-info">Transaccion: ${d.id} | Operador: ${this.esc(d.operador)}</div>
      <div class="footer-info">Agencia: ${this.esc(d.agencia)}</div>`;
    this.openPrint(`Factura Cambio #${d.id}`, html);
  }

  printGiroEnvio(): void {
    const d = this.giroDetail;
    if (!d) return;
    const html = `
      <div class="logo">GAMBARTE S.R.L.</div>
      <div class="sub">INFORMACION: 2200020 - 68355517</div>
      <h2>COMPROBANTE DE ENVIO</h2>
      <div class="code-box"><span class="big">CODIGO: ${d.codigo}</span></div>
      <div class="c b">GIRO NACIONAL DESDE ${this.esc(d.agenciaOrigen)}</div>
      <div class="sep"></div>
      <table>
        <tr><td class="b">Fecha</td><td>${this.esc(d.fecha)}</td></tr>
        <tr><td class="b">Correlativo</td><td>${this.esc(d.correlativoOrigen)}</td></tr>
        <tr><td class="b">Operador</td><td>${this.esc(d.operador)}</td></tr>
      </table>
      <div class="sep"></div>
      <div class="section-title">DATOS DEL REMITENTE</div>
      <div class="sep"></div>
      <table>
        <tr><td class="b">Nombre</td><td>${this.esc(d.remitente.nombre)}</td></tr>
        <tr><td class="b">Documento</td><td>${this.esc(d.remitente.documento || '')}</td></tr>
        <tr><td class="b">Telefono</td><td>${this.esc(d.remitente.telefono || '-')}</td></tr>
      </table>
      <div class="sep"></div>
      <div class="section-title">DATOS DEL DESTINATARIO</div>
      <div class="sep"></div>
      <table>
        <tr><td class="b">Nombre</td><td>${this.esc(d.destinatario.nombre)}</td></tr>
        <tr><td class="b">Telefono</td><td>${this.esc(d.destinatario.telefono || '-')}</td></tr>
        ${d.destinatario.domicilio ? `<tr><td class="b">Direccion</td><td>${this.esc(d.destinatario.domicilio)}</td></tr>` : ''}
      </table>
      <div class="sep"></div>
      <div class="section-title">DATOS DE LA OPERACION</div>
      <div class="sep"></div>
      <table>
        <tr><td class="b">Destino</td><td class="r">${this.esc(d.agenciaDestino)} ${this.esc(d.correlativoDestino || '')}</td></tr>
        <tr><td class="b">Por Entregar [${this.esc(d.monedaEntregada)}]</td><td class="r b">${this.num(d.totalCambio)}</td></tr>
        <tr><td class="b">Comision [${this.esc(d.monedaEntregada)}]</td><td class="r">${this.num(d.comision)}</td></tr>
        ${d.itf > 0 ? `<tr><td class="b">ITF [${this.esc(d.monedaEntregada)}]</td><td class="r">${this.num(d.itf)}</td></tr>` : ''}
      </table>
      <div class="sep"></div>
      <table>
        <tr><td class="b">Total [${this.esc(d.monedaEntregada)}]</td><td class="r b">${this.num(d.total)}</td></tr>
        <tr><td class="b">Total [BOB]</td><td class="r b">${this.num(d.totalBob)}</td></tr>
      </table>
      <div class="signatures">
        <div class="sig">FIRMA CAJERO</div>
        <div class="sig">FIRMA CLIENTE</div>
      </div>
      <div class="note"><b><u>NOTA</u>.-</b> AL FIRMAR ESTE DOCUMENTO SE ACEPTAN LOS TERMINOS Y CONDICIONES DE GAMBARTE S.R.L.</div>`;
    this.openPrint(`Envio Giro ${d.codigo}`, html);
  }

  printGiroPago(): void {
    const d = this.giroDetail;
    if (!d?.pago) return;
    const p = d.pago;
    const html = `
      <div class="logo">GAMBARTE S.R.L.</div>
      <div class="sub">INFORMACION: 2200020 - 68355517</div>
      <h2>COMPROBANTE DE PAGO</h2>
      <div class="c b">GIRO NACIONAL DESDE ${this.esc(d.agenciaOrigen)}</div>
      <div class="c">FECHA: ${this.esc(d.fecha)}</div>
      <div class="sep"></div>
      <div class="section-title">DATOS DEL REMITENTE</div>
      <table>
        <tr><td colspan="2">${this.esc(d.remitente.nombre)}</td></tr>
        ${d.remitente.telefono ? `<tr><td class="b">Telefono</td><td>${this.esc(d.remitente.telefono)}</td></tr>` : ''}
      </table>
      <div class="sep"></div>
      <div class="section-title">DATOS DEL DESTINATARIO</div>
      <table>
        <tr><td colspan="2">${this.esc(d.destinatario.nombre)}</td></tr>
        ${d.destinatario.telefono ? `<tr><td class="b">Telefono</td><td>${this.esc(d.destinatario.telefono)}</td></tr>` : ''}
        ${d.destinatario.domicilio ? `<tr><td class="b">Direccion</td><td>${this.esc(d.destinatario.domicilio)}</td></tr>` : ''}
        ${p.documento ? `<tr><td class="b">Documento</td><td>${this.esc(p.documento)}</td></tr>` : ''}
      </table>
      <div class="sep"></div>
      <div class="section-title">DATOS DEL PAGO</div>
      <table>
        <tr><td class="b">Tipo</td><td class="r">${this.esc(p.tipoPago)}</td></tr>
        <tr><td class="b">Agencia</td><td class="r">${this.esc(p.agencia)}</td></tr>
        <tr><td class="b">Operador</td><td class="r">${this.esc(p.operador)}</td></tr>
        <tr><td class="b">Fecha</td><td class="r">${this.esc(p.fecha)}</td></tr>
        <tr><td class="b">Codigo</td><td class="r b">${d.codigo}</td></tr>
        <tr><td class="b">Monto [${this.esc(p.moneda)}]</td><td class="r b">${this.num(p.monto)}</td></tr>
        ${p.comprobante ? `<tr><td class="b">Comprobante</td><td class="r">${this.esc(p.comprobante)}</td></tr>` : ''}
        ${p.motivo ? `<tr><td class="b">Motivo</td><td class="r">${this.esc(p.motivo)}</td></tr>` : ''}
      </table>
      <div class="signatures">
        <div class="sig">FIRMA CAJERO</div>
        <div class="sig">FIRMA CLIENTE</div>
      </div>
      <div class="note"><b><u>NOTA</u>.-</b> AL FIRMAR ESTE DOCUMENTO SE ACEPTAN LOS TERMINOS Y CONDICIONES DE GAMBARTE S.R.L.</div>`;
    this.openPrint(`Pago Giro ${d.codigo}`, html);
  }

  printGiroFactura(): void {
    const d = this.giroDetail;
    if (!d?.factura) return;
    const f = d.factura;
    const html = `
      <div class="logo">GAMBARTE S.R.L.</div>
      <div class="sub">CASA DE CAMBIOS Y GIROS</div>
      <h2>FACTURA</h2>
      <table>
        <tr><td class="b">Numero</td><td class="r">${this.esc(f.numero)}</td></tr>
        <tr><td class="b">Autorizacion</td><td class="r" style="font-size:9px">${this.esc(f.autorizacion)}</td></tr>
        <tr><td class="b">Fecha</td><td class="r">${this.esc(f.fecha)} ${this.esc(f.hora)}</td></tr>
      </table>
      <div class="sep"></div>
      <table>
        <tr><td class="b">NIT/CI</td><td class="r">${this.esc(f.nit)}</td></tr>
        <tr><td class="b">Nombre</td><td class="r">${this.esc(f.nombre)}</td></tr>
      </table>
      <div class="sep"></div>
      <table>
        <tr><td class="b">Detalle</td><td class="r" style="font-size:10px">${this.esc(f.detalle)}</td></tr>
        <tr><td class="b">Importe</td><td class="r b">${this.num(f.importe)} BOB</td></tr>
      </table>
      <div class="sep"></div>
      <div class="footer-info">Giro Codigo: ${d.codigo} | Operador: ${this.esc(d.operador)}</div>`;
    this.openPrint(`Factura Giro ${d.codigo}`, html);
  }

  printRemesaEnvio(): void {
    const d = this.remesaDetail;
    if (!d) return;
    const html = `
      <div class="logo">GAMBARTE S.R.L.</div>
      <div class="sub">www.gambarte.com.bo | INFORMES: 68355517</div>
      <h2>COMPROBANTE DE ENVIO</h2>
      <div class="code-box"><span class="big">CODIGO: ${d.codigo}</span></div>
      <div class="c b">${this.esc(d.tipo)} - ${this.esc(d.agencia)}</div>
      <div class="sep"></div>
      <table>
        <tr><td class="b">Fecha</td><td>${this.esc(d.fecha)}</td></tr>
        <tr><td class="b">Correlativo</td><td>${this.esc(d.correlativo)}</td></tr>
        <tr><td class="b">Operador</td><td>${this.esc(d.operador)}</td></tr>
      </table>
      <div class="sep"></div>
      <div class="section-title">DATOS DEL REMITENTE</div>
      <div class="sep"></div>
      <table>
        <tr><td class="b">Nombre</td><td>${this.esc(d.remitente.nombre)}</td></tr>
        <tr><td class="b">Documento</td><td>${this.esc(d.remitente.documento || '')}</td></tr>
        <tr><td class="b">Telefono</td><td>${this.esc(d.remitente.telefono || '-')}</td></tr>
        ${d.remitente.domicilio ? `<tr><td class="b">Direccion</td><td>${this.esc(d.remitente.domicilio)}</td></tr>` : ''}
      </table>
      <div class="sep"></div>
      <div class="section-title">DATOS DEL DESTINATARIO</div>
      <div class="sep"></div>
      <table>
        <tr><td class="b">Nombre</td><td>${this.esc(d.destinatario.nombre)}</td></tr>
        <tr><td class="b">Telefono</td><td>${this.esc(d.destinatario.telefono || '-')}</td></tr>
        ${d.destinatario.domicilio ? `<tr><td class="b">Direccion</td><td>${this.esc(d.destinatario.domicilio)}</td></tr>` : ''}
      </table>
      <div class="sep"></div>
      <div class="section-title">DATOS DE LA OPERACION</div>
      <div class="sep"></div>
      <table>
        <tr><td class="b">Destino</td><td class="r">${this.esc(d.destino)}</td></tr>
        <tr><td class="b">Por Entregar [${this.esc(d.monedaEntregada)}]</td><td class="r b">${this.num(d.monto)}</td></tr>
      </table>
      <div class="sep"></div>
      <table>
        <tr><td class="b">Recibido [${this.esc(d.monedaRecibida)}]</td><td class="r">${this.num(d.monto)}</td></tr>
        <tr><td class="b">Comision [BOB]</td><td class="r">${this.num(d.comisionGambarte)}</td></tr>
        ${d.gastosCorresponsal > 0 ? `<tr><td class="b">Corresponsal [BOB]</td><td class="r">${this.num(d.gastosCorresponsal)}</td></tr>` : ''}
        <tr><td class="b">IVA [BOB]</td><td class="r">${this.num(d.iva)}</td></tr>
        ${d.itf > 0 ? `<tr><td class="b">ITF [BOB]</td><td class="r">${this.num(d.itf)}</td></tr>` : ''}
      </table>
      <div class="sep"></div>
      <table>
        <tr><td class="b">Total Comision [BOB]</td><td class="r b">${this.num(d.comisionBob)}</td></tr>
        <tr><td class="b">Total [BOB]</td><td class="r b">${this.num(d.totalBob)}</td></tr>
      </table>
      <div class="signatures">
        <div class="sig">FIRMA CAJERO</div>
        <div class="sig">FIRMA CLIENTE</div>
      </div>
      <div class="note"><b><u>NOTA</u>.-</b> AL FIRMAR ESTE DOCUMENTO SE ACEPTAN LOS TERMINOS Y CONDICIONES DE GAMBARTE S.R.L.</div>`;
    this.openPrint(`Envio Remesa ${d.codigo}`, html);
  }

  printRemesaPago(): void {
    const d = this.remesaDetail;
    if (!d?.pago) return;
    const p = d.pago;
    const html = `
      <div class="logo">GAMBARTE S.R.L.</div>
      <div class="sub">INFORMACION: 2200020 - 68355517</div>
      <h2>COMPROBANTE DE PAGO</h2>
      <div class="c b">${this.esc(d.tipo)} - ${this.esc(d.agencia)}</div>
      <div class="c">FECHA: ${this.esc(d.fecha)}</div>
      <div class="sep"></div>
      <div class="section-title">DATOS DEL REMITENTE</div>
      <table>
        <tr><td colspan="2">${this.esc(d.remitente.nombre)}</td></tr>
        ${d.remitente.telefono ? `<tr><td class="b">Telefono</td><td>${this.esc(d.remitente.telefono)}</td></tr>` : ''}
      </table>
      <div class="sep"></div>
      <div class="section-title">DATOS DEL DESTINATARIO</div>
      <table>
        <tr><td colspan="2">${this.esc(d.destinatario.nombre)}</td></tr>
        ${d.destinatario.telefono ? `<tr><td class="b">Telefono</td><td>${this.esc(d.destinatario.telefono)}</td></tr>` : ''}
        ${d.destinatario.domicilio ? `<tr><td class="b">Direccion</td><td>${this.esc(d.destinatario.domicilio)}</td></tr>` : ''}
        ${p.documento ? `<tr><td class="b">Documento</td><td>${this.esc(p.documento)}</td></tr>` : ''}
      </table>
      <div class="sep"></div>
      <div class="section-title">DATOS DEL PAGO</div>
      <table>
        <tr><td class="b">Tipo</td><td class="r">${this.esc(p.tipoPago)}</td></tr>
        <tr><td class="b">Agencia</td><td class="r">${this.esc(p.agencia)}</td></tr>
        <tr><td class="b">Operador</td><td class="r">${this.esc(p.operador)}</td></tr>
        <tr><td class="b">Fecha</td><td class="r">${this.esc(p.fecha)}</td></tr>
        <tr><td class="b">Codigo</td><td class="r b">${d.codigo}</td></tr>
        <tr><td class="b">Monto [${this.esc(p.moneda)}]</td><td class="r b">${this.num(p.monto)}</td></tr>
        ${p.comprobante ? `<tr><td class="b">Comprobante</td><td class="r">${this.esc(p.comprobante)}</td></tr>` : ''}
        ${p.motivo ? `<tr><td class="b">Motivo</td><td class="r">${this.esc(p.motivo)}</td></tr>` : ''}
      </table>
      <div class="signatures">
        <div class="sig">FIRMA CAJERO</div>
        <div class="sig">FIRMA CLIENTE</div>
      </div>
      <div class="note"><b><u>NOTA</u>.-</b> AL FIRMAR ESTE DOCUMENTO SE ACEPTAN LOS TERMINOS Y CONDICIONES DE GAMBARTE S.R.L.</div>`;
    this.openPrint(`Pago Remesa ${d.codigo}`, html);
  }

  printRemesaFactura(): void {
    const d = this.remesaDetail;
    if (!d?.factura) return;
    const f = d.factura;
    const html = `
      <div class="logo">GAMBARTE S.R.L.</div>
      <div class="sub">CASA DE CAMBIOS Y GIROS</div>
      <h2>FACTURA</h2>
      <table>
        <tr><td class="b">Numero</td><td class="r">${this.esc(f.numero)}</td></tr>
        <tr><td class="b">Autorizacion</td><td class="r" style="font-size:9px">${this.esc(f.autorizacion)}</td></tr>
        <tr><td class="b">Fecha</td><td class="r">${this.esc(f.fecha)} ${this.esc(f.hora)}</td></tr>
      </table>
      <div class="sep"></div>
      <table>
        <tr><td class="b">NIT/CI</td><td class="r">${this.esc(f.nit)}</td></tr>
        <tr><td class="b">Nombre</td><td class="r">${this.esc(f.nombre)}</td></tr>
      </table>
      <div class="sep"></div>
      <table>
        <tr><td class="b">Detalle</td><td class="r" style="font-size:10px">${this.esc(f.detalle)}</td></tr>
        <tr><td class="b">Importe</td><td class="r b">${this.num(f.importe)} BOB</td></tr>
      </table>
      <div class="sep"></div>
      <div class="footer-info">${this.esc(d.tipo)} Codigo: ${d.codigo} | Operador: ${this.esc(d.operador)}</div>`;
    this.openPrint(`Factura Remesa ${d.codigo}`, html);
  }
}
