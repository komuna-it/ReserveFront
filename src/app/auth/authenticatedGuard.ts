import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './authService';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const authenticatedGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('AuthenticatedGuard: Checking authentication for route:', state.url);

  if (!authService.isLoading()) {
    if (authService.isAuthenticated()) {
      return true;
    }
    console.log('AuthenticatedGuard: User is not authenticated. Redirecting to login page.');
    return router.createUrlTree(['/login']);
  }

  return toObservable(authService.isLoading).pipe(
    filter((isLoading) => !isLoading),
    take(1),
    map(() => {
      console.log('AuthenticatedGuard Async: Current user:', authService.currentUser());
      console.log('AuthenticatedGuard Async: Is authenticated:', authService.isAuthenticated());

      if (authService.isAuthenticated()) {
        return true;
      }

      console.log(
        'AuthenticatedGuard Async: User is not authenticated. Redirecting to login page.',
      );
      return router.createUrlTree(['/login']);
    }),
  );
};
