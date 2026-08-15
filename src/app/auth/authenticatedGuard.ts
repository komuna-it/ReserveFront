import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './authService';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const authenticatedGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoading()) {
    if (authService.isAuthenticated()) {
      return true;
    }
    return router.createUrlTree(['/login']);
  }

  return toObservable(authService.isLoading).pipe(
    filter((isLoading) => !isLoading),
    take(1),
    map(() => {
      if (authService.isAuthenticated()) {
        return true;
      }

      console.error(
        'AuthenticatedGuard Async: User is not authenticated. Redirecting to login page.',
      );
      return router.createUrlTree(['/login']);
    }),
  );
};
