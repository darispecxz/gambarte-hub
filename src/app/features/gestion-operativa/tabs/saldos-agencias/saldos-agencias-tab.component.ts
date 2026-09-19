import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { GestionOperativaService } from '../../gestion-operativa.service';
import { Consolidado, AgenciaConsolidada, MonedaSaldo } from '../../gestion-operativa.models';
import { AuthService } from '../../../../core/auth.service';
import { LOGO_GAMBARTE_BASE64 } from '../../../../shared/logo-base64';
import { fmt, fmtCompact } from '../../gestion-operativa.utils';

interface AgenciaSaldo {
  idAgencia: number;
  agencia: string;
  abreviatura: string;
  moneda: string;
  efectivo: number;
  total: number;
}

interface TotalMoneda {
  moneda: string;
  total: number;
  cuentas: number;
}

interface ExportColumn {
  key: string;
  label: string;
  selected: boolean;
  align?: 'left' | 'right' | 'center';
  format?: 'number' | 'text';
}

@Component({
  selector: 'app-saldos-agencias-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './saldos-agencias-tab.component.html',
  styleUrl: './saldos-agencias-tab.component.scss',
})
export class SaldosAgenciasTabComponent implements OnInit, OnChanges {
  @Input({ required: true }) fecha!: string;
  @Input() version = 0;

  private svc = inject(GestionOperativaService);
  private auth = inject(AuthService);

  rows: AgenciaSaldo[] = [];
  loading = true;
  error = '';

  monedas = new Set<string>();
  monedaDropOpen = false;

  exportOpen = false;
  exportColumns: ExportColumn[] = [];

  private readonly agenciaColumns: ExportColumn[] = [
    { key: 'agencia',     label: 'Agencia',      selected: true },
    { key: 'abreviatura', label: 'Abreviatura',   selected: false },
    { key: 'moneda',      label: 'Moneda',        selected: true },
    { key: 'efectivo',    label: 'Efectivo (Caja + Bóveda)', selected: true, align: 'right', format: 'number' },
    { key: 'total',       label: 'Total',         selected: true, align: 'right', format: 'number' },
  ];

  fmt = fmt;
  fmtCompact = fmtCompact;

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
    this.svc.getConsolidado(this.fecha).subscribe({
      next: (d: Consolidado) => {
        this.rows = this.flattenConsolidado(d);
        if (!this.monedas.size) {
          const set = new Set<string>();
          this.rows.forEach(r => set.add(r.moneda));
          set.forEach(m => this.monedas.add(m));
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar saldos de agencias.';
        this.loading = false;
      },
    });
  }

  private flattenConsolidado(c: Consolidado): AgenciaSaldo[] {
    const result: AgenciaSaldo[] = [];
    for (const ag of c.agencias) {
      for (const m of ag.monedas) {
        if (m.total === 0) continue;
        result.push({
          idAgencia: ag.idAgencia,
          agencia: ag.agencia,
          abreviatura: ag.abreviatura,
          moneda: m.moneda,
          efectivo: m.caja + m.boveda,
          total: m.total,
        });
      }
    }
    return result;
  }

  // ── Currency filter ──

  get allMonedas(): string[] {
    const set = new Set<string>();
    this.rows.forEach(r => set.add(r.moneda));
    return Array.from(set);
  }

  toggleMoneda(m: string): void {
    if (this.monedas.has(m)) this.monedas.delete(m);
    else this.monedas.add(m);
  }

  get monedaLabel(): string {
    const all = this.allMonedas;
    if (!this.monedas.size || this.monedas.size === all.length) return 'Todas';
    return Array.from(this.monedas).join(', ');
  }

  get filteredRows(): AgenciaSaldo[] {
    if (!this.monedas.size) return this.rows;
    return this.rows.filter(r => this.monedas.has(r.moneda));
  }

  get filteredTotales(): TotalMoneda[] {
    const map = new Map<string, TotalMoneda>();
    for (const r of this.filteredRows) {
      const entry = map.get(r.moneda);
      if (entry) {
        entry.total += r.total;
        entry.cuentas++;
      } else {
        map.set(r.moneda, { moneda: r.moneda, total: r.total, cuentas: 1 });
      }
    }
    return Array.from(map.values());
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const t = e.target as HTMLElement;
    if (!t.closest('.moneda-filter')) this.monedaDropOpen = false;
  }

  // ── Export ──

  openExport(): void {
    this.exportColumns = this.agenciaColumns.map(c => ({ ...c }));
    this.exportOpen = true;
  }

