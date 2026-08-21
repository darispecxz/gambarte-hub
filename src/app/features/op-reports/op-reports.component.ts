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

  private esc(s: any): string {
    if (s == null) return '';
    const str = String(s);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private num(v: number | null | undefined, decimals = 2): string {
    if (v === null || v === undefined) return '0.00';
    return v.toFixed(decimals);
  }

  private openPrint(title: string, html: string): void {
    const page = `<!DOCTYPE html><html><head><title>${title}</title>
<style>
  @page { size: 80mm 300mm; margin: 5mm; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #000; margin: 0; padding: 0; }
  h2 { text-align: center; font-size: 16px; margin: 4px 0; padding-bottom: 4px; border-bottom: 0.25pt solid #000; }
  img.logo { display: block; margin: 0 auto; width: 100%; max-width: 400px; }
  table { width: 100%; border-collapse: collapse; }
  td, th { padding: 1px 2px; font-size: 13px; vertical-align: top; }
  th { font-weight: bold; }
  .sep { border-top: 0.25pt solid #000; margin: 0; padding: 0; height: 1px; }
  .sep-td { border-top: 0.25pt solid #000; margin: 0; padding: 0; }
  .r { text-align: right; }
  .b { font-weight: bold; }
  .c { text-align: center; }
  .xxs { font-size: 8px; }
  .xs { font-size: 10px; }
  .big { font-size: 20px; font-weight: bold; }
  .sig-table { width: 100%; }
  .sig-table td.sig-space { border-bottom: 0.25pt solid #000; height: 100px; }
  .sig-table td.sig-label { text-align: center; font-weight: bold; padding-top: 4px; }
  .note { font-size: 8px; text-align: justify; margin-top: 4px; }
  .footer-info { font-size: 9px; margin-top: 4px; }
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
<table width="100%">
  <tr><td align="center"><img class="logo" src="/assets/logo_texto.png" /></td></tr>
</table><br />
<table cellpadding="0" cellspacing="0" width="100%">
  <tr><td align="center"><h2 align="center" style="margin:0;padding:0;">FACTURA</h2></td></tr>
  <tr><td align="center" style="border-bottom:0.25pt solid #000;"><b>(Sin derecho a cr&eacute;dito fiscal)</b></td></tr>
</table><br />
<table width="100%">
  <tr><td align="center">
    NIT 335846029<br />
    FACTURA N&deg; ${this.esc(f.numero)}<br />
    AUTORIZACION N&deg; ${this.esc(f.autorizacion)}
  </td></tr>
</table>
<table width="100%">
  <tr><td align="center">ACTIVIDADES AUXILIARES DE LA INTERMEDIACION FINANCIERA, INCLUYE EMPRESAS DE GIRO Y REMESAS DE DINERO</td></tr>
</table>
<div style="border-top:0.25pt solid #000;"></div>
<table width="100%">
  <tr><td align="left">FECHA: ${this.esc(f.fecha)}</td></tr>
  <tr><td align="left">HORA: ${this.esc(f.hora)}</td></tr>
  <tr><td align="left">NIT/CI: ${this.esc(f.nit)}</td></tr>
  <tr><td align="left">SE&Ntilde;OR(ES): ${this.esc(f.nombre)}</td></tr>
</table>
<div style="border-top:0.25pt solid #000;"></div>
<table width="100%">
  <tr>
    <th valign="bottom">CONCEPTO</th>
    <th valign="bottom">CANTIDAD</th>
    <th valign="bottom">T.C.</th>
    <th valign="bottom">IMPORTE</th>
  </tr>
  <tr>
    <td align="center">${this.esc(d.tipoDesc)}</td>
    <td align="right" nowrap>${this.num(d.monto)}</td>
    <td align="right">${this.num(d.tipoCambio, 4)}</td>
    <td align="right" nowrap>${this.num(f.importe)}</td>
  </tr>
  <tr><td colspan="4" class="sep-td"> </td></tr>
  <tr>
    <td align="right" colspan="2"><b>TOTAL [BOB]</b></td>
    <td align="right" colspan="2" nowrap>${this.num(f.importe)}</td>
  </tr>
  <tr><td colspan="4" class="sep-td"> </td></tr>
  <tr><td colspan="4">${this.esc(f.detalle)}</td></tr>
</table>
<div style="border-top:0.25pt solid #000;"></div>
<table width="100%">
  <tr>
    <td align="left" class="xxs" nowrap>Transacci&oacute;n: ${this.esc(d.id)}</td>
    <td align="right" class="xxs" nowrap>OPERADOR: ${this.esc(d.operador)}</td>
  </tr>
</table>`;
    this.openPrint(`F-${f.numero}`, html);
  }

  printGiroEnvio(): void {
    const d = this.giroDetail;
    if (!d) return;
    const html = `
<table align="center" cellpadding="0" cellspacing="0" width="100%">
  <tr><td align="center"><img class="logo" src="/assets/logo_texto.png" /></td></tr>
</table>
<h2 align="center" style="border-bottom:0.25pt solid #000;margin:0;padding:0;">COMPROBANTE DE ENV&Iacute;O</h2>
<table align="center">
  <tr><td align="center"><h3><u>CODIGO</u></h3><h1>${this.esc(d.codigo)}</h1></td></tr>
</table>
<table align="center" cellpadding="0" cellspacing="0" width="100%">
  <tr><td align="center"><b>${this.esc(d.tipo)} DESDE ${this.esc(d.agenciaOrigen)}</b></td></tr>
  <tr><td class="sep-td"> </td></tr>
  <tr><td align="center">
    <table align="center" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="left"><b>FECHA</b></td><td align="left">${this.esc(d.fecha)}</td>
        <td align="left"><b>HORA</b></td><td align="left"> </td>
      </tr>
      <tr>
        <td align="left" style="padding-right:20px;"><b>CAGG</b></td><td align="left">${this.esc(d.correlativoOrigen)}</td>
        <td align="left"><b>OPE</b></td><td align="left">${this.esc(d.operador)}</td>
      </tr>
    </table>
  </td></tr>
</table>
<div style="border-top:0.25pt solid #000;"></div>
<table align="center" cellpadding="0" cellspacing="0" width="100%">
  <tr><th colspan="3">DATOS DEL REMITENTE</th></tr>
  <tr><td colspan="3" class="sep-td"> </td></tr>
  <tr><td align="center" colspan="3">${this.esc(d.remitente.nombre)}</td></tr>
  <tr><td><b>DOCUMENTO</b></td><td colspan="2">${this.esc(d.remitente.documento || '')}</td></tr>
  <tr><td><b>TELEFONO</b></td><td colspan="2">${this.esc(d.remitente.telefono || '')}</td></tr>
  <tr><td colspan="3" class="sep-td"> </td></tr>
  <tr><th colspan="3">DATOS DEL DESTINATARIO</th></tr>
  <tr><td colspan="3" class="sep-td"> </td></tr>
  <tr><td><b>NOMBRE</b></td><td colspan="2">${this.esc(d.destinatario.nombre)}</td></tr>
  <tr><td><b>TELEFONO</b></td><td colspan="2">${this.esc(d.destinatario.telefono || '')}</td></tr>
  ${d.destinatario.domicilio ? `<tr><td><b>DIRECCION</b></td><td colspan="2">${this.esc(d.destinatario.domicilio)}</td></tr>` : ''}
  <tr><td colspan="3" class="sep-td"> </td></tr>
  <tr><th colspan="3">DATOS DE LA OPERACION</th></tr>
  <tr><td colspan="3" class="sep-td"> </td></tr>
  <tr>
    <td><b>DESTINO</b></td>
    <td align="right" colspan="2" nowrap>${this.esc(d.agenciaDestino)} ${this.esc(d.correlativoDestino || '')}</td>
  </tr>
  <tr>
    <td nowrap colspan="2"><b>POR ENTREGAR [${this.esc(d.monedaEntregada)}]</b></td>
    <td align="right"><b>${this.num(d.totalCambio)}</b></td>
  </tr>
  <tr>
    <td nowrap colspan="2"><b>COMISION [${this.esc(d.monedaEntregada)}]</b></td>
    <td align="right">${this.num(d.comision)}</td>
  </tr>
  ${d.itf > 0 ? `<tr><td nowrap colspan="2"><b>ITF [${this.esc(d.monedaEntregada)}]</b></td><td align="right">${this.num(d.itf)}</td></tr>` : ''}
  <tr><td colspan="3" class="sep-td"> </td></tr>
  <tr>
    <td nowrap colspan="2"><b>TOTAL [${this.esc(d.monedaEntregada)}]</b></td>
    <td align="right">${this.num(d.total)}</td>
  </tr>
  ${d.totalBob !== d.total ? `<tr><td nowrap colspan="2"><b>TOTAL [BOB]</b></td><td align="right">${this.num(d.totalBob)}</td></tr>` : ''}
  <tr><td colspan="3" class="sep-td"> </td></tr>
  <tr><td colspan="3">
    <table class="sig-table" cellpadding="5" cellspacing="5" width="100%">
      <tr><td class="sig-space"> </td><td class="sig-space"> </td></tr>
      <tr><td class="sig-label">FIRMA CAJERO</td><td class="sig-label">FIRMA CLIENTE</td></tr>
    </table>
  </td></tr>
  <tr><td colspan="3" align="justify" class="xxs"><b><u>NOTA</u>.-</b> AL FIRMAR ESTE DOCUMENTO SE ACEPTAN LOS TERMINOS Y CONDICIONES DE GAMBARTE S.R.L.</td></tr>
</table>`;
    this.openPrint(`EG-${d.codigo}`, html);
  }

  printGiroPago(): void {
    const d = this.giroDetail;
    if (!d?.pago) return;
    const p = d.pago;
    const html = `
<table cellpadding="0" cellspacing="0" width="100%" style="border-bottom:0.25pt solid #000;">
  <tr><td align="center">
    <img class="logo" src="/assets/logo_texto.png" style="max-width:300px;" /><br />
    <span class="xs">INFORMACION: 2200020 - 68355517</span>
  </td></tr>
</table>
<table cellpadding="1" cellspacing="0" width="100%" style="border-bottom:0.25pt solid #000;">
  <tr><th style="font-size:16px;">COMPROBANTE DE PAGO</th></tr>
  <tr><th>GIRO NACIONAL DESDE<br />${this.esc(d.agenciaOrigen)}</th></tr>
  <tr><td align="center">FECHA: ${this.esc(d.fecha)}</td></tr>
</table>
<table align="center" cellpadding="0" cellspacing="0" width="100%">
  <tr><td colspan="2"><b>DATOS DEL REMITENTE</b></td></tr>
  <tr><td colspan="2">${this.esc(d.remitente.nombre)}</td></tr>
  ${d.remitente.telefono ? `<tr><td colspan="2">TELEFONO ${this.esc(d.remitente.telefono)}</td></tr>` : ''}
  <tr><td colspan="2" class="sep-td"> </td></tr>
  <tr><td colspan="2"><b>DATOS DEL DESTINATARIO</b></td></tr>
  <tr><td colspan="2">${this.esc(d.destinatario.nombre)}</td></tr>
  ${d.destinatario.telefono ? `<tr><td colspan="2">TELEFONO ${this.esc(d.destinatario.telefono)}</td></tr>` : ''}
  ${d.destinatario.domicilio ? `<tr><td><b>DIRECCION</b></td><td>${this.esc(d.destinatario.domicilio)}</td></tr>` : ''}
  ${p.documento ? `<tr><td colspan="2" nowrap>${this.esc(p.documento)}</td></tr>` : ''}
  <tr><td colspan="2" class="sep-td"> </td></tr>
  <tr>
    <td><b>DATOS DEL PAGO</b></td>
    <td align="right">${this.esc(p.agencia)}</td>
  </tr>
  <tr>
    <td>OPE: ${this.esc(p.operador)}</td>
    <td align="right"><b>CODIGO: ${this.esc(d.codigo)}</b></td>
  </tr>
  <tr>
    <td>FECHA: ${this.esc(p.fecha)}</td>
    <td align="right"> </td>
  </tr>
  <tr>
    <td style="font-size:16px;"><b>MONTO EN ${this.esc(p.moneda)}</b></td>
    <td align="right" style="font-size:16px;"><b>${this.num(p.monto)}</b></td>
  </tr>
  ${p.comprobante ? `<tr><td><b>COMPROBANTE</b></td><td align="right">${this.esc(p.comprobante)}</td></tr>` : ''}
  ${p.motivo ? `<tr><td><b>MOTIVO</b></td><td align="right">${this.esc(p.motivo)}</td></tr>` : ''}
  <tr><td colspan="2" class="sep-td"> </td></tr>
  <tr><td colspan="2">
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="sig-space"> </td>
        <td style="width:20px;"> </td>
        <td class="sig-space"> </td>
      </tr>
      <tr>
        <td class="sig-label">FIRMA CAJERO</td>
        <td> </td>
        <td class="sig-label">FIRMA CLIENTE</td>
      </tr>
    </table>
  </td></tr>
  <tr><td colspan="2" align="justify" class="xxs"><b><u>NOTA</u>.-</b> AL FIRMAR ESTE DOCUMENTO SE ACEPTAN LOS TERMINOS Y CONDICIONES DE GAMBARTE S.R.L.</td></tr>
</table>`;
    this.openPrint(`PG-${d.codigo}`, html);
  }

  printGiroFactura(): void {
    const d = this.giroDetail;
    if (!d?.factura) return;
    const f = d.factura;
    const html = `
<table width="100%">
  <tr><td align="center"><img class="logo" src="/assets/logo_texto.png" /></td></tr>
</table><br />
<table cellpadding="0" cellspacing="0" width="100%">
  <tr><td align="center"><h2 align="center" style="margin:0;padding:0;">FACTURA</h2></td></tr>
  <tr><td align="center" style="border-bottom:0.25pt solid #000;"><b>(Con derecho a cr&eacute;dito fiscal)</b></td></tr>
</table><br />
<table width="100%">
  <tr><td align="center">
    NIT 335846029<br />
    FACTURA N&deg; ${this.esc(f.numero)}<br />
    AUTORIZACION N&deg; ${this.esc(f.autorizacion)}
  </td></tr>
</table>
<div style="border-top:0.25pt solid #000;"></div>
<table width="100%">
  <tr><td align="left">FECHA: ${this.esc(f.fecha)}</td></tr>
  <tr><td align="left">HORA: ${this.esc(f.hora)}</td></tr>
  <tr><td align="left">NIT/CI: ${this.esc(f.nit)}</td></tr>
  <tr><td align="left">SE&Ntilde;OR(ES): ${this.esc(f.nombre)}</td></tr>
</table>
<div style="border-top:0.25pt solid #000;"></div>
<table width="100%">
  <tr><th>CONCEPTO</th><th>IMPORTE</th></tr>
  <tr>
    <td>COMISION POR GIRO #${this.esc(d.codigo)}</td>
    <td align="right" nowrap>BOB ${this.num(f.importe)}</td>
  </tr>
  <tr><td colspan="2" class="sep-td"> </td></tr>
  <tr>
    <td align="right"><b>TOTAL [BOB]</b></td>
    <td align="right" nowrap>${this.num(f.importe)}</td>
  </tr>
  <tr><td colspan="2" class="sep-td"> </td></tr>
  <tr><td colspan="2">${this.esc(f.detalle)}</td></tr>
</table>
<div style="border-top:0.25pt solid #000;"></div>
<table width="100%">
  <tr>
    <td align="left" class="xxs" nowrap>Transacci&oacute;n: ${this.esc(d.id)}</td>
    <td align="right" class="xxs" nowrap>OPERADOR: ${this.esc(d.operador)}</td>
  </tr>
</table>`;
    this.openPrint(`FC-${f.numero}`, html);
  }

  printRemesaEnvio(): void {
    const d = this.remesaDetail;
    if (!d) return;
    const html = `
<table align="center" cellpadding="0" cellspacing="0" width="100%">
  <tr><td align="center"><img class="logo" src="/assets/logo_texto.png" /><br /><b>www.gambarte.com.bo</b></td></tr>
  <tr><td align="center">INFORMES: 68355517</td></tr>
</table>
<h2 align="center" style="border-bottom:0.25pt solid #000;margin:0;padding:0;">COMPROBANTE DE ENV&Iacute;O</h2>
<table align="center">
  <tr><td align="center"><h3><u>CODIGO</u></h3><h1>${this.esc(d.codigo)}</h1></td></tr>
</table>
<table align="center" cellpadding="0" cellspacing="0" width="100%">
  <tr><td align="center"><b>${this.esc(d.tipo)} BOLIVIA - ${this.esc(d.agencia)}</b></td></tr>
  <tr><td class="sep-td"> </td></tr>
  <tr><td align="center">
    <table align="center" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="left"><b>FECHA</b></td><td align="left">${this.esc(d.fecha)}</td>
        <td align="left"><b>HORA</b></td><td align="left"> </td>
      </tr>
      <tr>
        <td align="left" style="padding-right:20px;"><b>CAGR</b></td><td align="left">${this.esc(d.correlativo)}</td>
        <td align="left"><b>OPE</b></td><td align="left">${this.esc(d.operador)}</td>
      </tr>
    </table>
  </td></tr>
</table>
<div style="border-top:0.25pt solid #000;"></div>
<table align="center" cellpadding="0" cellspacing="0" width="100%">
  <tr><th colspan="3">DATOS DEL REMITENTE</th></tr>
  <tr><td colspan="3" class="sep-td"> </td></tr>
  <tr><td align="center" colspan="3">${this.esc(d.remitente.nombre)}</td></tr>
  <tr><td><b>DOCUMENTO</b></td><td colspan="2">${this.esc(d.remitente.documento || '')}</td></tr>
  <tr><td><b>TELEFONO</b></td><td colspan="2">${this.esc(d.remitente.telefono || '')}</td></tr>
  ${d.remitente.domicilio ? `<tr><td><b>DIRECCION</b></td><td colspan="2">${this.esc(d.remitente.domicilio)}</td></tr>` : ''}
  <tr><td colspan="3" class="sep-td"> </td></tr>
  <tr><th colspan="3">DATOS DEL DESTINATARIO</th></tr>
  <tr><td colspan="3" class="sep-td"> </td></tr>
  <tr><td><b>NOMBRE</b></td><td colspan="2">${this.esc(d.destinatario.nombre)}</td></tr>
  <tr><td><b>TELEFONO</b></td><td colspan="2">${this.esc(d.destinatario.telefono || '')}</td></tr>
  ${d.destinatario.domicilio ? `<tr><td><b>DIRECCION</b></td><td colspan="2">${this.esc(d.destinatario.domicilio)}</td></tr>` : ''}
  <tr><td colspan="3" class="sep-td"> </td></tr>
  <tr><th colspan="3">DATOS DE LA OPERACION</th></tr>
  <tr><td colspan="3" class="sep-td"> </td></tr>
  <tr>
    <td colspan="2"><b>DESTINO</b></td>
    <td align="right">${this.esc(d.destino)}</td>
  </tr>
  <tr>
    <td nowrap colspan="2"><b>POR ENTREGAR [${this.esc(d.monedaEntregada)}]</b></td>
    <td align="right"><b>${this.num(d.monto)}</b></td>
  </tr>
  <tr><td colspan="3" class="sep-td"> </td></tr>
  <tr>
    <td nowrap colspan="2"><b>RECIBIDO [${this.esc(d.monedaRecibida)}]</b></td>
    <td align="right">${this.num(d.monto)}</td>
  </tr>
  <tr>
    <td nowrap colspan="2"><b>COMISION [BOB]</b></td>
    <td align="right">${this.num(d.comisionGambarte)}</td>
  </tr>
  ${d.gastosCorresponsal > 0 ? `<tr><td nowrap colspan="2"><b>CORRESPONSAL [BOB]</b></td><td align="right">${this.num(d.gastosCorresponsal)}</td></tr>` : ''}
  <tr>
    <td nowrap colspan="2"><b>IVA [BOB]</b></td>
    <td align="right">${this.num(d.iva)}</td>
  </tr>
  ${d.itf > 0 ? `<tr><td nowrap colspan="2"><b>ITF [BOB]</b></td><td align="right">${this.num(d.itf)}</td></tr>` : ''}
  <tr><td colspan="3" class="sep-td"> </td></tr>
  <tr><th colspan="3">CONCEPTO</th></tr>
  <tr><td colspan="3">${this.esc(d.destino)}</td></tr>
  <tr><td colspan="3" class="sep-td"> </td></tr>
  <tr><td colspan="3">
    <table class="sig-table" cellpadding="5" cellspacing="5" width="100%">
      <tr><td class="sig-space"> </td><td class="sig-space"> </td></tr>
      <tr><td class="sig-label">FIRMA CAJERO</td><td class="sig-label">FIRMA CLIENTE</td></tr>
    </table>
  </td></tr>
  <tr><td colspan="3" align="justify" class="xxs"><b><u>NOTA</u>.-</b> AL FIRMAR ESTE DOCUMENTO SE ACEPTAN LOS TERMINOS Y CONDICIONES DE GAMBARTE S.R.L. <br />(*) Montos Referenciales</td></tr>
</table>`;
    this.openPrint(`ER-${d.codigo}`, html);
  }

  printRemesaPago(): void {
    const d = this.remesaDetail;
    if (!d?.pago) return;
    const p = d.pago;
    const html = `
<table cellpadding="0" cellspacing="0" width="100%" style="border-bottom:0.25pt solid #000;">
  <tr><td align="center">
    <img class="logo" src="/assets/logo_texto.png" style="max-width:300px;" /><br />
    <span class="xs">INFORMACION: 2200020 - 68355517</span>
  </td></tr>
</table>
<table cellpadding="1" cellspacing="0" width="100%" style="border-bottom:0.25pt solid #000;">
  <tr><th style="font-size:16px;">COMPROBANTE DE PAGO</th></tr>
  <tr><th>${this.esc(d.tipo)}<br />${this.esc(d.agencia)}</th></tr>
  <tr><td align="center">FECHA: ${this.esc(d.fecha)}</td></tr>
</table>
<table align="center" cellpadding="0" cellspacing="0" width="100%">
  <tr><td colspan="2"><b>DATOS DEL REMITENTE</b></td></tr>
  <tr><td colspan="2">${this.esc(d.remitente.nombre)}</td></tr>
  ${d.remitente.telefono ? `<tr><td colspan="2">TELEFONO ${this.esc(d.remitente.telefono)}</td></tr>` : ''}
  <tr><td colspan="2" class="sep-td"> </td></tr>
  <tr><td colspan="2"><b>DATOS DEL DESTINATARIO</b></td></tr>
  <tr><td colspan="2">${this.esc(d.destinatario.nombre)}</td></tr>
  ${d.destinatario.telefono ? `<tr><td colspan="2">TELEFONO ${this.esc(d.destinatario.telefono)}</td></tr>` : ''}
  ${d.destinatario.domicilio ? `<tr><td><b>DIRECCION</b></td><td>${this.esc(d.destinatario.domicilio)}</td></tr>` : ''}
  ${p.documento ? `<tr><td colspan="2" nowrap>${this.esc(p.documento)}</td></tr>` : ''}
  <tr><td colspan="2" class="sep-td"> </td></tr>
  <tr>
    <td><b>DATOS DEL PAGO</b></td>
    <td align="right">${this.esc(p.agencia)}</td>
  </tr>
  <tr>
    <td>OPE: ${this.esc(p.operador)}</td>
    <td align="right"><b>CODIGO: ${this.esc(d.codigo)}</b></td>
  </tr>
  <tr>
    <td>FECHA: ${this.esc(p.fecha)}</td>
    <td align="right"> </td>
  </tr>
  <tr>
    <td style="font-size:16px;"><b>MONTO EN ${this.esc(p.moneda)}</b></td>
    <td align="right" style="font-size:16px;"><b>${this.num(p.monto)}</b></td>
  </tr>
  ${p.comprobante ? `<tr><td><b>COMPROBANTE</b></td><td align="right">${this.esc(p.comprobante)}</td></tr>` : ''}
  ${p.motivo ? `<tr><td><b>MOTIVO</b></td><td align="right">${this.esc(p.motivo)}</td></tr>` : ''}
  <tr><td colspan="2" class="sep-td"> </td></tr>
  <tr><td colspan="2">
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="sig-space"> </td>
        <td style="width:20px;"> </td>
        <td class="sig-space"> </td>
      </tr>
      <tr>
        <td class="sig-label">FIRMA CAJERO</td>
        <td> </td>
        <td class="sig-label">FIRMA CLIENTE</td>
      </tr>
    </table>
  </td></tr>
  <tr><td colspan="2" align="justify" class="xxs"><b><u>NOTA</u>.-</b> AL FIRMAR ESTE DOCUMENTO SE ACEPTAN LOS TERMINOS Y CONDICIONES DE GAMBARTE S.R.L.</td></tr>
</table>`;
    this.openPrint(`PR-${d.codigo}`, html);
  }

  printRemesaFactura(): void {
    const d = this.remesaDetail;
    if (!d?.factura) return;
    const f = d.factura;
    const html = `
<table width="100%">
  <tr><td align="center"><img class="logo" src="/assets/logo_texto.png" /></td></tr>
</table><br />
<table cellpadding="0" cellspacing="0" width="100%">
  <tr><td align="center"><h2 align="center" style="margin:0;padding:0;">FACTURA</h2></td></tr>
  <tr><td align="center" style="border-bottom:0.25pt solid #000;"><b>(Con derecho a cr&eacute;dito fiscal)</b></td></tr>
</table><br />
<table width="100%">
  <tr><td align="center">
    NIT 335846029<br />
    FACTURA N&deg; ${this.esc(f.numero)}<br />
    AUTORIZACION N&deg; ${this.esc(f.autorizacion)}
  </td></tr>
</table>
<div style="border-top:0.25pt solid #000;"></div>
<table width="100%">
  <tr><td align="left">FECHA: ${this.esc(f.fecha)}</td></tr>
  <tr><td align="left">HORA: ${this.esc(f.hora)}</td></tr>
  <tr><td align="left">NIT/CI: ${this.esc(f.nit)}</td></tr>
  <tr><td align="left">SE&Ntilde;OR(ES): ${this.esc(f.nombre)}</td></tr>
</table>
<div style="border-top:0.25pt solid #000;"></div>
<table width="100%">
  <tr><th>CONCEPTO</th><th>IMPORTE</th></tr>
  <tr>
    <td>COMISION POR REMESA #${this.esc(d.codigo)}</td>
    <td align="right" nowrap>BOB ${this.num(f.importe)}</td>
  </tr>
  <tr><td colspan="2" class="sep-td"> </td></tr>
  <tr>
    <td align="right"><b>TOTAL [BOB]</b></td>
    <td align="right" nowrap>${this.num(f.importe)}</td>
  </tr>
  <tr><td colspan="2" class="sep-td"> </td></tr>
  <tr><td colspan="2">${this.esc(f.detalle)}</td></tr>
</table>
<div style="border-top:0.25pt solid #000;"></div>
<table width="100%">
  <tr>
    <td align="left" class="xxs" nowrap>Transacci&oacute;n: ${this.esc(d.id)}</td>
    <td align="right" class="xxs" nowrap>OPERADOR: ${this.esc(d.operador)}</td>
  </tr>
</table>`;
    this.openPrint(`FC-${f.numero}`, html);
  }
}
