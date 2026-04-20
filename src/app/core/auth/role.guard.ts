import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { UserRole } from '../models/auth.models';

export const roleGuard: CanActivateFn = (route): boolean | UrlTree => {
  const session = inject(SessionService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data['roles'] as UserRole[] | undefined) ?? [];

  if (!session.isAuthenticated() && !authService.getAccessToken()) {
    return router.createUrlTree(['/login']);
  }

  return roles.length === 0 || session.hasRole(roles)
    ? true
    : router.createUrlTree(['/dashboard']);
};
