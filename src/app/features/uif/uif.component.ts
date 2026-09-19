import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { UifService } from './uif.service';
import { AuthService } from '../../core/auth.service';
import { LoadingComponent } from '../../shared/loading.component';
import { LOGO_GAMBARTE_BASE64 } from '../../shared/logo-base64';
import {
  UifReportType, Agency,
  PccRow, CambioUifRow, GiroUifRow, RemesaUifRow, UsuarioFinancieroRow,
} from './uif.models';

interface ExportColumn {
  key: string;
  label: string;
  selected: boolean;
  align?: 'left' | 'right' | 'center';
  format?: 'number' | 'number4' | 'text';
}

@Component({
  selector: 'app-uif',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent, MatPaginatorModule],
  templateUrl: './uif.component.html',
  styleUrl: './uif.component.scss',
})
export class UifComponent implements OnInit, OnDestroy {
  private svc = inject(UifService);
  private auth = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private route = inject(ActivatedRoute);

  selected: UifReportType = 'pcc';
  desde = new Date().toISOString().slice(0, 10);
  hasta = new Date().toISOString().slice(0, 10);
  agencia: number | null = null;
  pccType: number = 6;
  searchQuery = '';
  agencies: Agency[] = [];

  // Filtros Usuario Financiero
  ufTipoDoc: number | null = null;
  ufDocumento = '';
  ufExpedicion: number | null = null;
  ufNombres = '';
  ufApePat = '';
  ufApeMat = '';
  ufOperacion: number | null = null;

  get destRemLabel(): string {
    if (this.ufOperacion === -1 || this.ufOperacion === 4) return 'Remitente';
    if (this.ufOperacion === 3) return 'Destinatario';
    return 'Dest. / Remitente';
  }

  loading = false;
  error = '';

  // Paginación
  pageIndex = 0;
  pageSize = 50;
  pageSizeOptions = [10, 50, 100, 200, 1000];

  pdfModalOpen = false;
  pdfModalLoading = false;
  pdfModalTitle = '';
  pdfModalUrl: SafeResourceUrl = '';
  pdfModalFilename = '';
  private pdfBlobUrl = '';

  // Extracto dialog
  extractoOpen = false;
  extractoNombre = '';
  extractoDocumento = '';
  extractoOpCambios = true;
  extractoOpRemesas = true;
  extractoOpPagos = true;

  pccData: PccRow[] = [];
  cambiosData: CambioUifRow[] = [];
  girosData: GiroUifRow[] = [];
  remesasData: RemesaUifRow[] = [];
  usuarioData: UsuarioFinancieroRow[] = [];
  totalRecords = 0;

  // Datos paginados (propiedades estables, no getters)
  displayRows: any[] = [];
  totalFiltered = 0;

  // Export dialog
  exportOpen = false;
  exportColumns: ExportColumn[] = [];

  private readonly pccColumns: ExportColumn[] = [
    { key: 'fecha', label: 'Fecha', selected: true },
    { key: 'zona', label: 'Zona', selected: true },
    { key: 'funcionario', label: 'Funcionario', selected: true },
    { key: 'nom_usu', label: 'Nombres', selected: true },
    { key: 'pat_usu', label: 'Ap. Paterno', selected: true },
    { key: 'mat_usu', label: 'Ap. Materno', selected: true },
    { key: 'tipo_doc_usu', label: 'Tipo Doc', selected: true },
    { key: 'doc_usu', label: 'Documento', selected: true },
    { key: 'ext_usu', label: 'Extension', selected: false },
    { key: 'pais_usu', label: 'Pais Nac.', selected: false },
    { key: 'pais_residencia', label: 'Pais Res.', selected: false },
    { key: 'profesion', label: 'Profesion', selected: false },
    { key: 'actividad_economica', label: 'Act. Economica', selected: false },
    { key: 'nom_ben', label: 'Benef. Nombres', selected: true },
    { key: 'pat_ben', label: 'Benef. Ap. Pat.', selected: true },
    { key: 'mat_ben', label: 'Benef. Ap. Mat.', selected: false },
    { key: 'operacion', label: 'Operacion', selected: true },
    { key: 'moneda', label: 'Moneda', selected: true },
    { key: 'monto', label: 'Importe', selected: true, align: 'right', format: 'number' },
    { key: 'pais_origen', label: 'Pais Origen', selected: false },
    { key: 'pais_destino', label: 'Pais Destino', selected: false },
    { key: 'origen_dinero', label: 'Origen', selected: false },
    { key: 'destino_dinero', label: 'Destino', selected: false },
  ];

