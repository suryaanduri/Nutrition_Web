import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const session = inject(SessionService);
  const authService = inject(AuthService);
  const router = inject(Router);

  return session.isAuthenticated() || !!authService.getAccessToken()
    ? true
    : router.createUrlTree(['/login']);
};
