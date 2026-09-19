import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
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
import { GastosTabComponent } from './tabs/gastos/gastos-tab.component';
import { SaldosTabComponent } from './tabs/saldos/saldos-tab.component';
import { SaldosAgenciasTabComponent } from './tabs/saldos-agencias/saldos-agencias-tab.component';
import { FallasTabComponent } from './tabs/fallas/fallas-tab.component';

type TabId = 'resumen' | 'consolidado' | 'cajas' | 'rendimiento' | 'alertas' | 'fondeos' | 'transferencias' | 'notificaciones' | 'conciliacion' | 'movimientos' | 'cotizaciones' | 'gastos' | 'saldos' | 'saldos-agencias' | 'fallas';

interface TabMeta { label: string; icon: string; desc: string; }

const TAB_META: Record<TabId, TabMeta> = {
  resumen:         { label: 'Resumen',          icon: 'ti-dashboard',              desc: 'Vista general de indicadores clave y cotizaciones.' },
  consolidado:     { label: 'Consolidado',       icon: 'ti-table',                  desc: 'Saldos consolidados por agencia, moneda y categoría.' },
  cajas:           { label: 'Cajas y Cajeros',   icon: 'ti-device-desktop-analytics', desc: 'Estado de cajas abiertas, saldos por cajero y solicitudes pendientes.' },
  conciliacion:    { label: 'Conciliación',      icon: 'ti-checklist',              desc: 'Conciliación de remesas pagadas vs pendientes por agencia.' },
  movimientos:     { label: 'Movimientos',       icon: 'ti-activity',               desc: 'Resumen de operaciones del día por agencia: cambios, giros, remesas y depósitos.' },
  cotizaciones:    { label: 'Cotizaciones',      icon: 'ti-currency-dollar',        desc: 'Tipos de cambio vigentes por agencia y moneda.' },
  fondeos:         { label: 'Fondeos',           icon: 'ti-arrows-transfer-down',   desc: 'Recomendaciones de fondeo por límites y necesidades de remesas.' },
  alertas:         { label: 'Alertas',           icon: 'ti-bell-ringing',           desc: 'Alertas activas: saldos fuera de rango y agencias sin apertura.' },
  transferencias:  { label: 'Transferencias',    icon: 'ti-transfer-vertical',      desc: 'Transferencias de bóveda entre agencias y solicitudes de cajeros.' },
  rendimiento:     { label: 'Rendimiento',       icon: 'ti-chart-bar',              desc: 'Productividad de cajeros: operaciones por hora y distribución de actividad.' },
  notificaciones:  { label: 'Notificaciones',    icon: 'ti-bell',                   desc: 'Centro de notificaciones del sistema y alertas recientes.' },
  gastos:          { label: 'Gastos',             icon: 'ti-coin',                   desc: 'Gastos operativos del mes: acumulado diario, categorías y distribución por agencia.' },
  saldos:              { label: 'Saldos Bancarios',    icon: 'ti-building-bank',          desc: 'Saldos operativos de cuentas bancarias y estado de operación.' },
  'saldos-agencias':   { label: 'Saldos de Agencias',  icon: 'ti-building-store',         desc: 'Saldos operativos por agencia: efectivo, bóveda y bancos.' },
  fallas:              { label: 'Diferencias de Caja', icon: 'ti-alert-octagon',          desc: 'Faltantes y sobrantes detectados en cierres de caja.' },
};

@Component({
  selector: 'app-gestion-operativa',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ConsolidadoTabComponent, CajasTabComponent, AlertasTabComponent,
    FondeosTabComponent, TransferenciasTabComponent, RendimientoTabComponent,
    ConciliacionTabComponent, MovimientosTabComponent, CotizacionesTabComponent,
    NotificacionesTabComponent, GastosTabComponent, SaldosTabComponent, SaldosAgenciasTabComponent,
    FallasTabComponent,
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

  lastRefresh: Date = new Date();

  tabVersion = 0;

  fmtCompact = fmtCompact;
  fmt = fmt;

  private static readonly VALID_TABS: TabId[] = [
    'resumen', 'consolidado', 'cajas', 'rendimiento', 'alertas', 'fondeos',
    'transferencias', 'notificaciones', 'conciliacion', 'movimientos', 'cotizaciones', 'gastos', 'saldos', 'saldos-agencias', 'fallas',
  ];

  ngOnInit(): void {
    this.qpSub = this.route.queryParams.subscribe(params => {
      const tab = params['tab'] as TabId;
      if (tab && GestionOperativaComponent.VALID_TABS.includes(tab)) {
        this.activeTab = tab;
      }
    });
    this.load();
  }

  ngOnDestroy(): void {
    this.qpSub?.unsubscribe();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.resumen = null;
    this.svc.getConsolidado(this.fecha).subscribe({
      next: (data) => {
        this.consolidado = data;
        this.loading = false;
        this.lastRefresh = new Date();
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

  get tabMeta(): TabMeta { return TAB_META[this.activeTab]; }

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