  closeExport(): void {
    this.exportOpen = false;
  }

  get selectedExportColumns(): ExportColumn[] {
    return this.exportColumns.filter(c => c.selected);
  }

  get exportData(): Record<string, unknown>[] {
    return this.filteredRows as unknown as Record<string, unknown>[];
  }

  get exportPreviewRows(): Record<string, unknown>[] {
    return this.exportData.slice(0, 10);
  }

  selectAllColumns(): void {
    this.exportColumns.forEach(c => c.selected = true);
  }

  deselectAllColumns(): void {
    this.exportColumns.forEach(c => c.selected = false);
  }

  formatCell(value: unknown, col: ExportColumn): string {
    if (value === null || value === undefined || value === '') return '—';
    if (col.format === 'number') return Number(value).toFixed(2);
    return String(value);
  }

  async exportExcel(): Promise<void> {
    const cols = this.selectedExportColumns;
    const rows = this.exportData;
    if (!cols.length || !rows.length) return;

    const now = new Date();
    const fechaLarga = now.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const hora = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const usuario = this.auth.user;
    const nombreUsuario = usuario ? `${usuario.nombre} (${usuario.login.toUpperCase()})` : '';
    const agenciaDesc = this.auth.agencia?.descripcion || 'OFICINA CENTRAL';

    const totalCols = cols.length + 1;
    const wb = new Workbook();
    const ws = wb.addWorksheet('Saldos de Agencias');

    const darkFill: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } };
    const totalFill: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };
    const hdrFontWhite: any = { bold: true, size: 9, color: { argb: 'FFFFFFFF' }, name: 'Courier New' };
    const bodyFont: any = { size: 9, name: 'Courier New' };
    const boldFont: any = { bold: true, size: 9, name: 'Courier New' };
    const thinBorder: any = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

    const logoBase64Data = LOGO_GAMBARTE_BASE64.split(',')[1];
    const logoId = wb.addImage({ base64: logoBase64Data, extension: 'png' });
    ws.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 200, height: 55 } });

    const r1 = ws.addRow(['', '', '', 'GAMBARTE BOLIVIA S.R.L.']);
    r1.font = { bold: true, size: 14, name: 'Courier New', color: { argb: 'FFE8860C' } };
    r1.height = 22;
    const r2 = ws.addRow(['', '', '', 'Casa Matriz - Calle Mercado N° 1335, Edificio América, PB Oficina 102, Zona Central.']);
    r2.font = { size: 8, name: 'Courier New' };
    const r3 = ws.addRow(['', '', '', 'Servicio al cliente: +591 68355517  |  www.gambarte.com.bo']);
    r3.font = { size: 8, name: 'Courier New' };

    ws.addRow([]);

    const titleRow = ws.addRow(['SALDOS DE AGENCIAS']);
    titleRow.font = { bold: true, size: 12, name: 'Courier New' };
    titleRow.alignment = { horizontal: 'center' };
    ws.mergeCells(ws.rowCount, 1, ws.rowCount, totalCols);

    ws.addRow([]);

    const m1 = ws.addRow([`Agencia: ${agenciaDesc}    Usuario: ${nombreUsuario}    ${fechaLarga} - ${hora}`]);
    m1.font = boldFont;
    ws.mergeCells(ws.rowCount, 1, ws.rowCount, totalCols);

    const m2 = ws.addRow([`Fecha: ${this.fecha}    Moneda: ${this.monedaLabel}`]);
    m2.font = boldFont;
    ws.mergeCells(ws.rowCount, 1, ws.rowCount, totalCols);

    ws.addRow([]);

    const secRow = ws.addRow(['DETALLE POR AGENCIA']);
    secRow.font = { bold: true, size: 10, name: 'Courier New' };
    ws.mergeCells(ws.rowCount, 1, ws.rowCount, totalCols);

    const hdrLabels = ['N°', ...cols.map(c => c.label)];
    const hdrRow = ws.addRow(hdrLabels);
    hdrRow.eachCell(cell => {
      cell.font = hdrFontWhite;
      cell.fill = darkFill;
      cell.alignment = { horizontal: 'center', wrapText: true };
      cell.border = thinBorder;
    });

    rows.forEach((row, i) => {
      const vals: any[] = [i + 1];
      cols.forEach(c => {
        const v = row[c.key];
        if (c.format === 'number') vals.push(Number(v) || 0);
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
        if (col.align === 'right') cell.alignment = { horizontal: 'right' };
      });
    });

    const totVals: any[] = [''];
    cols.forEach(c => {
      if (c.format === 'number') {
        const sum = rows.reduce((s, r) => s + (Number(r[c.key]) || 0), 0);
        totVals.push(sum);
      } else if (c.key === 'agencia') {
        totVals.push('TOTAL');
      } else {
        totVals.push('');
      }
    });
    const totRow = ws.addRow(totVals);
    totRow.eachCell((cell, ci) => {
      cell.font = boldFont;
      cell.fill = totalFill;
      cell.border = { top: { style: 'double' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      if (ci > 1) {
        const col = cols[ci - 2];
        if (col?.format === 'number') cell.numFmt = '#,##0.00';
        if (col?.align === 'right') cell.alignment = { horizontal: 'right' };
      }
    });

    ws.columns.forEach((col, i) => {
      col.width = i === 0 ? 5 : Math.max(14, (cols[i - 1]?.label.length || 10) + 4);
    });

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `saldos_agencias_${this.fecha}.xlsx`);
    this.exportOpen = false;
  }

  exportPdf(): void {
    const cols = this.selectedExportColumns;
    const rows = this.exportData;
    if (!cols.length || !rows.length) return;

    const now = new Date();
    const fechaLarga = now.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const hora = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const usuario = this.auth.user;
    const nombreUsuario = usuario ? `${usuario.nombre} (${usuario.login.toUpperCase()})` : '';
    const agenciaDesc = this.auth.agencia?.descripcion || 'OFICINA CENTRAL';

    const ths = cols.map(c =>
      `<th style="text-align:${c.align || 'center'}">${this.esc(c.label)}</th>`
    ).join('');

    const trs = rows.map((row, i) => {
      const tds = cols.map(c => {
        const v = row[c.key];
        const display = this.formatCell(v, c);
        return `<td style="text-align:${c.align || 'left'}">${this.esc(display)}</td>`;
      }).join('');
      return `<tr><td style="text-align:center">${i + 1}</td>${tds}</tr>`;
    }).join('');

    const totalTds = cols.map(c => {
      if (c.format === 'number') {
        const sum = rows.reduce((s, r) => s + (Number(r[c.key]) || 0), 0);
        return `<td style="text-align:right;font-weight:700">${sum.toFixed(2)}</td>`;
      }
      if (c.key === 'agencia') return `<td style="font-weight:700">TOTAL</td>`;
      return '<td></td>';
    }).join('');

    const html = `<!DOCTYPE html><html><head><title>Saldos de Agencias ${this.fecha}</title>
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
  .page-num { text-align: right; font-size: 9px; white-space: nowrap; }

  .report-title { font-size: 12px; font-weight: 700; text-align: center; margin: 2px 0; text-transform: uppercase; }
  .meta { font-size: 9px; margin-bottom: 8px; line-height: 1.5; }
  .meta b { font-weight: 700; }
  .section-label { font-size: 10px; font-weight: 700; margin: 12px 0 4px; text-transform: uppercase; }

  table.data { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  table.data th {
    background: #E8E8E8; font-size: 8px; font-weight: 700; text-transform: uppercase;
    padding: 4px 5px; border: 1px solid #999; text-align: center;
  }
  table.data td { padding: 3px 5px; border: 1px solid #ccc; font-size: 9px; vertical-align: top; }
  .total-row td { font-weight: 700; background: #f0f0f0; border-top: 2px solid #999; }

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
  <div class="page-num">SALDOS DE AGENCIAS<br>P&aacute;gina 1 de 1</div>
</div>

<div class="report-title">SALDOS DE AGENCIAS</div>

<div class="meta">
  <b>Agencia:</b> ${this.esc(agenciaDesc)} &nbsp;&nbsp;
  <b>Usuario:</b> ${this.esc(nombreUsuario)} &nbsp;&nbsp;
  ${this.esc(fechaLarga)} &ndash; ${hora}<br>
  <b>Fecha:</b> ${this.fecha} &nbsp;&nbsp;
  <b>Moneda:</b> ${this.esc(this.monedaLabel)}
</div>

<div class="section-label">DETALLE POR AGENCIA</div>
<table class="data">
  <thead><tr><th>N&deg;</th>${ths}</tr></thead>
  <tbody>${trs}</tbody>
  <tfoot><tr class="total-row"><td></td>${totalTds}</tr></tfoot>
</table>

<div class="gen-footer">
  <span>Generado: ${now.toLocaleString()} &mdash; ${this.esc(nombreUsuario)}</span>
  <span>CGR &mdash; Sistema de Gesti&oacute;n y Reportes</span>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
    this.exportOpen = false;
  }

  private esc(s: string): string {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
