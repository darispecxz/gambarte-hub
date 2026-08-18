import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { currencyFlag, currencyName } from '../../core/currency';

interface AgencyRow {
  agencia: string;
  [currency: string]: any;
}

interface TcMap { [currency: string]: number; }

@Component({
  selector: 'app-saldos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './saldos.component.html',
  styleUrl: './saldos.component.scss',
})
export class SaldosComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  loading = false;
  error = '';

  monedas: string[] = [];
  rows: AgencyRow[] = [];
  tc: TcMap = {};

  selectedAgency: string | null = null;

  ngOnInit(): void {
    const ag = this.route.snapshot.queryParamMap.get('agencia');
    if (ag) this.selectedAgency = ag;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    const today = new Date().toISOString().slice(0, 10);
    this.api.getOperation('saldos', today, today).subscribe({
      next: (d) => {
        this.monedas = d?.monedas || [];
        this.rows = d?.rows || [];
        this.tc = d?.tc || {};
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.message || 'Error al consultar saldos';
        this.loading = false;
      },
    });
  }

  get agencies(): string[] {
    return this.rows.map((r) => r.agencia);
  }

  get displayRows(): AgencyRow[] {
    if (!this.selectedAgency) return this.rows;
    return this.rows.filter((r) => r.agencia === this.selectedAgency);
  }

  agencyShortName(name: string): string {
    return name.replace(/^AGENCIA\s+/i, '');
  }

  activeCurrencies(row: AgencyRow): string[] {
    return this.monedas.filter((m) => this.num(row[m]) !== 0);
  }

  agencyTotalUsd(row: AgencyRow): number {
    let total = 0;
    for (const m of this.monedas) {
      const val = this.num(row[m]);
      if (val === 0) continue;
      const rate = this.tc[m] || 0;
      if (m === 'USD') { total += val; }
      else if (m === 'BOB' && this.tc['USD']) { total += val / this.tc['USD']; }
      else if (rate && this.tc['USD']) { total += (val * rate) / this.tc['USD']; }
    }
    return total;
  }

  get grandTotalUsd(): number {
    return this.displayRows.reduce((sum, r) => sum + this.agencyTotalUsd(r), 0);
  }

  maxAgencyUsd(): number {
    return Math.max(1, ...this.rows.map((r) => this.agencyTotalUsd(r)));
  }

  topAgency(): AgencyRow | null {
    if (!this.rows.length) return null;
    let best = this.rows[0];
    let bestVal = this.agencyTotalUsd(best);
    for (const r of this.rows) {
      const v = this.agencyTotalUsd(r);
      if (v > bestVal) { best = r; bestVal = v; }
    }
    return best;
  }

  selectAgency(name: string | null): void {
    this.selectedAgency = this.selectedAgency === name ? null : name;
  }

  num(v: any): number { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
  flag(code: string): string { return currencyFlag(code); }
  cname(code: string): string { return currencyName(code); }

  fmt(n: number, dec = 2): string {
    return new Intl.NumberFormat('es-BO', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
  }

  fmtCompact(n: number): string {
    if (Math.abs(n) >= 1_000_000) return this.fmt(n / 1_000_000, 1) + 'M';
    if (Math.abs(n) >= 10_000) return this.fmt(n / 1_000, 1) + 'K';
    return this.fmt(n, 2);
  }

  barPct(row: AgencyRow): number {
    const max = this.maxAgencyUsd();
    return max > 0 ? (this.agencyTotalUsd(row) / max) * 100 : 0;
  }

  currencyIso(code: string): string {
    const map: Record<string, string> = {
      USD: 'US', EUR: 'EU', BOB: 'BO', BRL: 'BR', ARS: 'AR', CLP: 'CL',
      PEN: 'PE', MXN: 'MX', CAD: 'CA', GBP: 'GB', CHF: 'CH', AUD: 'AU',
      NZD: 'NZ', JPY: 'JP', CNH: 'CN', COP: 'CO',
    };
    return map[code] || code.slice(0, 2);
  }
}
