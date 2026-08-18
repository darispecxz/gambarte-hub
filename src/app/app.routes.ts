import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tablero' },
  {
    path: 'tablero',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'organigrama',
    loadComponent: () => import('./features/organigrama/organigrama.component').then(m => m.OrganigramaComponent),
  },
  {
    path: 'riesgos',
    loadComponent: () => import('./features/risks/risks.component').then(m => m.RisksComponent),
  },
  {
    path: 'logs',
    loadComponent: () => import('./features/logs/logs.component').then(m => m.LogsComponent),
  },
  {
    path: 'operaciones',
    loadComponent: () => import('./features/operations/operations.component').then(m => m.OperationsComponent),
  },
  {
    path: 'saldos',
    loadComponent: () => import('./features/saldos/saldos.component').then(m => m.SaldosComponent),
  },
  {
    path: 'contabilidad',
    loadComponent: () => import('./features/accounting/accounting.component').then(m => m.AccountingComponent),
  },
  {
    path: 'reportes-contables',
    loadComponent: () => import('./features/acct-reports/acct-reports.component').then(m => m.AcctReportsComponent),
  },
  {
    path: 'bancos',
    loadComponent: () => import('./features/banking/banking.component').then(m => m.BankingComponent),
  },
  { path: '**', redirectTo: 'tablero' },
];
