import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificacionService } from '../../notificacion.service';
import { Notificacion, ConteoNoLeidas, TipoNotificacion, UrgenciaNotificacion } from '../../notificacion.models';
import { timeAgo } from '../../gestion-operativa.utils';

@Component({
  selector: 'app-notificaciones-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notificaciones-tab.component.html',
  styleUrl: './notificaciones-tab.component.scss',
})
export class NotificacionesTabComponent implements OnInit, OnChanges {
  @Input({ required: true }) fecha!: string;
  @Input() version = 0;
  @Input() notiConteo: ConteoNoLeidas = { total: 0, critica: 0, alta: 0, media: 0, baja: 0 };
  @Output() navigate = new EventEmitter<{ tab: string; agenciaId?: number }>();

  private notiSvc = inject(NotificacionService);
  private router = inject(Router);

  notificaciones: Notificacion[] = [];
  notiTotal = 0;
  loading = true;
  filterTipo: TipoNotificacion | '' = '';
  filterUrgencia: UrgenciaNotificacion | '' = '';
  filterLeida: '' | '0' | '1' = '0';

  timeAgo = timeAgo;

  ngOnInit(): void {
    this.loadNotificaciones();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['fecha']?.firstChange && !changes['version']?.firstChange) {
      this.loadNotificaciones();
    }
  }

  loadNotificaciones(): void {
    this.loading = true;
    const filtros: Record<string, any> = {};
    if (this.filterTipo) filtros['tipo'] = this.filterTipo;
    if (this.filterUrgencia) filtros['urgencia'] = this.filterUrgencia;
    if (this.filterLeida !== '') filtros['leida'] = this.filterLeida;
    this.notiSvc.listar(filtros).subscribe({
      next: (d) => {
        this.notificaciones = d.items;
        this.notiTotal = d.total;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  leerNotificacion(n: Notificacion): void {
    if (!n.leida) {
      this.notiSvc.marcarLeida(n.id).subscribe({
        next: () => {
          n.leida = true;
          this.notiConteo.total = Math.max(0, this.notiConteo.total - 1);
          if (n.urgencia in this.notiConteo) {
            (this.notiConteo as any)[n.urgencia] = Math.max(0, (this.notiConteo as any)[n.urgencia] - 1);
          }
        },
      });
    }
    this.navegarNotificacion(n);
  }

  private navegarNotificacion(n: Notificacion): void {
    const agId = n.datos?.['idAgencia'] as number | undefined;

    switch (n.codigo) {
      case 'fondeo_remesas':
      case 'fondeo_sin_atender':
        this.navigate.emit({ tab: 'fondeos' });
        break;
      case 'resumen_matutino':
      case 'concentracion_efectivo':
      case 'consumo_efectivo':
        this.navigate.emit({ tab: 'consolidado', agenciaId: agId });
        break;
      case 'transferencia_inusual':
        this.navigate.emit({ tab: 'transferencias' });
        break;
      case 'cierre_tardio':
        this.navigate.emit({ tab: 'cajas' });
        break;
      case 'operacion_elevada':
      case 'cotizacion_mercado':
      case 'brecha_cotizacion':
        this.router.navigate(['/operaciones'], { queryParams: { fecha: this.fecha } });
        return;
      case 'cierre_operativo':
      case 'utilidad_diaria':
        this.router.navigate(['/reportes-operaciones'], { queryParams: { fecha: this.fecha } });
        return;
      default:
        this.navigate.emit({ tab: 'consolidado' });
        break;
    }
  }

  leerTodasNotificaciones(): void {
    const tipo = this.filterTipo || undefined;
    this.notiSvc.marcarTodasLeidas(tipo).subscribe({
      next: () => {
        this.loadNotificaciones();
        this.notiSvc.contarNoLeidas().subscribe({ next: (d) => this.notiConteo = d });
      },
    });
  }

  urgenciaPill(u: UrgenciaNotificacion): string {
    switch (u) {
      case 'critica': return 'p-bad';
      case 'alta': return 'p-warn';
      case 'media': return 'p-info';
      default: return '';
    }
  }

  urgenciaIcon(u: UrgenciaNotificacion): string {
    switch (u) {
      case 'critica': return 'ti-alert-octagon';
      case 'alta': return 'ti-alert-triangle';
      case 'media': return 'ti-info-circle';
      case 'baja': return 'ti-info-square';
      default: return 'ti-bell';
    }
  }

  tipoIcon(t: TipoNotificacion): string {
    switch (t) {
      case 'fondeo': return 'ti-arrows-transfer-down';
      case 'operacion': return 'ti-receipt';
      case 'riesgo': return 'ti-shield-exclamation';
      case 'reporte': return 'ti-report-analytics';
      case 'cumplimiento': return 'ti-gavel';
      default: return 'ti-bell';
    }
  }

  tipoLabel(t: TipoNotificacion): string {
    switch (t) {
      case 'fondeo': return 'Fondeo';
      case 'operacion': return 'Operacion';
      case 'riesgo': return 'Riesgo';
      case 'reporte': return 'Reporte';
      case 'cumplimiento': return 'Cumplimiento';
      default: return t;
    }
  }

  urgenciaLabel(u: UrgenciaNotificacion): string {
    switch (u) {
      case 'critica': return 'Critica';
      case 'alta': return 'Alta';
      case 'media': return 'Media';
      case 'baja': return 'Baja';
      default: return u;
    }
  }
}
