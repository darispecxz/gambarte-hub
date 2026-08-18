import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

interface SubMod {
  label: string; ic: string; route: string;
}
interface Role {
  t: string; sub?: string; ic?: string; lead?: boolean;
  mod?: string; q?: Record<string, string>; hl?: boolean;
  subMods?: SubMod[];
}
interface Nivel { nivel: string; roles: Role[]; note?: string; }

@Component({
  selector: 'app-organigrama',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './organigrama.component.html',
  styleUrl: './organigrama.component.scss',
})
export class OrganigramaComponent {
  openPopup: Role | null = null;

  constructor(private router: Router) {}

  togglePopup(r: Role, event: Event) {
    event.stopPropagation();
    this.openPopup = this.openPopup === r ? null : r;
  }

  closePopup() {
    this.openPopup = null;
  }

  goTo(route: string) {
    this.openPopup = null;
    this.router.navigateByUrl(route);
  }

  niveles: Nivel[] = [
    { nivel: 'Nivel Estratégico', roles: [
      { t: 'Asamblea de Socios', lead: true, ic: 'ti-users-group' },
    ]},
    { nivel: 'Nivel de Coordinación', roles: [
      { t: 'Comités', ic: 'ti-users' },
      { t: 'Auditoría Interna', sub: 'Auditor + Auxiliar', ic: 'ti-clipboard-check', mod: '/logs', hl: true },
      { t: 'Cumplimiento ante la UIF', sub: 'Responsable + Suplente', ic: 'ti-shield-half', mod: '/riesgos', q: { riesgo: 'plaft' }, hl: true },
      { t: 'Gestión Integral de Riesgos', sub: 'Responsable + Auxiliar', ic: 'ti-chart-histogram', mod: '/tablero', hl: true },
    ]},
    { nivel: 'Nivel Ejecutivo', roles: [
      { t: 'Gerente General', lead: true, ic: 'ti-user-star' },
      { t: 'Asesoría General', ic: 'ti-briefcase' },
      { t: 'Asesoría Legal', sub: 'Asesor + Auxiliar', ic: 'ti-scale' },
    ]},
    { nivel: 'Nivel de Apoyo Operativo', roles: [
      { t: 'Secretaría General', ic: 'ti-notebook' },
      { t: 'Asistente de Gerencia', ic: 'ti-user' },
      { t: 'Adquisiciones y Bienes', ic: 'ti-shopping-cart' },
      { t: 'Auxiliar Administrativo', ic: 'ti-file-text' },
      { t: 'Gobierno Corporativo', ic: 'ti-gavel', hl: true },
      { t: 'Seguridad de la Información', ic: 'ti-lock', mod: '/riesgos', q: { riesgo: 'seguridad' }, hl: true },
      { t: 'Seguridad Física', ic: 'ti-shield' },
    ]},
    { nivel: 'Nivel Operativo', roles: [
      { t: 'TI y Desarrollo', sub: 'Desarrollo · Infra/Redes · Calidad · Sistemas', ic: 'ti-code' },
      { t: 'Operaciones', sub: 'Punto de Reclamo · Auxiliar', ic: 'ti-arrows-exchange-2', mod: '/operaciones', hl: true },
      { t: 'Contabilidad', sub: 'Contador General · Auxiliar', ic: 'ti-calculator', hl: true, subMods: [
        { label: 'Arqueos de Caja', ic: 'ti-cash-register', route: '/contabilidad' },
        { label: 'Reportes Contables', ic: 'ti-report-analytics', route: '/reportes-contables' },
        { label: 'Bancos', ic: 'ti-building-bank', route: '/bancos' },
      ]},
      { t: 'Recursos Humanos', sub: 'Auxiliar de RR.HH.', ic: 'ti-users' },
    ]},
    { nivel: 'Agencias', note: 'Cada encargado de agencia coordina a sus cajeros', roles: [
      { t: 'Sucre', ic: 'ti-building-store', mod: '/saldos', q: { agencia: 'AGENCIA SUCRE CENTRAL' }, hl: true },
      { t: 'Cochabamba', ic: 'ti-building-store', mod: '/saldos', q: { agencia: 'AGENCIA COCHABAMBA CENTRAL' }, hl: true },
      { t: 'El Alto', ic: 'ti-building-store', mod: '/saldos', q: { agencia: 'AGENCIA 6 DE MARZO' }, hl: true },
      { t: 'Colon', ic: 'ti-building-store', mod: '/saldos', q: { agencia: 'AGENCIA COLON' }, hl: true },
      { t: 'Oruro', ic: 'ti-building-store', mod: '/saldos', q: { agencia: 'AGENCIA ORURO CENTRAL' }, hl: true },
      { t: 'Santa Cruz', ic: 'ti-building-store', mod: '/saldos', q: { agencia: 'AGENCIA SANTA CRUZ CENTRAL' }, hl: true },
      { t: 'Yapacani', ic: 'ti-building-store', mod: '/saldos', q: { agencia: 'AGENCIA YAPACANI' }, hl: true },
      { t: 'Uyuni', ic: 'ti-building-store', mod: '/saldos', q: { agencia: 'AGENCIA UYUNI' }, hl: true },
    ]},
  ];
}
