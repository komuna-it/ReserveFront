import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './authService';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoading()) {
    if (authService.isAdmin()) {
      return true;
    }
    return router.createUrlTree(['/']);
  }
  // if is still loading...

  return toObservable(authService.isLoading).pipe(
    filter((isLoading) => !isLoading),
    take(1),
    map(() => {
      if (authService.isAdmin()) {
        return true;
      }

      return router.createUrlTree(['/']);
    }),
  );
};
