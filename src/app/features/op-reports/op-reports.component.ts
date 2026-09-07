import { Component, OnInit, OnDestroy, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { OpReportsService } from './op-reports.service';
import { AuthService } from '../../core/auth.service';
import { LOGO_GAMBARTE_BASE64 } from '../../shared/logo-base64';
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
export class OpReportsComponent implements OnInit, OnDestroy {
  private svc = inject(OpReportsService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private el = inject(ElementRef);
  private routeSub: any;

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (this.estadoDropdownOpen && !this.el.nativeElement.querySelector('.estado-drop')?.contains(e.target))
      this.estadoDropdownOpen = false;
  }

  selected: OpReportType = 'cambios';
  desde = new Date().toISOString().slice(0, 10);
  hasta = '';
  agencia: number | null = null;
  tipoOperacion: number | null = null;
  estadoFilter: number[] = [];
  estadoDropdownOpen = false;
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
    { key: 'porcentajeComision', label: '% Comision', selected: false, align: 'right', format: 'number' },
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
    this.routeSub = this.route.queryParams.subscribe(params => {
      const tab = params['tab'] as OpReportType;
      if (tab && ['cambios', 'giros', 'remesas'].includes(tab)) {
        this.selected = tab;
        this.searchQuery = '';
      }
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
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
          this.estadoFilter.length ? this.estadoFilter.join(',') : undefined,
          this.codigoFilter ? parseInt(this.codigoFilter) : undefined
        ).subscribe({
          next: (d) => { this.girosData = d.records; this.totalRecords = d.total; this.loading = false; },
          error: (e: Error) => this.fail(e),
        });
        break;
      case 'remesas':
        this.svc.getRemesas(
          this.desde, hasta, ag,
          this.estadoFilter.length ? this.estadoFilter.join(',') : undefined,
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

  toggleEstado(val: number): void {
    const idx = this.estadoFilter.indexOf(val);
    if (idx >= 0) this.estadoFilter.splice(idx, 1);
    else this.estadoFilter.push(val);
  }

  get estadoLabel(): string {
    if (!this.estadoFilter.length) return 'Todos';
    const map: Record<number, string> = { 0: 'Pendiente', 1: 'Pagado', 2: 'Devuelto', 5: 'Anulado' };
    return this.estadoFilter.map(e => map[e] || e).join(', ');
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

  async exportExcel(): Promise<void> {
    const cols = this.selectedExportColumns;
    const rows = this.exportData;
    if (!cols.length || !rows.length) return;

    const periodo = this.hasta ? `${this.desde} al ${this.hasta}` : this.desde;
    const now = new Date();
    const fechaLarga = now.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const hora = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const usuario = this.auth.user;
    const agenciaSesion = this.auth.agencia;
    const nombreUsuario = usuario ? `${usuario.nombre} (${usuario.login.toUpperCase()})` : '';
    const agenciaDesc = agenciaSesion?.descripcion || 'OFICINA CENTRAL';

    const totalCols = cols.length + 1;
    const wb = new Workbook();
    const ws = wb.addWorksheet(this.exportTitle.replace(/[*?:\\/\[\]]/g, '-').substring(0, 31));

    const hdrFill: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };
    const hdrFont: any = { bold: true, size: 9, name: 'Courier New' };
    const hdrFontWhite: any = { bold: true, size: 9, color: { argb: 'FFFFFFFF' }, name: 'Courier New' };
    const darkFill: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } };
    const bodyFont: any = { size: 9, name: 'Courier New' };
    const boldFont: any = { bold: true, size: 9, name: 'Courier New' };
    const thinBorder: any = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

    // Logo image
    const logoBase64Data = LOGO_GAMBARTE_BASE64.split(',')[1];
    const logoId = wb.addImage({ base64: logoBase64Data, extension: 'png' });
    ws.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 200, height: 55 } });

    // Company header (offset rows for logo)
    const r1 = ws.addRow(['', '', '', 'GAMBARTE BOLIVIA S.R.L.']);
    r1.font = { bold: true, size: 14, name: 'Courier New', color: { argb: 'FFE8860C' } };
    r1.height = 22;

    const r2 = ws.addRow(['', '', '', 'Casa Matriz - Calle Mercado N° 1335, Edificio América, PB Oficina 102, Zona Central.']);
    r2.font = { size: 8, name: 'Courier New' };

    const r3 = ws.addRow(['', '', '', 'Servicio al cliente: +591 68355517  |  www.gambarte.com.bo']);
    r3.font = { size: 8, name: 'Courier New' };

    ws.addRow([]);

    // Report title
    const titleRow = ws.addRow([this.exportTitle]);
    titleRow.font = { bold: true, size: 12, name: 'Courier New' };
    titleRow.alignment = { horizontal: 'center' };
    ws.mergeCells(ws.rowCount, 1, ws.rowCount, totalCols);

    ws.addRow([]);

    // Metadata
    const m1 = ws.addRow([`Agencia: ${agenciaDesc}    Usuario: ${nombreUsuario}    ${fechaLarga} - ${hora}`]);
    m1.font = boldFont;
    ws.mergeCells(ws.rowCount, 1, ws.rowCount, totalCols);

    const m2 = ws.addRow([`Periodo: ${this.desde} al ${this.hasta || this.desde}`]);
    m2.font = boldFont;
    ws.mergeCells(ws.rowCount, 1, ws.rowCount, totalCols);

    ws.addRow([]);

    // Section label
    const secRow = ws.addRow(['DATOS DE OPERACIONES']);
    secRow.font = { bold: true, size: 10, name: 'Courier New' };
    ws.mergeCells(ws.rowCount, 1, ws.rowCount, totalCols);

    // Column headers
    const hdrLabels = ['N°', ...cols.map(c => c.label)];
    const hdrRow = ws.addRow(hdrLabels);
    hdrRow.eachCell(cell => {
      cell.font = hdrFontWhite;
      cell.fill = darkFill;
      cell.alignment = { horizontal: 'center', wrapText: true };
      cell.border = thinBorder;
    });

    // Data rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const vals: any[] = [i + 1];
      cols.forEach(col => {
        const v = (row as Record<string, unknown>)[col.key];
        if (col.format === 'number' || col.format === 'number4') vals.push(Number(v) || 0);
        else vals.push(v == null ? '' : String(v));
      });
      const dataRow = ws.addRow(vals);
      dataRow.getCell(1).alignment = { horizontal: 'center' };
      dataRow.getCell(1).font = bodyFont;
      dataRow.getCell(1).border = thinBorder;
      cols.forEach((col, idx) => {
        const cell = dataRow.getCell(idx + 2);
        cell.font = bodyFont;
        cell.border = thinBorder;
        if (col.format === 'number') cell.numFmt = '#,##0.00';
        if (col.format === 'number4') cell.numFmt = '#,##0.0000';
        if (col.align === 'right') cell.alignment = { horizontal: 'right' };
      });
    }

    // Column widths
    ws.getColumn(1).width = 5;
    cols.forEach((_, i) => { ws.getColumn(i + 2).width = 18; });

    // Summary tables
    ws.addRow([]);

    if (this.selected === 'remesas') {
      const byAgencia: Record<string, { count: number; totalBob: number }> = {};
      const byEstado: Record<string, { count: number; totalBob: number; totalEnvUsd: number }> = {};
      for (const r of rows) {
        const ag = String((r as any).agencia || 'SIN AGENCIA');
        if (!byAgencia[ag]) byAgencia[ag] = { count: 0, totalBob: 0 };
        byAgencia[ag].count++;
        byAgencia[ag].totalBob += Number((r as any).totalBob) || 0;

        const est = String((r as any).estadoDesc || 'DESCONOCIDO');
        if (!byEstado[est]) byEstado[est] = { count: 0, totalBob: 0, totalEnvUsd: 0 };
        byEstado[est].count++;
        byEstado[est].totalBob += Number((r as any).totalBob) || 0;
        if (String((r as any).moneda || '').toUpperCase() === 'USD') byEstado[est].totalEnvUsd += Number((r as any).monto) || 0;
      }

      // Agency summary
      const agLabel = ws.addRow(['RESUMEN POR AGENCIA DESTINO (ENVÍOS BOB)']);
      agLabel.font = { bold: true, size: 10, name: 'Courier New' };
      ws.mergeCells(ws.rowCount, 1, ws.rowCount, totalCols);

      const agHdr = ws.addRow(['AGENCIA DESTINO', '', 'N° OPER.', 'MONTO [BOB]']);
      agHdr.eachCell(cell => { cell.font = hdrFont; cell.fill = hdrFill; cell.border = thinBorder; cell.alignment = { horizontal: 'center' }; });

      for (const [ag, v] of Object.entries(byAgencia)) {
        const r = ws.addRow([ag, '', v.count, v.totalBob]);
        r.getCell(1).font = bodyFont; r.getCell(1).border = thinBorder;
        r.getCell(2).border = thinBorder;
        r.getCell(3).font = bodyFont; r.getCell(3).alignment = { horizontal: 'center' }; r.getCell(3).border = thinBorder;
        r.getCell(4).font = bodyFont; r.getCell(4).numFmt = '#,##0.00'; r.getCell(4).alignment = { horizontal: 'right' }; r.getCell(4).border = thinBorder;
      }
      const agTotal = Object.values(byAgencia).reduce((s, v) => s + v.totalBob, 0);
      const agCount = Object.values(byAgencia).reduce((s, v) => s + v.count, 0);
      const agTot = ws.addRow(['TOTAL GENERAL', '', agCount, agTotal]);
      agTot.eachCell(cell => { cell.font = boldFont; cell.border = thinBorder; });
      agTot.getCell(3).alignment = { horizontal: 'center' };
      agTot.getCell(4).numFmt = '#,##0.00'; agTot.getCell(4).alignment = { horizontal: 'right' };

      ws.addRow([]);

      // Estado summary
      const estLabel = ws.addRow(['RESUMEN TOTAL PAGADOS Y PENDIENTES']);
      estLabel.font = { bold: true, size: 10, name: 'Courier New' };
      ws.mergeCells(ws.rowCount, 1, ws.rowCount, totalCols);

      const estHdr = ws.addRow(['ESTADO', 'N° REMESAS', 'TOTAL MONTO [BOB]', 'TOTAL ENVÍO [USD]']);
      estHdr.eachCell(cell => { cell.font = hdrFont; cell.fill = hdrFill; cell.border = thinBorder; cell.alignment = { horizontal: 'center' }; });

      for (const [est, v] of Object.entries(byEstado)) {
        const r = ws.addRow([est, v.count, v.totalBob, v.totalEnvUsd]);
        r.getCell(1).font = bodyFont; r.getCell(1).border = thinBorder;
        r.getCell(2).font = bodyFont; r.getCell(2).alignment = { horizontal: 'center' }; r.getCell(2).border = thinBorder;
        r.getCell(3).font = bodyFont; r.getCell(3).numFmt = '#,##0.00'; r.getCell(3).alignment = { horizontal: 'right' }; r.getCell(3).border = thinBorder;
        r.getCell(4).font = bodyFont; r.getCell(4).numFmt = '#,##0.00'; r.getCell(4).alignment = { horizontal: 'right' }; r.getCell(4).border = thinBorder;
      }
      const estTotalBob = Object.values(byEstado).reduce((s, v) => s + v.totalBob, 0);
      const estTotalUsd = Object.values(byEstado).reduce((s, v) => s + v.totalEnvUsd, 0);
      const estCount = Object.values(byEstado).reduce((s, v) => s + v.count, 0);
      const estTot = ws.addRow(['TOTAL GENERAL', estCount, estTotalBob, estTotalUsd]);
      estTot.eachCell(cell => { cell.font = boldFont; cell.border = thinBorder; });
      estTot.getCell(2).alignment = { horizontal: 'center' };
      estTot.getCell(3).numFmt = '#,##0.00'; estTot.getCell(3).alignment = { horizontal: 'right' };
      estTot.getCell(4).numFmt = '#,##0.00'; estTot.getCell(4).alignment = { horizontal: 'right' };
    } else if (this.selected === 'cambios') {
      const byTipo: Record<string, { count: number; totalBob: number }> = {};
      for (const r of rows) {
        const tipo = String((r as any).tipoOperacion || 'SIN TIPO');
        if (!byTipo[tipo]) byTipo[tipo] = { count: 0, totalBob: 0 };
        byTipo[tipo].count++;
        byTipo[tipo].totalBob += Number((r as any).totalBob) || 0;
      }
      const tLabel = ws.addRow(['RESUMEN POR TIPO DE OPERACIÓN']);
      tLabel.font = { bold: true, size: 10, name: 'Courier New' };
      ws.mergeCells(ws.rowCount, 1, ws.rowCount, totalCols);

      const tHdr = ws.addRow(['TIPO OPERACIÓN', '', 'N° OPER.', 'TOTAL [BOB]']);
      tHdr.eachCell(cell => { cell.font = hdrFont; cell.fill = hdrFill; cell.border = thinBorder; cell.alignment = { horizontal: 'center' }; });

      for (const [t, v] of Object.entries(byTipo)) {
        const r = ws.addRow([t, '', v.count, v.totalBob]);
        r.getCell(1).font = bodyFont; r.getCell(1).border = thinBorder;
        r.getCell(2).border = thinBorder;
        r.getCell(3).font = bodyFont; r.getCell(3).alignment = { horizontal: 'center' }; r.getCell(3).border = thinBorder;
        r.getCell(4).font = bodyFont; r.getCell(4).numFmt = '#,##0.00'; r.getCell(4).alignment = { horizontal: 'right' }; r.getCell(4).border = thinBorder;
      }
      const tTotal = Object.values(byTipo).reduce((s, v) => s + v.totalBob, 0);
      const tCount = Object.values(byTipo).reduce((s, v) => s + v.count, 0);
      const tTot = ws.addRow(['TOTAL GENERAL', '', tCount, tTotal]);
      tTot.eachCell(cell => { cell.font = boldFont; cell.border = thinBorder; });
      tTot.getCell(3).alignment = { horizontal: 'center' };
      tTot.getCell(4).numFmt = '#,##0.00'; tTot.getCell(4).alignment = { horizontal: 'right' };
    }

    // Footer
    ws.addRow([]);
    ws.addRow([]);
    const nameRow = ws.addRow(['NOMBRE:', '', '', '', 'RUN:']);
    nameRow.font = boldFont;

    ws.addRow([]);
    const firmaRow = ws.addRow(['FIRMA:']);
    firmaRow.font = boldFont;

    ws.addRow([]);
    ws.addRow([]);
    const genRow = ws.addRow([`GENERADO POR: ${nombreUsuario}`, '', '', '', `REVISADO POR:`]);
    genRow.font = boldFont;

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `reporte_${this.selected}_${this.desde}.xlsx`);
  }

  exportPdf(): void {
    const cols = this.selectedExportColumns;
    const rows = this.exportData;
    if (!cols.length || !rows.length) return;

    const periodo = this.hasta ? `${this.desde} al ${this.hasta}` : this.desde;
    const now = new Date();
    const fechaLarga = now.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const hora = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const usuario = this.auth.user;
    const agenciaSesion = this.auth.agencia;
    const nombreUsuario = usuario ? `${usuario.nombre} (${usuario.login.toUpperCase()})` : '';
    const agenciaDesc = agenciaSesion?.descripcion || 'OFICINA CENTRAL';
    const totalPages = 1;

    const numCols = cols.length + 1;

    const ths = `<th>N&deg;</th>` + cols.map(c => {
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
      return `<tr><td class="c">${i + 1}</td>${tds}</tr>`;
    }).join('\n');

    const fmtMoney = (n: number) => n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    let summaryHtml = '';
    if (this.selected === 'remesas') {
      const byAgencia: Record<string, { count: number; totalBob: number }> = {};
      const byEstado: Record<string, { count: number; totalBob: number; totalEnvUsd: number }> = {};
      for (const r of rows) {
        const ag = String((r as any).agencia || 'SIN AGENCIA');
        if (!byAgencia[ag]) byAgencia[ag] = { count: 0, totalBob: 0 };
        byAgencia[ag].count++;
        byAgencia[ag].totalBob += Number((r as any).totalBob) || 0;

        const est = String((r as any).estadoDesc || 'DESCONOCIDO');
        if (!byEstado[est]) byEstado[est] = { count: 0, totalBob: 0, totalEnvUsd: 0 };
        byEstado[est].count++;
        byEstado[est].totalBob += Number((r as any).totalBob) || 0;
        const moneda = String((r as any).moneda || '').toUpperCase();
        if (moneda === 'USD') byEstado[est].totalEnvUsd += Number((r as any).monto) || 0;
      }

      const agRows = Object.entries(byAgencia).map(([ag, v]) =>
        `<tr><td>${this.esc(ag)}</td><td class="c">${v.count}</td><td class="r">${fmtMoney(v.totalBob)}</td></tr>`
      ).join('');
      const agTotal = Object.values(byAgencia).reduce((s, v) => s + v.totalBob, 0);
      const agCount = Object.values(byAgencia).reduce((s, v) => s + v.count, 0);

      summaryHtml += `
      <div class="summary-title">RESUMEN POR AGENCIA DESTINO (ENV&Iacute;OS BOB)</div>
      <table class="summary"><thead><tr><th>AGENCIA DESTINO</th><th>N&deg; OPER.</th><th class="r">MONTO [BOB]</th></tr></thead><tbody>
        ${agRows}
        <tr class="total-row"><td>TOTAL GENERAL</td><td class="c">${agCount}</td><td class="r">${fmtMoney(agTotal)}</td></tr>
      </tbody></table>`;

      const estRows = Object.entries(byEstado).map(([est, v]) =>
        `<tr><td>${this.esc(est)}</td><td class="c">${v.count}</td><td class="r">${fmtMoney(v.totalBob)}</td><td class="r">${fmtMoney(v.totalEnvUsd)}</td></tr>`
      ).join('');
      const estTotalBob = Object.values(byEstado).reduce((s, v) => s + v.totalBob, 0);
      const estTotalUsd = Object.values(byEstado).reduce((s, v) => s + v.totalEnvUsd, 0);
      const estCount = Object.values(byEstado).reduce((s, v) => s + v.count, 0);

      summaryHtml += `
      <div class="summary-title">RESUMEN TOTAL PAGADOS Y PENDIENTES</div>
      <table class="summary"><thead><tr><th>ESTADO</th><th>N&deg; REMESAS</th><th class="r">TOTAL MONTO [BOB]</th><th class="r">TOTAL ENV&Iacute;O [USD]</th></tr></thead><tbody>
        ${estRows}
        <tr class="total-row"><td>TOTAL GENERAL</td><td class="c">${estCount}</td><td class="r">${fmtMoney(estTotalBob)}</td><td class="r">${fmtMoney(estTotalUsd)}</td></tr>
      </tbody></table>`;
    } else if (this.selected === 'cambios') {
      const byTipo: Record<string, { count: number; totalBob: number }> = {};
      for (const r of rows) {
        const tipo = String((r as any).tipoOperacion || 'SIN TIPO');
        if (!byTipo[tipo]) byTipo[tipo] = { count: 0, totalBob: 0 };
        byTipo[tipo].count++;
        byTipo[tipo].totalBob += Number((r as any).totalBob) || 0;
      }
      const tRows = Object.entries(byTipo).map(([t, v]) =>
        `<tr><td>${this.esc(t)}</td><td class="c">${v.count}</td><td class="r">${fmtMoney(v.totalBob)}</td></tr>`
      ).join('');
      const tTotal = Object.values(byTipo).reduce((s, v) => s + v.totalBob, 0);
      const tCount = Object.values(byTipo).reduce((s, v) => s + v.count, 0);

      summaryHtml += `
      <div class="summary-title">RESUMEN POR TIPO DE OPERACI&Oacute;N</div>
      <table class="summary"><thead><tr><th>TIPO OPERACI&Oacute;N</th><th>N&deg; OPER.</th><th class="r">TOTAL [BOB]</th></tr></thead><tbody>
        ${tRows}
        <tr class="total-row"><td>TOTAL GENERAL</td><td class="c">${tCount}</td><td class="r">${fmtMoney(tTotal)}</td></tr>
      </tbody></table>`;
    }

    const html = `<!DOCTYPE html><html><head><title>${this.esc(this.exportTitle)} ${periodo}</title>
<style>
  @page { size: landscape; margin: 10mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #000; margin: 0; padding: 10px 15px; }

  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2px; }
  .logo-block { display: flex; align-items: center; gap: 8px; }
  .logo-block img { height: 50px; width: auto; }
  .company-info { text-align: center; font-size: 9px; line-height: 1.4; flex: 1; }
  .company-name { font-size: 12px; font-weight: 700; }
  .company-contact { color: #333; }
  .report-title { font-size: 12px; font-weight: 700; text-align: center; margin: 2px 0; text-transform: uppercase; }
  .report-subtitle { font-size: 10px; text-align: center; margin-bottom: 4px; }
  .page-num { text-align: right; font-size: 9px; white-space: nowrap; }

  .meta { font-size: 9px; margin-bottom: 8px; line-height: 1.5; }
  .meta b { font-weight: 700; }

  .section-label { font-size: 10px; font-weight: 700; margin: 12px 0 4px; text-transform: uppercase; }

  table.data { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  table.data th {
    background: #E8E8E8; font-size: 8px; font-weight: 700; text-transform: uppercase;
    padding: 4px 5px; border: 1px solid #999; text-align: center;
  }
  table.data td {
    padding: 3px 5px; border: 1px solid #ccc; font-size: 9px; vertical-align: top;
  }

  table.summary { width: auto; min-width: 400px; border-collapse: collapse; margin-bottom: 14px; }
  table.summary th {
    background: #E8E8E8; font-size: 9px; font-weight: 700; text-transform: uppercase;
    padding: 4px 8px; border: 1px solid #999; text-align: center;
  }
  table.summary td { padding: 3px 8px; border: 1px solid #ccc; font-size: 9px; }

  .total-row td { font-weight: 700; background: #f0f0f0; border-top: 2px solid #999; }
  .summary-title { font-size: 10px; font-weight: 700; margin: 14px 0 4px; text-transform: uppercase; }

  .r { text-align: right; } .c { text-align: center; }

  .signatures { margin-top: 40px; font-size: 10px; font-weight: 700; }
  .sig-row { display: flex; justify-content: space-between; margin-top: 6px; }
  .sig-block { width: 45%; }
  .sig-line { border-bottom: 1px solid #000; margin-top: 40px; margin-bottom: 2px; }
  .sig-label { font-weight: 700; }

  .gen-footer { margin-top: 30px; font-size: 9px; display: flex; justify-content: space-between; }
  .gen-footer span { font-weight: 700; }
</style></head><body>
<div class="page-header">
  <div class="logo-block">
    <img src="${LOGO_GAMBARTE_BASE64}" alt="Gambarte">
  </div>
  <div class="company-info">
    <div class="company-contact">Casa Matriz &ndash; Calle Mercado N&deg; 1335, Edificio Am&eacute;rica, PB Oficina 102, Zona Central.</div>
    <div class="company-name">GAMBARTE BOLIVIA S.R.L.</div>
    <div class="company-contact">Servicio al cliente: +591 68355517</div>
    <div class="company-contact">Sitio web: www.gambarte.com.bo</div>
  </div>
  <div class="page-num">${this.esc(this.exportTitle)}<br>P&aacute;gina 1 de 1</div>
</div>

<div class="report-title">${this.esc(this.exportTitle)}</div>

<div class="meta">
  <b>Agencia:</b> ${this.esc(agenciaDesc)} &nbsp;&nbsp;
  <b>Usuario:</b> ${this.esc(nombreUsuario)} &nbsp;&nbsp;
  ${this.esc(fechaLarga)} &ndash; ${hora}<br>
  <b>Periodo:</b> ${this.desde} al ${this.hasta || this.desde}
</div>

<div class="section-label">DATOS DE OPERACIONES</div>
<table class="data">
  <thead><tr>${ths}</tr></thead>
  <tbody>${trs}</tbody>
</table>

${summaryHtml}

<div class="signatures">
  <div class="sig-row">
    <div class="sig-block">
      <div class="sig-label">NOMBRE:</div>
      <div class="sig-line"></div>
    </div>
    <div class="sig-block">
      <div class="sig-label">RUN:</div>
      <div class="sig-line"></div>
    </div>
  </div>
  <div style="margin-top: 20px;">
    <div class="sig-label">FIRMA:</div>
    <div class="sig-line" style="width: 45%;"></div>
  </div>
</div>

<div class="gen-footer">
  <span>GENERADO POR: ${this.esc(nombreUsuario)}</span>
  <span>REVISADO POR:</span>
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
