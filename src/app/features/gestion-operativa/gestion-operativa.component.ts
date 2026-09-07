import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { GestionOperativaService } from './gestion-operativa.service';
import { NotificacionService } from './notificacion.service';
import {
  Consolidado, AgenciaConsolidada,
  ResumenEjecutivo, CotizacionActual,
} from './gestion-operativa.models';
import { ConteoNoLeidas } from './notificacion.models';
import { fmtCompact, fmt } from './gestion-operativa.utils';

import { ConsolidadoTabComponent } from './tabs/consolidado/consolidado-tab.component';
import { CajasTabComponent } from './tabs/cajas/cajas-tab.component';
import { AlertasTabComponent } from './tabs/alertas/alertas-tab.component';
import { FondeosTabComponent } from './tabs/fondeos/fondeos-tab.component';
import { TransferenciasTabComponent } from './tabs/transferencias/transferencias-tab.component';
import { RendimientoTabComponent } from './tabs/rendimiento/rendimiento-tab.component';
import { ConciliacionTabComponent } from './tabs/conciliacion/conciliacion-tab.component';
import { MovimientosTabComponent } from './tabs/movimientos/movimientos-tab.component';
import { CotizacionesTabComponent } from './tabs/cotizaciones/cotizaciones-tab.component';
import { NotificacionesTabComponent } from './tabs/notificaciones/notificaciones-tab.component';

type TabId = 'resumen' | 'consolidado' | 'cajas' | 'rendimiento' | 'alertas' | 'fondeos' | 'transferencias' | 'notificaciones' | 'conciliacion' | 'movimientos' | 'cotizaciones';

@Component({
  selector: 'app-gestion-operativa',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ConsolidadoTabComponent, CajasTabComponent, AlertasTabComponent,
    FondeosTabComponent, TransferenciasTabComponent, RendimientoTabComponent,
    ConciliacionTabComponent, MovimientosTabComponent, CotizacionesTabComponent,
    NotificacionesTabComponent,
  ],
  templateUrl: './gestion-operativa.component.html',
  styleUrl: './gestion-operativa.component.scss',
})
export class GestionOperativaComponent implements OnInit, OnDestroy {
  private svc = inject(GestionOperativaService);
  private notiSvc = inject(NotificacionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private qpSub!: Subscription;

  fecha = new Date().toISOString().slice(0, 10);
  activeTab: TabId = 'consolidado';
  loading = false;
  error = '';

  consolidado: Consolidado | null = null;
  resumen: ResumenEjecutivo | null = null;
  resumenLoading = false;

  notiConteo: ConteoNoLeidas = { total: 0, critica: 0, alta: 0, media: 0, baja: 0 };

  autoRefresh = true;
  private refreshSub: Subscription | null = null;
  private readonly REFRESH_INTERVAL = 3 * 60 * 1000;
  lastRefresh: Date = new Date();

  tabVersion = 0;

  fmtCompact = fmtCompact;
  fmt = fmt;

  private static readonly VALID_TABS: TabId[] = [
    'resumen', 'consolidado', 'cajas', 'rendimiento', 'alertas', 'fondeos',
    'transferencias', 'notificaciones', 'conciliacion', 'movimientos', 'cotizaciones',
  ];

  ngOnInit(): void {
    this.qpSub = this.route.queryParams.subscribe(params => {
      const tab = params['tab'] as TabId;
      if (tab && GestionOperativaComponent.VALID_TABS.includes(tab)) {
        this.activeTab = tab;
      }
    });
    this.load();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.qpSub?.unsubscribe();
    this.stopAutoRefresh();
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    this.autoRefresh ? this.startAutoRefresh() : this.stopAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshSub = interval(this.REFRESH_INTERVAL).subscribe(() => {
      this.refreshCurrentTab();
    });
  }

  private stopAutoRefresh(): void {
    this.refreshSub?.unsubscribe();
    this.refreshSub = null;
  }

  private refreshCurrentTab(): void {
    this.lastRefresh = new Date();
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.resumen = null;
    this.svc.getConsolidado(this.fecha).subscribe({
      next: (data) => {
        this.consolidado = data;
        this.loading = false;
        this.loadSecondary();
        this.tabVersion++;
      },
      error: (e) => {
        this.error = e.message || 'Error al cargar datos';
        this.loading = false;
      },
    });
  }

  private loadSecondary(): void {
    this.notiSvc.contarNoLeidas().subscribe({ next: (d) => this.notiConteo = d });
    this.loadResumen();
  }

  private loadResumen(): void {
    this.resumenLoading = true;
    this.svc.getResumenEjecutivo(this.fecha).subscribe({
      next: (d) => { this.resumen = d; this.resumenLoading = false; },
      error: () => { this.resumenLoading = false; },
    });
  }

  setTab(tab: TabId): void {
    this.activeTab = tab;
    this.router.navigate([], { queryParams: { tab }, queryParamsHandling: 'merge' });
    this.tabVersion++;
  }

  onNotificacionNavigate(event: { tab: string; agenciaId?: number }): void {
    this.setTab(event.tab as TabId);
  }

  get totalAlertas(): number {
    if (!this.consolidado) return 0;
    return this.consolidado.agencias.reduce((sum, ag) => sum + ag.alertas.length, 0);
  }

  get kpiEfectivo(): number {
    if (!this.consolidado) return 0;
    return this.consolidado.agencias.reduce((s, ag) =>
      s + ag.monedas.reduce((sm, m) => sm + m.caja * m.tcBob, 0), 0);
  }

  get kpiBoveda(): number {
    if (!this.consolidado) return 0;
    return this.consolidado.agencias.reduce((s, ag) =>
      s + ag.monedas.reduce((sm, m) => sm + m.boveda * m.tcBob, 0), 0);
  }

  get kpiBanco(): number {
    if (!this.consolidado) return 0;
    return this.consolidado.agencias.reduce((s, ag) =>
      s + ag.monedas.reduce((sm, m) => sm + m.banco * m.tcBob, 0), 0);
  }

  tendenciaIcon(t: string): string {
    switch (t) {
      case 'alza': return 'ti-trending-up';
      case 'baja': return 'ti-trending-down';
      default: return 'ti-minus';
    }
  }

  tendenciaClass(t: string): string {
    switch (t) {
      case 'alza': return 'up';
      case 'baja': return 'down';
      default: return '';
    }
  }
}
