import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../core/api.service';
import { RiskInfo, PeriodParams } from '../../core/models';

@Component({
  selector: 'app-risks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './risks.component.html',
  styleUrl: './risks.component.scss',
})
export class RisksComponent implements OnInit {
  private api = inject(ApiService);
  private san = inject(DomSanitizer);
  private route = inject(ActivatedRoute);

  risks: RiskInfo[] = [];
  selected = '';
  preset: 'mes' | 'dia' | 'rango' = 'mes';
  fin = new Date().toISOString().slice(0, 10);
  pdfUrl?: SafeResourceUrl;
  pdfLoading = false;
  error = '';

  ngOnInit(): void {
    this.api.getRisks().subscribe({
      next: (r) => {
        this.risks = r;
        // Reacciona a cambios de ?riesgo= (navegación desde el menú por áreas).
        this.route.queryParamMap.subscribe((qp) => {
          const q = qp.get('riesgo');
          const next = q && r.some(x => x.slug === q) ? q : (this.selected || r[0]?.slug || '');
          if (next && next !== this.selected) { this.selected = next; this.view(); }
          else if (next && !this.pdfUrl) { this.selected = next; this.view(); }
        });
      },
      error: (e) => this.error = e?.message || 'No se pudo cargar el catálogo',
    });
  }

  private period(): PeriodParams { return { preset: this.preset, fin: this.fin }; }

  select(slug: string): void { this.selected = slug; this.view(); }

  view(): void {
    this.pdfLoading = true;
    const url = this.api.riskPdfUrl(this.selected, this.period(), 'inline');
    this.pdfUrl = this.san.bypassSecurityTrustResourceUrl(url);
  }

  onPdfLoad(): void { this.pdfLoading = false; }

  iconFor(slug: string): string {
    const m: Record<string, string> = {
      cambiario: 'ti-currency-dollar', mercado: 'ti-chart-candle', liquidez: 'ti-droplet',
      operativo: 'ti-settings-cog', plaft: 'ti-shield-half', seguridad: 'ti-lock',
    };
    return m[slug] || 'ti-file-analytics';
  }

  download(): void {
    window.open(this.api.riskPdfUrl(this.selected, this.period(), 'attachment'), '_blank');
  }
}
