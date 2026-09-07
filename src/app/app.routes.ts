import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'tablero' },
  {
    path: 'tablero',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'organigrama',
    canActivate: [authGuard],
    loadComponent: () => import('./features/organigrama/organigrama.component').then(m => m.OrganigramaComponent),
  },
  {
    path: 'riesgos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/risks/risks.component').then(m => m.RisksComponent),
  },
  {
    path: 'logs',
    canActivate: [authGuard],
    loadComponent: () => import('./features/logs/logs.component').then(m => m.LogsComponent),
  },
  {
    path: 'operaciones',
    canActivate: [authGuard],
    loadComponent: () => import('./features/operations/operations.component').then(m => m.OperationsComponent),
  },
  { path: 'saldos', redirectTo: 'gestion-operativa?tab=consolidado', pathMatch: 'full' },
  {
    path: 'contabilidad',
    canActivate: [authGuard],
    loadComponent: () => import('./features/accounting/accounting.component').then(m => m.AccountingComponent),
  },
  {
    path: 'reportes-contables',
    canActivate: [authGuard],
    loadComponent: () => import('./features/acct-reports/acct-reports.component').then(m => m.AcctReportsComponent),
  },
  {
    path: 'bancos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/banking/banking.component').then(m => m.BankingComponent),
  },
  {
    path: 'reportes-operaciones',
    canActivate: [authGuard],
    loadComponent: () => import('./features/op-reports/op-reports.component').then(m => m.OpReportsComponent),
  },
  {
    path: 'gestion-operativa',
    canActivate: [authGuard],
    loadComponent: () => import('./features/gestion-operativa/gestion-operativa.component').then(m => m.GestionOperativaComponent),
  },
  {
    path: 'pos-admin',
    canActivate: [authGuard],
    loadComponent: () => import('./features/pos-admin/pos-admin.component').then(m => m.PosAdminComponent),
  },
  {
    path: 'incidencias',
    canActivate: [authGuard],
    loadComponent: () => import('./features/incidencias/incidencias.component').then(m => m.IncidenciasComponent),
  },
  {
    path: 'uif',
    canActivate: [authGuard],
    loadComponent: () => import('./features/uif/uif.component').then(m => m.UifComponent),
  },
  {
    path: 'rrhh',
    canActivate: [authGuard],
    loadComponent: () => import('./features/rrhh/rrhh.component').then(m => m.RrhhComponent),
  },
  { path: '**', redirectTo: 'tablero' },
];
