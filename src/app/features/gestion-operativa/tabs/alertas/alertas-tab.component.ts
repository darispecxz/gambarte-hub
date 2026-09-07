import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GestionOperativaService } from '../../gestion-operativa.service';
import { AlertaAgencia } from '../../gestion-operativa.models';
import { fmt, alertPill, alertIcon, alertLabel } from '../../gestion-operativa.utils';

@Component({
  selector: 'app-alertas-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alertas-tab.component.html',
  styleUrl: './alertas-tab.component.scss',
})
export class AlertasTabComponent implements OnInit, OnChanges {
  @Input({ required: true }) fecha!: string;
  @Input() version = 0;

  private svc = inject(GestionOperativaService);

  alertas: AlertaAgencia[] = [];
  loading = true;
  error = '';

  fmt = fmt;
  alertPill = alertPill;
  alertIcon = alertIcon;
  alertLabel = alertLabel;

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
    this.svc.getAlertas(this.fecha).subscribe({
      next: (d) => { this.alertas = d; this.loading = false; },
      error: (e) => { this.error = e.message || 'Error al cargar alertas'; this.loading = false; },
    });
  }
}
