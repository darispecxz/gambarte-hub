import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { ApiService } from '../../core/api.service';
import { LoadingComponent } from '../../shared/loading.component';
import { currencyFlag, currencyName } from '../../core/currency';

@Component({
  selector: 'app-operations',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
  templateUrl: './operations.component.html',
  styleUrl: './operations.component.scss',
})
export class OperationsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);

  @ViewChild('cotizCanvas') cotizCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('horasCanvas') horasCanvas?: ElementRef<HTMLCanvasElement>;

  // Por defecto: solo el día de hoy (el usuario puede ampliar el rango).
  dateFrom = new Date().toISOString().slice(0, 10);
  dateTo = new Date().toISOString().slice(0, 10);

  started = false;   // ya se disparó al menos una carga (muestra la estructura)
  error = '';
  // banderas de "listo" por sección (carga progresiva)
  ready: Record<string, boolean> = {};

  operativo: any[] = []; utilidades: any[] = []; agencias: any[] = [];
  cajeros: any[] = []; precios: any[] = []; cotizaciones: any[] = [];
  horas: any[] = []; tendencias: any[] = []; live: any = null; comparativo: any = null;

  totalOps = 0; totalVol = 0; utilTotal = 0;
  topMoneda = '—'; topMonedaUtil = 0;
  topAgencia = '—'; topAgenciaOps = 0;
  opsHoy = 0; deltaOps: number | null = null;

  porMoneda: any[] = []; maxVol = 1;
  monedas: string[] = []; selMoneda = '';

  private cotizChart?: Chart;
  private horasChart?: Chart;

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.cotizChart?.destroy(); this.horasChart?.destroy(); }

  get loadingAny(): boolean {
    return ['kpi', 'cotiz', 'horas', 'tend', 'moneda', 'cajeros', 'precios'].some((k) => this.ready[k] === false);
  }

  load(): void {
    this.started = true;
    this.error = '';
    const from = this.dateFrom, to = this.dateTo;
    // marca todas las secciones como "cargando"
    for (const k of ['kpi', 'cotiz', 'horas', 'tend', 'moneda', 'cajeros', 'precios']) this.ready[k] = false;

    const fail = (e: any) => { if (!this.error) this.error = e?.message || 'Error al consultar operaciones'; };

    // KPIs (varias acciones; el bloque KPI se marca listo cuando llegan las 5)
    let kpiPend = 5;
    const kpiDone = () => { if (--kpiPend <= 0) this.ready['kpi'] = true; this.computeKpis(); };
    this.api.getOperation('operativo', from, to).subscribe({ next: (d) => { this.operativo = d || []; this.computeMoneda(); this.ready['moneda'] = true; kpiDone(); }, error: (e) => { fail(e); kpiDone(); } });
    this.api.getOperation('utilidades', from, to).subscribe({ next: (d) => { this.utilidades = d || []; this.computeMoneda(); kpiDone(); }, error: (e) => { fail(e); kpiDone(); } });
    this.api.getOperation('agencias', from, to).subscribe({ next: (d) => { this.agencias = d || []; kpiDone(); }, error: (e) => { fail(e); kpiDone(); } });
    this.api.getOperation('live', from, to).subscribe({ next: (d) => { this.live = d; kpiDone(); }, error: (e) => { fail(e); kpiDone(); } });
    this.api.getOperation('comparativo', from, to).subscribe({ next: (d) => { this.comparativo = d; kpiDone(); }, error: (e) => { fail(e); kpiDone(); } });

    // Charts
    this.api.getOperation('cotizaciones', from, to).subscribe({
      next: (d) => { this.cotizaciones = d || []; this.buildMonedas(); this.ready['cotiz'] = true; setTimeout(() => this.buildCotiz(), 0); },
      error: (e) => { fail(e); this.ready['cotiz'] = true; },
    });
    this.api.getOperation('horas', from, to).subscribe({
      next: (d) => { this.horas = d || []; this.ready['horas'] = true; setTimeout(() => this.buildHoras(), 0); },
      error: (e) => { fail(e); this.ready['horas'] = true; },
    });

    // Tablas
    this.api.getOperation('tendencias', from, to).subscribe({ next: (d) => { this.tendencias = d || []; this.ready['tend'] = true; }, error: (e) => { fail(e); this.ready['tend'] = true; } });
    this.api.getOperation('cajeros', from, to).subscribe({ next: (d) => { this.cajeros = d || []; this.ready['cajeros'] = true; }, error: (e) => { fail(e); this.ready['cajeros'] = true; } });
    this.api.getOperation('precios', from, to).subscribe({ next: (d) => { this.precios = d || []; this.ready['precios'] = true; }, error: (e) => { fail(e); this.ready['precios'] = true; } });
  }

  num(v: any): number { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

  private computeKpis(): void {
    this.totalOps = 0; this.totalVol = 0;
    for (const o of this.operativo) { this.totalOps += this.num(o.ops_compra) + this.num(o.ops_venta); this.totalVol += this.num(o.vol_compra) + this.num(o.vol_venta); }
    this.utilTotal = 0; this.topMoneda = '—'; this.topMonedaUtil = -Infinity;
    for (const u of this.utilidades) { const t = this.num(u.util_total); this.utilTotal += t; if (t > this.topMonedaUtil) { this.topMonedaUtil = t; this.topMoneda = u.moneda; } }
    if (this.topMonedaUtil === -Infinity) this.topMonedaUtil = 0;
    const agMap: Record<string, number> = {};
    for (const a of this.agencias) agMap[a.agencia] = (agMap[a.agencia] || 0) + this.num(a.ops_compra) + this.num(a.ops_venta);
    this.topAgencia = '—'; this.topAgenciaOps = 0;
    for (const k of Object.keys(agMap)) if (agMap[k] > this.topAgenciaOps) { this.topAgenciaOps = agMap[k]; this.topAgencia = k; }
    this.opsHoy = this.live ? this.num(this.live.total_ops ?? this.live.total ?? this.live.ops ?? 0) : 0;
    this.deltaOps = null;
    const a = this.comparativo?.actual, b = this.comparativo?.anterior;
    if (a && b) { const act = this.num(a.total_ops), ant = this.num(b.total_ops); if (ant > 0) this.deltaOps = ((act - ant) / ant) * 100; }
  }

  private computeMoneda(): void {
    const map: Record<string, any> = {};
    for (const o of this.operativo) map[o.moneda] = { moneda: o.moneda, ops: this.num(o.ops_compra) + this.num(o.ops_venta), vol: this.num(o.vol_compra) + this.num(o.vol_venta), util: 0 };
    for (const u of this.utilidades) { if (!map[u.moneda]) map[u.moneda] = { moneda: u.moneda, ops: 0, vol: this.num(u.vol_total), util: 0 }; map[u.moneda].util = this.num(u.util_total); }
    this.porMoneda = Object.values(map).sort((x: any, y: any) => y.vol - x.vol);
    this.maxVol = Math.max(1, ...this.porMoneda.map((m: any) => m.vol));
  }

  private buildMonedas(): void {
    this.monedas = Array.from(new Set(this.cotizaciones.map((c: any) => c.moneda))).filter(Boolean) as string[];
    if (!this.selMoneda || !this.monedas.includes(this.selMoneda)) this.selMoneda = this.monedas.includes('USD') ? 'USD' : (this.monedas[0] || '');
  }

  onMonedaChange(): void { this.buildCotiz(); }

  private buildCotiz(): void {
    if (!this.cotizCanvas) return;
    this.cotizChart?.destroy();
    const rows = this.cotizaciones.filter((c: any) => c.moneda === this.selMoneda);
    const tipos = Array.from(new Set(rows.map((r: any) => String(r.tipo))));
    const fechas = Array.from(new Set(rows.map((r: any) => String(r.fecha)))).sort();
    const colors = ['#F5820A', '#1F5FA6', '#12A150', '#E5484D'];
    const datasets = tipos.map((tipo, i) => {
      const byFecha: Record<string, number[]> = {};
      for (const r of rows) if (String(r.tipo) === tipo) (byFecha[String(r.fecha)] ||= []).push(this.num(r.promedio));
      const data = fechas.map((f) => { const arr = byFecha[f]; return arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null; });
      return { label: this.tipoLabel(tipo), data, borderColor: colors[i % colors.length], backgroundColor: colors[i % colors.length] + '18', borderWidth: 2, tension: .35, pointRadius: 0, pointHoverRadius: 4, fill: true, spanGaps: true };
    });
    this.cotizChart = new Chart(this.cotizCanvas.nativeElement, {
      type: 'line', data: { labels: fechas.map((f) => f.slice(5)), datasets },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 12 } }, y: { grid: { color: '#EFF1F5' }, ticks: { font: { size: 10 } } } } },
    });
  }

  private buildHoras(): void {
    if (!this.horasCanvas) return;
    this.horasChart?.destroy();
    const compras: Record<number, number> = {}, ventas: Record<number, number> = {};
    for (const h of this.horas) { const hr = parseInt(h.hora, 10); compras[hr] = (compras[hr] || 0) + this.num(h.compras); ventas[hr] = (ventas[hr] || 0) + this.num(h.ventas); }
    const horas = Object.keys({ ...compras, ...ventas }).map(Number).sort((a, b) => a - b);
    this.horasChart = new Chart(this.horasCanvas.nativeElement, {
      type: 'bar',
      data: { labels: horas.map((h) => `${String(h).padStart(2, '0')}h`), datasets: [
        { label: 'Compras', data: horas.map((h) => compras[h] || 0), backgroundColor: '#F5820A', borderRadius: 4, stack: 's' },
        { label: 'Ventas', data: horas.map((h) => ventas[h] || 0), backgroundColor: '#1F5FA6', borderRadius: 4, stack: 's' } ] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }, scales: { x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } }, y: { stacked: true, grid: { color: '#EFF1F5' }, ticks: { font: { size: 10 } } } } },
    });
  }

  private tipoLabel(t: string): string { if (t === '1' || /compra/i.test(t)) return 'Compra'; if (t === '2' || /venta/i.test(t)) return 'Venta'; return t; }

  flag(code: string): string { return currencyFlag(code); }
  cname(code: string): string { return currencyName(code); }
  signalClass(s: any): string { const v = String(s || '').toLowerCase(); if (v.includes('compra') || v.includes('alza') || v.includes('sube')) return 'p-ok'; if (v.includes('venta') || v.includes('baja')) return 'p-bad'; return 'p-info'; }
  fmt(n: any, dec = 0): string { return new Intl.NumberFormat('es-BO', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(this.num(n)); }
  pct(n: any): string { return this.num(n).toFixed(2) + '%'; }
}