  private readonly cambioUifColumns: ExportColumn[] = [
    { key: 'id_cambio', label: 'ID', selected: true, align: 'center' },
    { key: 'id_operacion', label: 'Operacion', selected: true },
    { key: 'tipo_operacion', label: 'Tipo', selected: true },
    { key: 'fecha', label: 'Fecha', selected: true },
    { key: 'usuario', label: 'Usuario', selected: true },
    { key: 'usu_financiero', label: 'Usuario Financiero', selected: true },
    { key: 'fec_nacimiento', label: 'Fec. Nacimiento', selected: false },
    { key: 'edad', label: 'Edad', selected: false },
    { key: 'tipo_doc', label: 'Tipo Doc', selected: true },
    { key: 'doc_identidad', label: 'Documento', selected: true },
    { key: 'exp', label: 'Exp', selected: false },
    { key: 'descripcion', label: 'Descripcion', selected: false },
    { key: 'act_econo', label: 'Act. Economica', selected: false },
    { key: 'PEP', label: 'PEP', selected: false },
    { key: 'pais_residencia', label: 'Pais Residencia', selected: false },
    { key: 'domicilio', label: 'Domicilio', selected: false },
    { key: 'celular', label: 'Celular', selected: false },
    { key: 'ciudad_agencia', label: 'Ciudad Agencia', selected: false },
    { key: 'agencia', label: 'Agencia', selected: true },
    { key: 'mon_rec', label: 'Mon. Rec.', selected: true },
    { key: 'monto_recibido', label: 'Monto Recibido', selected: true, align: 'right', format: 'number' },
    { key: 'TC', label: 'TC', selected: true, align: 'right', format: 'number4' },
    { key: 'mon_entregada', label: 'Mon. Entregada', selected: true },
    { key: 'monto_entregado', label: 'Monto Entregado', selected: true, align: 'right', format: 'number' },
    { key: 'pais_transaccion', label: 'Pais Trans.', selected: false },
    { key: 'total_operacion_bob', label: 'Total BOB', selected: true, align: 'right', format: 'number' },
    { key: 'dpto_transaccion', label: 'Dpto Trans.', selected: false },
    { key: 'facturado', label: 'Facturado', selected: false },
    { key: 'tipo_cambio', label: 'Tipo Cambio', selected: false, align: 'right', format: 'number4' },
    { key: 'origen', label: 'Origen', selected: false },
    { key: 'destino', label: 'Destino', selected: false },
  ];

  private readonly giroUifColumns: ExportColumn[] = [
    { key: 'ID_GIRO', label: 'ID', selected: true, align: 'center' },
    { key: 'CODIGO', label: 'Codigo', selected: true },
    { key: 'FECHA', label: 'Fecha', selected: true },
    { key: 'USUARIO', label: 'Usuario', selected: true },
    { key: 'usuario_financiero', label: 'Usuario Financiero', selected: true },
    { key: 'fecha_nacimiento', label: 'Fec. Nacimiento', selected: false },
    { key: 'EDAD', label: 'Edad', selected: false },
    { key: 'tipo_doc', label: 'Tipo Doc', selected: true },
    { key: 'doc_identidad', label: 'Documento', selected: true },
    { key: 'EXTENSION', label: 'Extension', selected: false },
    { key: 'DESCRIPCION', label: 'Descripcion', selected: false },
    { key: 'act_economica', label: 'Act. Economica', selected: false },
    { key: 'PEP', label: 'PEP', selected: false },
    { key: 'pais_residencia', label: 'Pais Residencia', selected: false },
    { key: 'domicilio', label: 'Domicilio', selected: false },
    { key: 'celular', label: 'Celular', selected: false },
    { key: 'ciudad_agencia', label: 'Ciudad Agencia', selected: false },
    { key: 'agencia_origen', label: 'Agencia Origen', selected: true },
    { key: 'agencia_destino', label: 'Agencia Destino', selected: true },
    { key: 'tipo_operacion', label: 'Tipo Operacion', selected: true },
    { key: 'ESTADO', label: 'Estado', selected: true },
    { key: 'mon_rec', label: 'Mon. Rec.', selected: true },
    { key: 'valor_giro', label: 'Valor Giro', selected: true, align: 'right', format: 'number' },
    { key: 'mon_entregada', label: 'Mon. Entregada', selected: false },
    { key: 'valor_bob', label: 'Valor BOB', selected: true, align: 'right', format: 'number' },
    { key: 'pais_transaccion', label: 'Pais Trans.', selected: false },
    { key: 'dpto_transaccion', label: 'Dpto Trans.', selected: false },
    { key: 'FACTURADO', label: 'Facturado', selected: false },
    { key: 'tipo_cambio', label: 'Tipo Cambio', selected: false, align: 'right', format: 'number4' },
    { key: 'origen', label: 'Origen', selected: false },
    { key: 'destino', label: 'Destino', selected: false },
  ];

  private readonly remesaUifColumns: ExportColumn[] = [
    { key: 'id_remesa', label: 'ID', selected: true, align: 'center' },
    { key: 'codigo', label: 'Codigo', selected: true },
    { key: 'fecha', label: 'Fecha', selected: true },
    { key: 'usuario', label: 'Usuario', selected: true },
    { key: 'nro_oper', label: 'Nro Oper', selected: false },
    { key: 'canal_distrib', label: 'Canal', selected: false },
    { key: 'usuario_financiero', label: 'Usuario Financiero', selected: true },
    { key: 'fecha_nacimiento', label: 'Fec. Nacimiento', selected: false },
    { key: 'edad', label: 'Edad', selected: false },
    { key: 'tipo_doc', label: 'Tipo Doc', selected: true },
    { key: 'nacionalidad', label: 'Nacionalidad', selected: false },
    { key: 'doc_identidad', label: 'Documento', selected: true },
    { key: 'EXTENSION', label: 'Extension', selected: false },
    { key: 'DESCRIPCION', label: 'Descripcion', selected: false },
    { key: 'act_economica', label: 'Act. Economica', selected: false },
    { key: 'pep', label: 'PEP', selected: false },
    { key: 'pais_residencia', label: 'Pais Residencia', selected: false },
    { key: 'DOMICILIO', label: 'Domicilio', selected: false },
    { key: 'CELULAR', label: 'Celular', selected: false },
    { key: 'ciudad_agencia', label: 'Ciudad Agencia', selected: false },
    { key: 'agencia_origen', label: 'Agencia Origen', selected: true },
    { key: 'agencia_destino', label: 'Agencia Destino', selected: true },
    { key: 'tipo_operacion', label: 'Tipo Operacion', selected: true },
    { key: 'estado', label: 'Estado', selected: true },
    { key: 'moneda_rec', label: 'Mon. Rec.', selected: true },
    { key: 'valor', label: 'Valor', selected: true, align: 'right', format: 'number' },
    { key: 'moneda_entr', label: 'Mon. Entr.', selected: false },
    { key: 'valor_bob', label: 'Valor BOB', selected: true, align: 'right', format: 'number' },
    { key: 'pais_transaccion', label: 'Pais Trans.', selected: false },
    { key: 'dpto_transaccion', label: 'Dpto Trans.', selected: false },
    { key: 'FACTURADO', label: 'Facturado', selected: false },
    { key: 'impresion_pcc08', label: 'PCC-08', selected: false },
    { key: 'comision_bob', label: 'Comision BOB', selected: true, align: 'right', format: 'number' },
    { key: 'tipo_cambio', label: 'Tipo Cambio', selected: false, align: 'right', format: 'number4' },
    { key: 'origen', label: 'Origen', selected: false },
    { key: 'destino', label: 'Destino', selected: false },
  ];

