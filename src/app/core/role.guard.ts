import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export function roleGuard(...allowed: number[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const rol = auth.rol?.id_rol ?? 0;
    if (allowed.includes(rol)) return true;
    return router.createUrlTree(['/gestion-operativa']);
  };
}
