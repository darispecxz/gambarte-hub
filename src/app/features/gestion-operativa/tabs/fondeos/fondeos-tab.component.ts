import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GestionOperativaService } from '../../gestion-operativa.service';
import { Recomendacion, FondeoRemesa, SolicitudCajero } from '../../gestion-operativa.models';
import { fmt } from '../../gestion-operativa.utils';

@Component({
  selector: 'app-fondeos-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fondeos-tab.component.html',
  styleUrl: './fondeos-tab.component.scss',
})
export class FondeosTabComponent implements OnInit, OnChanges {
  @Input({ required: true }) fecha!: string;
  @Input() version = 0;

  private svc = inject(GestionOperativaService);

  recomendaciones: Recomendacion[] = [];
  fondeoRemesas: FondeoRemesa[] = [];
  solicitudes: SolicitudCajero[] = [];
  loading = true;
  error = '';

  fmt = fmt;

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
    let pending = 2;
    const done = () => { if (--pending === 0) this.loading = false; };

    this.svc.getRecomendaciones(this.fecha).subscribe({
      next: (d) => { this.recomendaciones = d.porLimites; this.fondeoRemesas = d.porRemesas; done(); },
      error: (e) => { this.error = e.message || 'Error al cargar recomendaciones'; done(); },
    });
    this.svc.getSolicitudes().subscribe({
      next: (d) => { this.solicitudes = d; done(); },
      error: (e) => { this.error = e.message || 'Error al cargar solicitudes'; done(); },
    });
  }
}