  private readonly usuarioColumns: ExportColumn[] = [
    { key: 'id_transaccion', label: 'ID Transaccion', selected: true, align: 'center' },
    { key: 'numero', label: 'Factura', selected: true },
    { key: 'tipo_operacion', label: 'Operacion', selected: true },
    { key: 'agencia', label: 'Agencia', selected: true },
    { key: 'nombres', label: 'Nombres', selected: true },
    { key: 'ape_pat', label: 'Ap. Paterno', selected: true },
    { key: 'ape_mat', label: 'Ap. Materno', selected: true },
    { key: 'num_doc_identidad', label: 'Documento', selected: true },
    { key: 'fecha', label: 'Fecha y Hora', selected: true },
    { key: 'moneda', label: 'Moneda', selected: true },
    { key: 'monto', label: 'Monto', selected: true, align: 'right', format: 'number' },
    { key: 'tipo_cambio', label: 'TC', selected: true, align: 'right', format: 'number4' },
    { key: 'comision_bob', label: 'Comision BOB', selected: true, align: 'right', format: 'number' },
    { key: 'total_operacion_bob', label: 'Total Operacion BOB', selected: true, align: 'right', format: 'number' },
    { key: 'destinatario', label: 'Destinatario', selected: true },
  ];

  private updateDestLabel(): void {
    const col = this.usuarioColumns.find(c => c.key === 'destinatario');
    if (col) col.label = this.destRemLabel;
  }

  private routeSub: any;

