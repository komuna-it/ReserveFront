import { HttpErrorResponse, HttpInterceptorFn, HttpContextToken } from '@angular/common/http';

import { inject } from '@angular/core';

import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';

import { AuthService } from './authService';
import { ViewController } from '../services/view/view.controller';
import { ErrorType } from '../model/error/errorType';

const SKIP_AUTH_REFRESH = new HttpContextToken<boolean>(() => false);

let refreshRequest$: Observable<void> | null = null;

function isAuthEndpoint(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/me')
  );
}

function refreshOnce(authService: AuthService): Observable<void> {
  if (!refreshRequest$) {
    refreshRequest$ = authService.refreshToken().pipe(
      map(() => undefined),

      catchError((error) => {
        authService.handleSessionExpired();

        return throwError(() => error);
      }),

      finalize(() => {
        refreshRequest$ = null;
      }),

      shareReplay({
        bufferSize: 1,
        refCount: false,
      }),
    );
  }

  return refreshRequest$;
}

function handle403(
  error: HttpErrorResponse,
  authService: AuthService,
  viewController: ViewController,
): void {
  if (error.error?.errorType === ErrorType.USER_BANNED) {
    authService.handleUserBanned();
    viewController.showError(ErrorType.USER_BANNED);
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const viewController = inject(ViewController);

  const request = req.clone({
    withCredentials: true,
  });

  // Login, registration, refresh and logout must never
  // initiate another refresh.
  if (isAuthEndpoint(request.url)) {
    return next(request);
  }

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      // Forbidden is not the same as unauthenticated.
      if (error.status === 403) {
        handle403(error, authService, viewController);

        return throwError(() => error);
      }

      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (!authService.isAuthenticated()) {
        return throwError(() => error);
      }

      // This request has already been retried.
      if (request.context.get(SKIP_AUTH_REFRESH)) {
        authService.handleSessionExpired();

        return throwError(() => error);
      }

      return refreshOnce(authService).pipe(
        switchMap(() => {
          const retryRequest = request.clone({
            context: request.context.set(SKIP_AUTH_REFRESH, true),
            withCredentials: true,
          });

          return next(retryRequest).pipe(
            catchError((retryError: unknown) => {
              if (retryError instanceof HttpErrorResponse) {
                if (retryError.status === 401) {
                  authService.handleSessionExpired();
                }

                if (retryError.status === 403) {
                  handle403(retryError, authService, viewController);
                }
              }

              return throwError(() => retryError);
            }),
          );
        }),
      );
    }),
  );
};
