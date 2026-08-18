import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { LogInfo, LogData } from '../../core/models';
import { LoadingComponent } from '../../shared/loading.component';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.scss',
})
export class LogsComponent implements OnInit {
  private api = inject(ApiService);

  logs: LogInfo[] = [];
  selected = '';
  periodo = new Date().toISOString().slice(0, 7); // AAAA-MM
  data?: LogData;
  activeSheet = 0;
  loading = false;
  error = '';

  ngOnInit(): void {
    this.api.getLogs().subscribe({
      next: (l) => { this.logs = l; if (l[0]) { this.selected = l[0].code; this.load(); } },
      error: (e) => this.error = e?.message || 'No se pudo cargar el catálogo',
    });
  }

  select(code: string): void { this.selected = code; this.load(); }

  load(): void {
    if (!this.selected) return;
    this.loading = true; this.error = ''; this.activeSheet = 0;
    this.api.getLogData(this.selected, this.periodo).subscribe({
      next: (d) => { this.data = d; this.loading = false; },
      error: (e) => { this.error = e?.message || 'Error al consultar el reporte'; this.loading = false; },
    });
  }

  downloadExcel(): void { window.open(this.api.logExcelUrl(this.selected, this.periodo), '_blank'); }
  downloadZip(): void { window.open(this.api.logsZipUrl(this.periodo), '_blank'); }
}