  ngOnInit(): void {
    this.svc.getAgencies().subscribe({
      next: (list) => (this.agencies = list),
    });
    this.routeSub = this.route.queryParams.subscribe(params => {
      const tab = params['tab'] as UifReportType;
      if (tab && ['pcc', 'cambios', 'giros', 'remesas', 'usuario'].includes(tab)) {
        this.selected = tab;
      } else {
        this.selected = 'pcc';
      }
      this.searchQuery = '';
      this.pageIndex = 0;
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.pageIndex = 0;
    this.pccData = [];
    this.cambiosData = [];
    this.girosData = [];
    this.remesasData = [];
    this.usuarioData = [];
    this.totalRecords = 0;
    this.refreshPage();

    const hasta = this.hasta || undefined;
    const ag = this.agencia ?? undefined;

    switch (this.selected) {
      case 'pcc':
        this.svc.getPccReport(this.pccType, this.desde, hasta, ag).subscribe({
          next: (d) => { this.pccData = d.records; this.totalRecords = d.total; this.loading = false; this.refreshPage(); },
          error: (e: Error) => this.fail(e),
        });
        break;
      case 'cambios':
        this.svc.getCambios(this.desde, hasta, ag).subscribe({
          next: (d) => { this.cambiosData = d.records; this.totalRecords = d.total; this.loading = false; this.refreshPage(); },
          error: (e: Error) => this.fail(e),
        });
        break;
      case 'giros':
        this.svc.getGiros(this.desde, hasta, ag).subscribe({
          next: (d) => { this.girosData = d.records; this.totalRecords = d.total; this.loading = false; this.refreshPage(); },
          error: (e: Error) => this.fail(e),
        });
        break;
      case 'remesas':
        this.svc.getRemesas(this.desde, hasta, ag).subscribe({
          next: (d) => { this.remesasData = d.records; this.totalRecords = d.total; this.loading = false; this.refreshPage(); },
          error: (e: Error) => this.fail(e),
        });
        break;
      case 'usuario':
        this.svc.getUsuarioFinanciero({
          tipo_doc: this.ufTipoDoc ?? undefined,
          documento: this.ufDocumento || undefined,
          expedicion: this.ufExpedicion ?? undefined,
          nombres: this.ufNombres || undefined,
          ape_pat: this.ufApePat || undefined,
          ape_mat: this.ufApeMat || undefined,
          agencia: ag,
          operacion: this.ufOperacion ?? undefined,
          desde: this.desde,
          hasta: hasta || this.desde,
        }).subscribe({
          next: (d) => { this.usuarioData = d.records; this.totalRecords = d.total; this.updateDestLabel(); this.loading = false; this.refreshPage(); },
          error: (e: Error) => this.fail(e),
        });
        break;
    }
  }

  private fail(e: Error): void {
    this.error = e?.message || 'Error al cargar el reporte';
    this.loading = false;
    this.refreshPage();
  }

  // ── Paginación ──

  onSearchChange(): void {
    this.pageIndex = 0;
    this.refreshPage();
  }

  onPageChange(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.refreshPage();
  }

  refreshPage(): void {
    const filtered = this.getFilteredData();
    this.totalFiltered = filtered.length;

    const maxPage = Math.max(0, Math.ceil(this.totalFiltered / this.pageSize) - 1);
    if (this.pageIndex > maxPage) this.pageIndex = maxPage;

    const start = this.pageIndex * this.pageSize;
    this.displayRows = filtered.slice(start, start + this.pageSize);
  }

  private getFilteredData(): any[] {
    const q = this.searchQuery.trim().toLowerCase();
    switch (this.selected) {
      case 'pcc':
        return this.filterList(this.pccData, (m) =>
          (m.nom_usu || '') + (m.pat_usu || '') + (m.mat_usu || '') +
          (m.doc_usu || '') + (m.funcionario || '') + (m.zona || '') +
          (m.nom_ben || '') + (m.pat_ben || '') + (m.operacion || ''), q
        );
      case 'cambios':
        return this.filterList(this.cambiosData, (m) =>
          (m.usu_financiero || '') + (m.agencia || '') +
          (m.usuario || '') + (m.doc_identidad || '') + (m.tipo_operacion || ''), q
        );
      case 'giros':
        return this.filterList(this.girosData, (m) =>
          (m.usuario_financiero || '') + (m.agencia_origen || '') +
          (m.agencia_destino || '') + (m.USUARIO || '') +
          (m.doc_identidad || '') + String(m.CODIGO), q
        );
      case 'remesas':
        return this.filterList(this.remesasData, (m) =>
          (m.usuario_financiero || '') + (m.agencia_origen || '') +
          (m.agencia_destino || '') + (m.usuario || '') +
          (m.doc_identidad || '') + String(m.codigo), q
        );
      case 'usuario':
        return this.filterList(this.usuarioData, (m) =>
          (m.nombres || '') + (m.ape_pat || '') + (m.ape_mat || '') +
          (m.num_doc_identidad || '') + String(m.id_transaccion) +
          (m.numero || '') + (m.origen || '') + (m.destinatario || '') +
          (m.tipo_operacion || '') + (m.agencia || ''), q
        );
    }
  }

  private filterList<T>(list: T[], toStr: (item: T) => string, q: string): T[] {
    if (!q) return list;
    return list.filter(item => toStr(item).toLowerCase().includes(q));
  }

  // ── PCC PDF actions ──

  openPccPdf(row: PccRow): void {
    this.pdfModalLoading = true;
    this.pdfModalOpen = true;
    this.pdfModalTitle = this.pccType === 6
      ? `PCC-06 - ${row.nom_usu || ''} ${row.pat_usu || ''}`
      : `PCC-08 - ${row.nom_usu || ''} ${row.pat_usu || ''}`;

    if (this.pccType === 6) {
      this.svc.downloadPcc06Pdf(row.id_cambio!).subscribe({
        next: blob => this.showPdfModal(blob, this.pdfModalTitle, 'PCC-06'),
        error: (e) => { this.closePdfModal(); this.error = this.extractError(e, 'Error al generar el PDF PCC-06'); },
      });
    } else {
      this.svc.downloadPcc08Pdf(row.id_operacion!, row.id_transaccion!).subscribe({
        next: blob => this.showPdfModal(blob, this.pdfModalTitle, 'PCC-08'),
        error: (e) => { this.closePdfModal(); this.error = this.extractError(e, 'Error al generar el PDF PCC-08'); },
      });
    }
  }

  printBlankPcc(type: number): void {
    this.pdfModalLoading = true;
    this.pdfModalOpen = true;
    this.pdfModalTitle = `Formulario PCC-0${type} en Blanco`;

    this.svc.downloadPccBlank(type).subscribe({
      next: blob => this.showPdfModal(blob, this.pdfModalTitle, `PCC-0${type}_BLANCO`),
      error: (e) => { this.closePdfModal(); this.error = this.extractError(e, `Error al generar el formulario PCC-0${type} en blanco`); },
    });
  }

  // ── PDF Modal ──

  private showPdfModal(blob: Blob, title: string, filename: string): void {
    if (this.pdfBlobUrl) URL.revokeObjectURL(this.pdfBlobUrl);
    const file = new Blob([blob], { type: 'application/pdf' });
    this.pdfBlobUrl = URL.createObjectURL(file);
    this.pdfModalUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfBlobUrl);
    this.pdfModalTitle = title;
    this.pdfModalFilename = filename + '.pdf';
    this.pdfModalLoading = false;
  }

  closePdfModal(): void {
    this.pdfModalOpen = false;
    this.pdfModalLoading = false;
    if (this.pdfBlobUrl) {
      URL.revokeObjectURL(this.pdfBlobUrl);
      this.pdfBlobUrl = '';
    }
    this.pdfModalUrl = '';
  }

  printPdf(): void {
    const iframe = document.querySelector('.pdf-modal-iframe') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  }

  savePdf(): void {
    if (!this.pdfBlobUrl) return;
    const a = document.createElement('a');
    a.href = this.pdfBlobUrl;
    a.download = this.pdfModalFilename;
    a.click();
  }

  openInNewTab(): void {
    if (this.pdfBlobUrl) window.open(this.pdfBlobUrl, '_blank');
  }

  ngOnDestroy(): void {
    this.closePdfModal();
    this.routeSub?.unsubscribe();
  }

  // ── Export dialog ──

  get exportTitle(): string {
    const titles: Record<UifReportType, string> = {
      pcc: 'REPORTE PCC UIF',
      cambios: 'REPORTE DE CAMBIOS UIF',
      giros: 'REPORTE DE GIROS UIF',
      remesas: 'REPORTE DE REMESAS UIF',
      usuario: 'REPORTE USUARIO FINANCIERO',
    };
    return titles[this.selected];
  }

  openExport(): void {
    const source = this.selected === 'pcc' ? this.pccColumns
                 : this.selected === 'cambios' ? this.cambioUifColumns
                 : this.selected === 'giros' ? this.giroUifColumns
                 : this.selected === 'remesas' ? this.remesaUifColumns
                 : this.usuarioColumns;
    this.exportColumns = source.map(c => ({ ...c }));
    this.exportOpen = true;
  }

  closeExport(): void { this.exportOpen = false; }

  get selectedExportColumns(): ExportColumn[] {
    return this.exportColumns.filter(c => c.selected);
  }

  get exportData(): Record<string, unknown>[] {
    return this.getFilteredData();
  }

  get exportPreviewRows(): Record<string, unknown>[] {
    return this.exportData.slice(0, 10);
  }

  selectAllColumns(): void { this.exportColumns.forEach(c => c.selected = true); }
  deselectAllColumns(): void { this.exportColumns.forEach(c => c.selected = false); }

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
    const wb = new Workbook();
    const ws = wb.addWorksheet(this.exportTitle.substring(0, 31));

    const titleRow = ws.addRow([`${this.exportTitle} - ${periodo}`]);
    titleRow.font = { bold: true, size: 14 };
    ws.mergeCells(1, 1, 1, cols.length);
    ws.addRow([]);

    const hdrRow = ws.addRow(cols.map(c => c.label));
    hdrRow.eachCell(cell => {
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF14213D' } };
      cell.alignment = { horizontal: 'center' };
    });

    for (const row of rows) {
      const vals = cols.map(col => {
        const v = (row as Record<string, unknown>)[col.key];
        if (col.format === 'number' || col.format === 'number4') return Number(v) || 0;
        return v == null ? '' : String(v);
      });
      const dataRow = ws.addRow(vals);
      cols.forEach((col, idx) => {
        const cell = dataRow.getCell(idx + 1);
        if (col.format === 'number') cell.numFmt = '#,##0.00';
        if (col.format === 'number4') cell.numFmt = '#,##0.0000';
        if (col.align === 'right') cell.alignment = { horizontal: 'right' };
      });
    }

    cols.forEach((_, i) => { ws.getColumn(i + 1).width = 18; });

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `reporte_${this.selected}_uif_${this.desde}.xlsx`);
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

