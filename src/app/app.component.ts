import { Component, inject, ViewChild, HostListener, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { AuthService } from './core/auth.service';

interface NavItem { path: string; icon: string; label: string; query?: Record<string, string>; children?: NavItem[]; mobileOnly?: boolean; section?: boolean; roles?: number[]; }
interface NavGroup { area: string; icon: string; items: NavItem[]; roles?: number[]; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatSidenavModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  auth = inject(AuthService);

  @ViewChild('sidenav') sidenav!: MatSidenav;

  isMobile = window.innerWidth < 860;
  sidenavOpened = !this.isMobile;
  expandedItems = new Set<string>();

  ngOnInit(): void {
    this.autoExpandActive();
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) this.autoExpandActive();
    });
  }

  private autoExpandActive(): void {
    for (const g of this.filteredGroups) {
      for (const item of g.items) {
        if (item.children && this.isActive(item)) {
          const key = item.path + JSON.stringify(item.query || {});
          this.expandedItems.add(key);
        }
      }
    }
  }

  groups: NavGroup[] = [
    { area: 'Dirección', icon: 'ti-building-skyscraper', roles: [2,3], items: [
      { path: '/tablero', icon: 'ti-layout-dashboard', label: 'Tablero' },
      { path: '/organigrama', icon: 'ti-sitemap', label: 'Organigrama' },
    ]},
    { area: 'Gestión de Riesgos', icon: 'ti-chart-histogram', roles: [2,3,5,13], items: [
      { path: '/riesgos', query: { riesgo: 'cambiario' }, icon: 'ti-currency-dollar', label: 'Cambiario' },
      { path: '/riesgos', query: { riesgo: 'mercado' },   icon: 'ti-chart-candle',    label: 'Mercado' },
      { path: '/riesgos', query: { riesgo: 'liquidez' },  icon: 'ti-droplet',         label: 'Liquidez' },
      { path: '/riesgos', query: { riesgo: 'operativo' }, icon: 'ti-settings-cog',    label: 'Operativo' },
    ]},
    { area: 'Cumplimiento (UIF)', icon: 'ti-shield-half', roles: [2,3,5,9,11], items: [
      { path: '/riesgos', query: { riesgo: 'plaft' }, icon: 'ti-shield-half', label: 'PLA/FT/FP' },
      { path: '/uif', icon: 'ti-file-check', label: 'Reportes UIF', children: [
        { path: '/uif', query: { tab: 'pcc' },     icon: 'ti-file-check',          label: 'Consulta PCC' },
        { path: '/uif', query: { tab: 'cambios' }, icon: 'ti-currency-dollar',     label: 'Reporte Cambios' },
        { path: '/uif', query: { tab: 'giros' },   icon: 'ti-transfer-vertical',   label: 'Reporte Giros' },
        { path: '/uif', query: { tab: 'remesas' }, icon: 'ti-world',               label: 'Reporte Remesas' },
        { path: '/uif', query: { tab: 'usuario' }, icon: 'ti-user-search',         label: 'Usuario Financiero' },
      ]},
    ]},
    { area: 'Auditoría y Seguridad', icon: 'ti-clipboard-check', roles: [2,3,10], items: [
      { path: '/logs', icon: 'ti-clipboard-check', label: 'Logs / Bitácoras' },
      { path: '/incidencias', icon: 'ti-alert-triangle', label: 'Incidencias' },
      { path: '/riesgos', query: { riesgo: 'seguridad' }, icon: 'ti-lock', label: 'Seguridad y Trazabilidad' },
    ]},
    { area: 'Operaciones', icon: 'ti-arrows-exchange-2', roles: [1,2,3,12], items: [
      { path: '/gestion-operativa', icon: 'ti-settings-cog', label: 'Administración Operativa', children: [
        { path: '/gestion-operativa', query: { tab: 'resumen' },        icon: 'ti-dashboard',              label: 'Resumen', mobileOnly: true },
        { path: '', icon: '', label: 'Posición', section: true },
        { path: '/gestion-operativa', query: { tab: 'consolidado' },    icon: 'ti-table',                  label: 'Vista General' },
        { path: '/gestion-operativa', query: { tab: 'saldos' },         icon: 'ti-building-bank',          label: 'Saldos Bancarios' },
        { path: '/gestion-operativa', query: { tab: 'saldos-agencias' },icon: 'ti-building-store',         label: 'Saldos de Agencias' },
        { path: '/gestion-operativa', query: { tab: 'cajas' },          icon: 'ti-device-desktop-analytics', label: 'Cajas y Cajeros' },
        { path: '', icon: '', label: 'Operaciones', section: true },
        { path: '/gestion-operativa', query: { tab: 'movimientos' },    icon: 'ti-activity',               label: 'Movimientos' },
        { path: '/gestion-operativa', query: { tab: 'cotizaciones' },   icon: 'ti-currency-dollar',        label: 'Cotizaciones' },
        { path: '/gestion-operativa', query: { tab: 'fondeos' },        icon: 'ti-arrows-transfer-down',   label: 'Fondeos' },
        { path: '/gestion-operativa', query: { tab: 'transferencias' }, icon: 'ti-transfer-vertical',      label: 'Transferencias' },
        { path: '', icon: '', label: 'Control', section: true },
        { path: '/gestion-operativa', query: { tab: 'conciliacion' },   icon: 'ti-checklist',              label: 'Conciliación' },
        { path: '/gestion-operativa', query: { tab: 'alertas' },        icon: 'ti-bell-ringing',           label: 'Alertas' },
        { path: '/gestion-operativa', query: { tab: 'rendimiento' },    icon: 'ti-chart-bar',              label: 'Rendimiento' },
        { path: '/gestion-operativa', query: { tab: 'fallas' },        icon: 'ti-alert-octagon',          label: 'Diferencias de Caja' },
        { path: '/gestion-operativa', query: { tab: 'gastos' },         icon: 'ti-coin',                   label: 'Gastos' },
        { path: '', icon: '', label: '', section: true },
        { path: '/gestion-operativa', query: { tab: 'notificaciones' }, icon: 'ti-bell',                   label: 'Notificaciones' },
      ]},
      { path: '/operaciones', icon: 'ti-chart-line', label: 'Comercial' },
      { path: '/reportes-operaciones', icon: 'ti-report-analytics', label: 'Reportes', roles: [1,2,3,5,7,8,9,10,12,13], children: [
        { path: '/reportes-operaciones', query: { tab: 'cambios' },      icon: 'ti-currency-dollar',     label: 'Cambios' },
        { path: '/reportes-operaciones', query: { tab: 'giros' },        icon: 'ti-transfer-vertical',   label: 'Giros Nacionales' },
        { path: '/reportes-operaciones', query: { tab: 'remesas' },      icon: 'ti-world',               label: 'Remesas / Giros Int.' },
        { path: '/reportes-operaciones', query: { tab: 'remesas_cgr' },  icon: 'ti-plane-departure',     label: 'Remesas Recibidas' },
      ]},
    ]},
    { area: 'Contabilidad', icon: 'ti-calculator', roles: [1,2,3,7,8], items: [
      { path: '/contabilidad', icon: 'ti-calculator', label: 'Arqueos de Caja', children: [
        { path: '/contabilidad', query: { tab: 'daily' },    icon: 'ti-calendar-stats',      label: 'Resumen Diario' },
        { path: '/contabilidad', query: { tab: 'cashier' },  icon: 'ti-cash-register',       label: 'Arqueos de Cajero' },
        { path: '/contabilidad', query: { tab: 'movement' }, icon: 'ti-arrows-exchange-2',   label: 'Resumen Movimientos' },
        { path: '/contabilidad', query: { tab: 'agency' },   icon: 'ti-building-store',      label: 'Cierres por Agencia' },
      ]},
      { path: '/reportes-contables', icon: 'ti-report-analytics', label: 'Reportes Contables', roles: [2,3,7,8], children: [
        { path: '/reportes-contables', query: { tab: 'balance' },      icon: 'ti-scale',          label: 'Balance Sumas y Saldos' },
        { path: '/reportes-contables', query: { tab: 'libro-mayor' },  icon: 'ti-book',           label: 'Libro Mayor' },
        { path: '/reportes-contables', query: { tab: 'comprobantes' }, icon: 'ti-file-invoice',   label: 'Comprobantes Contables' },
      ]},
      { path: '/bancos', icon: 'ti-building-bank', label: 'Bancos', roles: [2,3,7,8], children: [
        { path: '/bancos', query: { tab: 'saldos' },       icon: 'ti-wallet',             label: 'Saldos' },
        { path: '/bancos', query: { tab: 'conciliacion' }, icon: 'ti-scale',              label: 'Conciliación Contable' },
        { path: '/bancos', query: { tab: 'daily' },        icon: 'ti-calendar-stats',     label: 'Resumen Diario' },
        { path: '/bancos', query: { tab: 'movements' },    icon: 'ti-list-details',       label: 'Movimientos' },
        { path: '/bancos', query: { tab: 'transfers' },    icon: 'ti-transfer-vertical',  label: 'Traspasos' },
      ]},
    ]},
    { area: 'Recursos Humanos', icon: 'ti-users-group', roles: [2,3], items: [
      { path: '/rrhh', icon: 'ti-layout-dashboard', label: 'RRHH', children: [
        { path: '/rrhh', query: { tab: 'dashboard' },       icon: 'ti-layout-dashboard',   label: 'Dashboard' },
        { path: '/rrhh', query: { tab: 'empleados' },       icon: 'ti-users',              label: 'Empleados' },
        { path: '/rrhh', query: { tab: 'planillas' },       icon: 'ti-receipt',            label: 'Planillas' },
        { path: '/rrhh', query: { tab: 'asistencia' },      icon: 'ti-clock',              label: 'Asistencia' },
        { path: '/rrhh', query: { tab: 'vacaciones' },     icon: 'ti-beach',              label: 'Vacaciones' },
        { path: '/rrhh', query: { tab: 'liquidaciones' },   icon: 'ti-file-invoice',       label: 'Liquidaciones' },
        { path: '/rrhh', query: { tab: 'capacitaciones' },  icon: 'ti-school',             label: 'Capacitaciones' },
        { path: '/rrhh', query: { tab: 'documentos' },     icon: 'ti-file-text',          label: 'Documentos' },
        { path: '/rrhh', query: { tab: 'csbp' },            icon: 'ti-heartbeat',          label: 'CSBP' },
        { path: '/rrhh', query: { tab: 'gestoras' },        icon: 'ti-building-bank',      label: 'Gestoras AFP' },
        { path: '/rrhh', query: { tab: 'finiquitos' },      icon: 'ti-file-off',           label: 'Finiquitos' },
        { path: '/rrhh', query: { tab: 'tributaria' },      icon: 'ti-receipt-tax',        label: 'P. Tributaria' },
        { path: '/rrhh', query: { tab: 'horarios' },        icon: 'ti-calendar-time',      label: 'Horarios' },
        { path: '/rrhh', query: { tab: 'parametros' },      icon: 'ti-settings',           label: 'Parámetros' },
      ]},
    ]},
  ];

  private get userRol(): number {
    return this.auth.rol?.id_rol ?? 0;
  }

  get filteredGroups(): NavGroup[] {
    const rol = this.userRol;
    return this.groups
      .filter(g => !g.roles || g.roles.includes(rol))
      .map(g => ({
        ...g,
        items: g.items.filter(item => !item.roles || item.roles.includes(rol)),
      }))
      .filter(g => g.items.length > 0);
  }

  @HostListener('window:resize')
  onResize(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 860;
    if (wasMobile && !this.isMobile) this.sidenavOpened = true;
    if (!wasMobile && this.isMobile) this.sidenavOpened = false;
  }

  toggle(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }

  onNavClick(): void {
    if (this.isMobile) this.sidenavOpened = false;
  }

  toggleChildren(item: NavItem): void {
    const key = item.path + JSON.stringify(item.query || {});
    if (this.expandedItems.has(key)) this.expandedItems.delete(key);
    else this.expandedItems.add(key);
  }

  isExpanded(item: NavItem): boolean {
    return this.expandedItems.has(item.path + JSON.stringify(item.query || {}));
  }

  isActive(item: NavItem): boolean {
    const url = this.router.url;
    const [path, qs] = url.split('?');
    if (item.children) {
      return item.children.some(c => this.isActive(c));
    }
    if (item.query) {
      if (path !== item.path) return false;
      const key = Object.keys(item.query)[0];
      const params = new URLSearchParams(qs || '');
      return params.get(key) === item.query[key];
    }
    return path === item.path || path.startsWith(item.path + '/');
  }

  get userInitials(): string {
    const name = this.auth.user?.nombre ?? '';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts.length ? parts[0][0].toUpperCase() : '?';
  }

  get agenciaLabel(): string {
    const ag = this.auth.agencia;
    if (!ag) return '';
    return `Sucursal ${ag.descripcion}`;
  }

  logout(): void {
    this.auth.logout();
  }
}
