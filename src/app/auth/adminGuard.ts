import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './authService';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('AdminGuard: Checking admin privileges for route:', state.url);

  if (!authService.isLoading()) {
    if (authService.isAdmin()) {
      return true;
    }
    console.log('AdminGuard: User is not an admin. Redirecting to home page.');
    return router.createUrlTree(['/']);
  }

  return toObservable(authService.isLoading).pipe(
    filter((isLoading) => !isLoading),
    take(1),
    map(() => {
      console.log('AdminGuard Async: Current user:', authService.currentUser());
      console.log('AdminGuard Async: Is admin:', authService.isAdmin());

      if (authService.isAdmin()) {
        return true;
      }

      console.log('AdminGuard Async: User is not an admin. Redirecting to home page.');
      return router.createUrlTree(['/']);
    }),
  );
};