    const html = `<!DOCTYPE html><html><head><title>${this.esc(this.exportTitle)} ${periodo}</title>
<style>
  @page { size: landscape; margin: 10mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #000; margin: 0; padding: 10px 15px; }
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2px; }
  .logo-block img { height: 50px; width: auto; }
  .company-info { text-align: center; font-size: 9px; line-height: 1.4; flex: 1; }
  .company-name { font-size: 12px; font-weight: 700; }
  .company-contact { color: #333; }
  .report-title { font-size: 12px; font-weight: 700; text-align: center; margin: 2px 0; text-transform: uppercase; }
  .page-num { text-align: right; font-size: 9px; white-space: nowrap; }
  .meta { font-size: 9px; margin-bottom: 8px; line-height: 1.5; }
  .meta b { font-weight: 700; }
  .section-label { font-size: 10px; font-weight: 700; margin: 12px 0 4px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th { background: #E8E8E8; font-size: 8px; font-weight: 700; text-transform: uppercase;
       padding: 4px 5px; border: 1px solid #999; text-align: center; }
  td { padding: 3px 5px; border: 1px solid #ccc; font-size: 9px; vertical-align: top; }
  .r { text-align: right; } .c { text-align: center; }
  .signatures { margin-top: 40px; font-size: 10px; font-weight: 700; }
  .sig-row { display: flex; justify-content: space-between; margin-top: 6px; }
  .sig-block { width: 45%; }
  .sig-line { border-bottom: 1px solid #000; margin-top: 40px; margin-bottom: 2px; }
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
<div class="section-label">DATOS DEL REPORTE</div>
<table>
  <thead><tr>${ths}</tr></thead>
  <tbody>${trs}</tbody>
</table>
<div class="signatures">
  <div class="sig-row">
    <div class="sig-block"><b>NOMBRE:</b><div class="sig-line"></div></div>
    <div class="sig-block"><b>RUN:</b><div class="sig-line"></div></div>
  </div>
  <div style="margin-top:20px"><b>FIRMA:</b><div class="sig-line" style="width:45%"></div></div>
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
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Extracto ──

  openExtracto(): void {
    this.extractoOpen = true;
    this.extractoNombre = '';
    this.extractoDocumento = '';
    this.extractoOpCambios = true;
    this.extractoOpRemesas = true;
    this.extractoOpPagos = true;
  }

  closeExtracto(): void { this.extractoOpen = false; }

  get extractoHasOps(): boolean {
    return this.extractoOpCambios || this.extractoOpRemesas || this.extractoOpPagos;
  }

  get extractoRows(): UsuarioFinancieroRow[] {
    return this.getFilteredData().filter((r: UsuarioFinancieroRow) => {
      if (this.extractoOpCambios && r.fuente === 'C') return true;
      if (this.extractoOpRemesas && (r.fuente === 'R' || r.fuente === 'G')) return true;
      if (this.extractoOpPagos && r.fuente === 'P') return true;
      return false;
    });
  }

  private get extractoTipoLabel(): string {
    const parts: string[] = [];
    if (this.extractoOpCambios) parts.push('CAMBIOS');
    if (this.extractoOpRemesas) parts.push('REMESAS');
    if (this.extractoOpPagos) parts.push('PAGOS');
    return parts.join(', ');
  }

  private opLabel(id: number): string {
    switch (id) {
      case 1: return 'COMPRA';
      case 2: return 'VENTA';
      case 3: return 'GIRO';
      case 4: return 'REMESA';
      default: return String(id);
    }
  }

  private fmtNum(v: any, dec = 2): string {
    const n = Number(v);
    if (isNaN(n)) return '0.' + '0'.repeat(dec);
    return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  private get extractoPagosOnly(): boolean {
    return this.extractoOpPagos && !this.extractoOpCambios && !this.extractoOpRemesas;
  }

  async extractoExcel(): Promise<void> {
    if (this.extractoPagosOnly) return this.extractoPagosExcel();
    const rows = this.extractoRows;
    if (!rows.length) return;
    const nombre = this.extractoNombre || '-';
    const doc = this.extractoDocumento || '-';
    const hoy = new Date().toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' });
    const titulo = `EXTRACTO DE OPERACIONES - ${this.extractoTipoLabel}`;
    const agencia = this.agencies.find(a => a.id_agencia === this.agencia)?.descripcion || 'OFICINA CENTRAL';
    const colCount = 14;

    const wb = new Workbook();
    const ws = wb.addWorksheet('Extracto');

    const r1 = ws.addRow([titulo]);
    r1.font = { bold: true, size: 14 };
    ws.mergeCells(1, 1, 1, colCount);

    const r2 = ws.addRow([agencia]);
    r2.font = { size: 10 };
    ws.mergeCells(2, 1, 2, colCount);

    const r3 = ws.addRow([`Fecha: ${hoy}`]);
    r3.font = { size: 10 };
    ws.mergeCells(3, 1, 3, colCount);

    const r4 = ws.addRow([`Solicitado por: ${nombre}    Documento: ${doc}`]);
    r4.font = { size: 10 };
    ws.mergeCells(4, 1, 4, colCount);

    const r5 = ws.addRow([`Periodo: ${this.desde} al ${this.hasta || this.desde}`]);
    r5.font = { size: 10 };
    ws.mergeCells(5, 1, 5, colCount);

    ws.addRow([]);

    const headers = ['Nro', 'ID Transaccion', 'Factura', 'Operacion', 'Agencia',
      'Usuario Financiero', 'Documento', 'Fecha y Hora', 'Moneda', 'Monto', 'TC',
      'Comision BOB', 'Total Operacion BOB', this.destRemLabel];
    const hdrRow = ws.addRow(headers);
    hdrRow.eachCell(cell => {
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF14213D' } };
      cell.alignment = { horizontal: 'center' };
    });

    rows.forEach((r, i) => {
      ws.addRow([
        i + 1, r.id_transaccion, r.numero, r.tipo_operacion, r.agencia,
        `${r.nombres} ${r.ape_pat} ${r.ape_mat}`, r.num_doc_identidad, r.fecha,
        r.moneda, Number(r.monto) || 0, Number(r.tipo_cambio) || 0,
        Number(r.comision_bob) || 0, Number(r.total_operacion_bob) || 0,
        r.destinatario || '',
      ]);
    });

    const totRow = ws.addRow(['', '', '', '', '', '', '', '', 'TOTALES:',
      rows.reduce((s, r) => s + (Number(r.monto) || 0), 0), '',
      rows.reduce((s, r) => s + (Number(r.comision_bob) || 0), 0),
      rows.reduce((s, r) => s + (Number(r.total_operacion_bob) || 0), 0), '']);
    totRow.font = { bold: true };

    [10, 11, 12, 13].forEach(ci => {
      ws.getColumn(ci).numFmt = ci === 11 ? '#,##0.0000' : '#,##0.00';
      ws.getColumn(ci).width = 16;
    });
    ws.getColumn(1).width = 6;
    ws.getColumn(6).width = 28;
    ws.getColumn(8).width = 20;
    ws.getColumn(14).width = 28;
    [2, 3, 4, 5, 7, 9].forEach(ci => { ws.getColumn(ci).width = 14; });

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `extracto_usuario_financiero_${this.desde}.xlsx`);
  }

  private async extractoPagosExcel(): Promise<void> {
    const rows = this.extractoRows;
    if (!rows.length) return;
    const nombre = this.extractoNombre || '-';
    const doc = this.extractoDocumento || '-';
    const hoy = new Date().toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' });
    const titulo = 'EXTRACTO DE OPERACIONES - PAGOS';
    const agencia = this.agencies.find(a => a.id_agencia === this.agencia)?.descripcion || 'OFICINA CENTRAL';
    const colCount = 10;

    const wb = new Workbook();
    const ws = wb.addWorksheet('Extracto');

    const r1 = ws.addRow([titulo]);
    r1.font = { bold: true, size: 14 };
    ws.mergeCells(1, 1, 1, colCount);

    const r2 = ws.addRow([agencia]);
    r2.font = { size: 10 };
    ws.mergeCells(2, 1, 2, colCount);

    const r3 = ws.addRow([`Fecha: ${hoy}`]);
    r3.font = { size: 10 };
    ws.mergeCells(3, 1, 3, colCount);

    const r4 = ws.addRow([`Solicitado por: ${nombre}    Documento: ${doc}`]);
    r4.font = { size: 10 };
    ws.mergeCells(4, 1, 4, colCount);

    const r5 = ws.addRow([`Periodo: ${this.desde} al ${this.hasta || this.desde}`]);
    r5.font = { size: 10 };
    ws.mergeCells(5, 1, 5, colCount);

    ws.addRow([]);

    const headers = ['Nro', 'Codigo', 'N° Identidad', 'Ordenante', 'Destinatario',
      'Destino', 'Fecha Envio', 'Fecha Pago', 'Monto', 'Estado'];
    const hdrRow = ws.addRow(headers);
    hdrRow.eachCell(cell => {
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF14213D' } };
      cell.alignment = { horizontal: 'center' };
    });

    rows.forEach((r, i) => {
      ws.addRow([
        i + 1, r.codigo || '', r.chile_doc_des || '',
        r.chile_ordenante || '', r.chile_destinatario || '',
        r.chile_tipo || r.tipo_operacion, r.chile_fec_envio || '',
        r.fecha, `Bs. ${this.fmtNum(r.monto)}`, 'PAGADO',
      ]);
    });

    const totRow = ws.addRow(['', '', '', '', '', '', '', 'TOTALES:',
      `Bs. ${this.fmtNum(rows.reduce((s, r) => s + (Number(r.monto) || 0), 0))}`, '']);
    totRow.font = { bold: true };

    ws.getColumn(1).width = 6;
    ws.getColumn(2).width = 10;
    ws.getColumn(3).width = 16;
    ws.getColumn(4).width = 30;
    ws.getColumn(5).width = 30;
    ws.getColumn(6).width = 18;
    ws.getColumn(7).width = 20;
    ws.getColumn(8).width = 20;
    ws.getColumn(9).width = 14;
    ws.getColumn(10).width = 10;

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `extracto_pagos_${this.desde}.xlsx`);
  }

  private extractoPagosPdf(): void {
    const rows = this.extractoRows;
    if (!rows.length) return;
    const nombre = this.extractoNombre || '-';
    const doc = this.extractoDocumento || '-';
    const hoy = new Date().toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' });
    const titulo = 'EXTRACTO DE OPERACIONES - PAGOS';
    const agencia = this.agencies.find(a => a.id_agencia === this.agencia)?.descripcion || 'OFICINA CENTRAL';

    const trs = rows.map((r, i) => `<tr>
      <td class="c">${i + 1}</td>
      <td class="c">${this.esc(r.codigo)}</td>
      <td>${this.esc(r.chile_doc_des)}</td>
      <td>${this.esc(r.chile_ordenante)}</td>
      <td>${this.esc(r.chile_destinatario)}</td>
      <td>${this.esc(r.chile_tipo || r.tipo_operacion)}</td>
      <td>${this.esc(r.chile_fec_envio)}</td>
      <td>${this.esc(r.fecha)}</td>
      <td class="r">Bs. ${this.fmtNum(r.monto)}</td>
      <td class="c">PAGADO</td>
    </tr>`).join('\n');

    const totalMonto = rows.reduce((s, r) => s + Number(r.monto || 0), 0);

    const html = `<!DOCTYPE html><html><head><title>${this.esc(titulo)}</title>
<style>
  @page { size: landscape; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; margin: 0; padding: 20px; }
  .header-bar { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #14213d; padding-bottom: 8px; margin-bottom: 4px; }
  .header-bar .logo img { height: 50px; width: auto; }
  .header-bar .title { font-size: 16px; font-weight: 700; color: #14213d; text-align: right; }
  .sub-bar { display: flex; justify-content: space-between; font-size: 11px; color: #555; border-bottom: 1px solid #ccc; padding: 4px 0 6px; margin-bottom: 10px; }
  .info { margin-bottom: 14px; font-size: 11px; }
  .info b { color: #14213d; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #14213d; color: #fff; font-size: 9px; text-transform: uppercase; letter-spacing: .4px; padding: 7px 6px; text-align: left; }
  td { padding: 5px 6px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
  tr:nth-child(even) { background: #f8f9fb; }
  .r { text-align: right; } .c { text-align: center; }
  .totals td { font-weight: 700; border-top: 2px solid #14213d; background: #f3f4f6; }
  .signatures { display: flex; justify-content: space-around; margin-top: 60px; }
  .sig-box { text-align: center; width: 220px; }
  .sig-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 4px; font-size: 10px; font-weight: 700; }
  .footer { margin-top: 20px; font-size: 9px; color: #888; display: flex; justify-content: space-between; }
</style></head><body>
<div class="header-bar">
  <span class="logo"><img src="${LOGO_GAMBARTE_BASE64}" alt="Gambarte"></span>
  <span class="title">${this.esc(titulo)}</span>
</div>
<div class="sub-bar">
  <span>${this.esc(agencia)}</span>
  <span>${hoy}</span>
</div>
<div class="info">
  <b>SOLICITADO POR:</b> ${this.esc(nombre)} &nbsp;&nbsp;&nbsp; <b>DOCUMENTO:</b> ${this.esc(doc)}<br>
  <b>FECHA DE LA SOLICITUD:</b> ${new Date().toISOString().slice(0, 10)} &nbsp;&nbsp;&nbsp;
  <b>PERIODO:</b> ${this.desde} al ${this.hasta || this.desde}
</div>
<div style="text-align:center;font-weight:700;margin-bottom:8px;font-size:12px;">Reporte de Extracto</div>
<table>
  <thead><tr>
    <th>Nro</th><th>Codigo</th><th>N&deg; Identidad</th><th>Ordenante</th><th>Destinatario</th>
    <th>Destino</th><th>Fecha Envio</th><th>Fecha Pago</th><th>Monto</th><th>Estado</th>
  </tr></thead>
  <tbody>
    ${trs}
    <tr class="totals">
      <td colspan="8" class="r">TOTALES:</td>
      <td class="r">Bs. ${this.fmtNum(totalMonto)}</td>
      <td></td>
    </tr>
  </tbody>
</table>
<div class="signatures">
  <div class="sig-box"><div class="sig-line">RECIBI CONFORME</div></div>
  <div class="sig-box"><div class="sig-line">ENTREGUE CONFORME</div></div>
</div>
<div class="footer">
  <span>Generado: ${new Date().toLocaleString()}</span>
  <span>${rows.length} registro(s)</span>
  <span>CGR - Sistema de Gestion y Reportes</span>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  }

  extractoPdf(): void {
    if (this.extractoPagosOnly) return this.extractoPagosPdf();
    const rows = this.extractoRows;
    if (!rows.length) return;
    const nombre = this.extractoNombre || '-';
    const doc = this.extractoDocumento || '-';
    const hoy = new Date().toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' });
    const titulo = `EXTRACTO DE OPERACIONES - ${this.extractoTipoLabel}`;
    const agencia = this.agencies.find(a => a.id_agencia === this.agencia)?.descripcion || 'OFICINA CENTRAL';

    const trs = rows.map((r, i) => `<tr>
      <td class="c">${i + 1}</td>
      <td class="c">${r.id_transaccion}</td>
      <td>${this.esc(r.numero)}</td>
      <td>${this.esc(r.tipo_operacion)}</td>
      <td>${this.esc(r.agencia)}</td>
      <td>${this.esc(r.nombres)} ${this.esc(r.ape_pat)} ${this.esc(r.ape_mat)}</td>
      <td>${this.esc(r.num_doc_identidad)}</td>
      <td>${this.esc(r.fecha)}</td>
      <td class="c">${r.moneda}</td>
      <td class="r">${this.fmtNum(r.monto)}</td>
      <td class="r">${this.fmtNum(r.tipo_cambio, 4)}</td>
      <td class="r">${this.fmtNum(r.comision_bob)}</td>
      <td class="r">${this.fmtNum(r.total_operacion_bob)}</td>
      <td>${this.esc(r.destinatario) || '-'}</td>
    </tr>`).join('\n');

    const totalMonto = rows.reduce((s, r) => s + Number(r.monto || 0), 0);
    const totalBob = rows.reduce((s, r) => s + Number(r.total_operacion_bob || 0), 0);

    const html = `<!DOCTYPE html><html><head><title>${this.esc(titulo)}</title>
<style>
  @page { size: landscape; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; margin: 0; padding: 20px; }
  .header-bar { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #14213d; padding-bottom: 8px; margin-bottom: 4px; }
  .header-bar .logo img { height: 50px; width: auto; }
  .header-bar .title { font-size: 16px; font-weight: 700; color: #14213d; text-align: right; }
  .sub-bar { display: flex; justify-content: space-between; font-size: 11px; color: #555; border-bottom: 1px solid #ccc; padding: 4px 0 6px; margin-bottom: 10px; }
  .info { margin-bottom: 14px; font-size: 11px; }
  .info b { color: #14213d; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #14213d; color: #fff; font-size: 9px; text-transform: uppercase; letter-spacing: .4px; padding: 7px 6px; text-align: left; }
  td { padding: 5px 6px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
  tr:nth-child(even) { background: #f8f9fb; }
  .r { text-align: right; } .c { text-align: center; }
  .totals td { font-weight: 700; border-top: 2px solid #14213d; background: #f3f4f6; }
  .signatures { display: flex; justify-content: space-around; margin-top: 60px; }
  .sig-box { text-align: center; width: 220px; }
  .sig-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 4px; font-size: 10px; font-weight: 700; }
  .footer { margin-top: 20px; font-size: 9px; color: #888; display: flex; justify-content: space-between; }
</style></head><body>
<div class="header-bar">
  <span class="logo"><img src="${LOGO_GAMBARTE_BASE64}" alt="Gambarte"></span>
  <span class="title">${this.esc(titulo)}</span>
</div>
<div class="sub-bar">
  <span>${this.esc(agencia)}</span>
  <span>${hoy}</span>
</div>
<div class="info">
  <b>SOLICITADO POR:</b> ${this.esc(nombre)} &nbsp;&nbsp;&nbsp; <b>DOCUMENTO:</b> ${this.esc(doc)}<br>
  <b>FECHA DE LA SOLICITUD:</b> ${new Date().toISOString().slice(0, 10)} &nbsp;&nbsp;&nbsp;
  <b>PERIODO:</b> ${this.desde} al ${this.hasta || this.desde}
</div>
<div style="text-align:center;font-weight:700;margin-bottom:8px;font-size:12px;">Reporte de Extracto</div>
<table>
  <thead><tr>
    <th>Nro</th><th>ID Trans.</th><th>Factura</th><th>Operacion</th><th>Agencia</th>
    <th>Usuario Financiero</th><th>Documento</th><th>Fecha y Hora</th>
    <th>Moneda</th><th>Monto</th><th>TC</th><th>Comision BOB</th><th>Total Op. BOB</th><th>${this.destRemLabel}</th>
  </tr></thead>
  <tbody>
    ${trs}
    <tr class="totals">
      <td colspan="9" class="r">TOTALES:</td>
      <td class="r">${this.fmtNum(totalMonto)}</td>
      <td></td>
      <td></td>
      <td class="r">${this.fmtNum(totalBob)}</td>
      <td></td>
    </tr>
  </tbody>
</table>
<div class="signatures">
  <div class="sig-box"><div class="sig-line">RECIBI CONFORME</div></div>
  <div class="sig-box"><div class="sig-line">ENTREGUE CONFORME</div></div>
</div>
<div class="footer">
  <span>Generado: ${new Date().toLocaleString()}</span>
  <span>${rows.length} registro(s)</span>
  <span>CGR - Sistema de Gestion y Reportes</span>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  }

  private extractError(e: any, fallback: string): string {
    if (e?.error instanceof Blob) {
      e.error.text().then((text: string) => {
        try {
          const json = JSON.parse(text);
          if (json?.message) this.error = `${fallback}: ${json.message}`;
        } catch { /* ignore */ }
      });
      return `${fallback} (${e.status || ''})`;
    }
    const msg = e?.error?.message || e?.message || e?.statusText;
    if (msg) return `${fallback}: ${msg}`;
    return fallback;
  }
}
