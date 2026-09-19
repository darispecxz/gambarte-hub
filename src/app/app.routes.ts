import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'gestion-operativa' },
  {
    path: 'tablero',
    canActivate: [authGuard, roleGuard(2,3)],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'organigrama',
    canActivate: [authGuard, roleGuard(2,3)],
    loadComponent: () => import('./features/organigrama/organigrama.component').then(m => m.OrganigramaComponent),
  },
  {
    path: 'riesgos',
    canActivate: [authGuard, roleGuard(2,3,5,13)],
    loadComponent: () => import('./features/risks/risks.component').then(m => m.RisksComponent),
  },
  {
    path: 'logs',
    canActivate: [authGuard, roleGuard(2,3,10)],
    loadComponent: () => import('./features/logs/logs.component').then(m => m.LogsComponent),
  },
  {
    path: 'operaciones',
    canActivate: [authGuard, roleGuard(1,2,3,5,7,8,9,10,12,13)],
    loadComponent: () => import('./features/operations/operations.component').then(m => m.OperationsComponent),
  },
  { path: 'saldos', redirectTo: 'gestion-operativa?tab=consolidado', pathMatch: 'full' },
  {
    path: 'contabilidad',
    canActivate: [authGuard, roleGuard(1,2,3,7,8)],
    loadComponent: () => import('./features/accounting/accounting.component').then(m => m.AccountingComponent),
  },
  {
    path: 'reportes-contables',
    canActivate: [authGuard, roleGuard(2,3,7,8)],
    loadComponent: () => import('./features/acct-reports/acct-reports.component').then(m => m.AcctReportsComponent),
  },
  {
    path: 'bancos',
    canActivate: [authGuard, roleGuard(2,3,7,8)],
    loadComponent: () => import('./features/banking/banking.component').then(m => m.BankingComponent),
  },
  {
    path: 'reportes-operaciones',
    canActivate: [authGuard, roleGuard(1,2,3,5,7,8,9,10,12,13)],
    loadComponent: () => import('./features/op-reports/op-reports.component').then(m => m.OpReportsComponent),
  },
  {
    path: 'gestion-operativa',
    canActivate: [authGuard, roleGuard(1,2,3,12)],
    loadComponent: () => import('./features/gestion-operativa/gestion-operativa.component').then(m => m.GestionOperativaComponent),
  },
  {
    path: 'pos-admin',
    canActivate: [authGuard, roleGuard(1,2,3,12)],
    loadComponent: () => import('./features/pos-admin/pos-admin.component').then(m => m.PosAdminComponent),
  },
  {
    path: 'incidencias',
    canActivate: [authGuard, roleGuard(2,3,10)],
    loadComponent: () => import('./features/incidencias/incidencias.component').then(m => m.IncidenciasComponent),
  },
  {
    path: 'uif',
    canActivate: [authGuard, roleGuard(2,3,5,9,11)],
    loadComponent: () => import('./features/uif/uif.component').then(m => m.UifComponent),
  },
  {
    path: 'rrhh',
    canActivate: [authGuard, roleGuard(2,3)],
    loadComponent: () => import('./features/rrhh/rrhh.component').then(m => m.RrhhComponent),
  },
  { path: '**', redirectTo: 'gestion-operativa' },
];
