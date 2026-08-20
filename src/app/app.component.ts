import { Component, inject, ViewChild, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';

interface NavItem { path: string; icon: string; label: string; query?: Record<string, string>; }
interface NavGroup { area: string; icon: string; items: NavItem[]; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatSidenavModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private router = inject(Router);

  @ViewChild('sidenav') sidenav!: MatSidenav;

  isMobile = window.innerWidth < 860;
  sidenavOpened = !this.isMobile;

  groups: NavGroup[] = [
    { area: 'Dirección', icon: 'ti-building-skyscraper', items: [
      { path: '/tablero', icon: 'ti-layout-dashboard', label: 'Tablero' },
      { path: '/organigrama', icon: 'ti-sitemap', label: 'Organigrama' },
    ]},
    { area: 'Gestión de Riesgos', icon: 'ti-chart-histogram', items: [
      { path: '/riesgos', query: { riesgo: 'cambiario' }, icon: 'ti-currency-dollar', label: 'Cambiario' },
      { path: '/riesgos', query: { riesgo: 'mercado' },   icon: 'ti-chart-candle',    label: 'Mercado' },
      { path: '/riesgos', query: { riesgo: 'liquidez' },  icon: 'ti-droplet',         label: 'Liquidez' },
      { path: '/riesgos', query: { riesgo: 'operativo' }, icon: 'ti-settings-cog',    label: 'Operativo' },
    ]},
    { area: 'Cumplimiento (UIF)', icon: 'ti-shield-half', items: [
      { path: '/riesgos', query: { riesgo: 'plaft' }, icon: 'ti-shield-half', label: 'PLA/FT/FP' },
    ]},
    { area: 'Auditoría y Seguridad', icon: 'ti-clipboard-check', items: [
      { path: '/logs', icon: 'ti-clipboard-check', label: 'Logs / Bitácoras' },
      { path: '/incidencias', icon: 'ti-alert-triangle', label: 'Incidencias' },
      { path: '/riesgos', query: { riesgo: 'seguridad' }, icon: 'ti-lock', label: 'Seguridad y Trazabilidad' },
    ]},
    { area: 'Operaciones', icon: 'ti-arrows-exchange-2', items: [
      { path: '/operaciones', icon: 'ti-arrows-exchange-2', label: 'Comercial' },
      { path: '/saldos', icon: 'ti-wallet', label: 'Saldos' },
    ]},
    { area: 'Contabilidad', icon: 'ti-calculator', items: [
      { path: '/contabilidad', icon: 'ti-calculator', label: 'Arqueos de Caja' },
      { path: '/reportes-contables', icon: 'ti-report-analytics', label: 'Reportes Contables' },
      { path: '/bancos', icon: 'ti-building-bank', label: 'Bancos' },
    ]},
  ];

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

  isActive(item: NavItem): boolean {
    const url = this.router.url;
    const [path, qs] = url.split('?');
    if (item.query) {
      if (path !== item.path) return false;
      const key = Object.keys(item.query)[0];
      return (qs || '').includes(`${key}=${item.query[key]}`);
    }
    return path === item.path || path.startsWith(item.path + '/');
  }
}
