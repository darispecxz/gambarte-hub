import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { DashboardData } from '../../core/models';
import { LoadingComponent } from '../../shared/loading.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);

  preset: 'mes' | 'dia' | 'rango' = 'mes';
  fin = new Date().toISOString().slice(0, 10);
  data?: DashboardData;
  loading = false;
  error = '';

  semTxt: Record<string, string> = { ok: 'Normal', warn: 'Requiere atención', bad: 'Crítico', info: 'Monitoreado' };

  ngOnInit(): void { this.load(); }

  load(recalcular = false): void {
    this.loading = true;
    this.error = '';
    this.api.getDashboard({ preset: this.preset, fin: this.fin }, recalcular).subscribe({
      next: (d) => { this.data = d; this.loading = false; },
      error: (e) => { this.error = e?.message || 'No se pudo cargar el tablero'; this.loading = false; },
    });
  }
}
