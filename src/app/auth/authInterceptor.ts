import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject, Injector, isDevMode } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from './authService';
import { ErrorResponse } from '../model/error/errorResponse';
import { ErrorType } from '../model/error/errorType';
import { ReservationStore } from '../components/reservation/reservation.store';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<boolean | null>(null);

// ============================================================================
// MAIN INTERCEPTOR
// ============================================================================

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => handleHttpError(error, req, next, injector)),
  );
};

// ============================================================================
// ERROR DISPATCHER & HANDLERS
// ============================================================================

function handleHttpError(
  error: HttpErrorResponse,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  injector: Injector,
): Observable<any> {
  if (error.status === 403) {
    handle403Forbidden(error, injector);
  }

  if (error.status === 401 && !isAuthEndpoint(req.url)) {
    const authService = injector.get(AuthService);
    return handle401Unauthorized(req, next, authService, error);
  }

  return throwError(() => error);
}

function handle403Forbidden(error: HttpErrorResponse, injector: Injector): void {
  const errorBody = error.error as ErrorResponse;

  if (errorBody?.errorType === ErrorType.USER_BANNED) {
    const authService = injector.get(AuthService);
    const store = injector.get(ReservationStore);

    authService.handleUserBanned?.(errorBody.message);
    store.globalErrorKey.set(ErrorType.USER_BANNED);
  }
}

function isAuthEndpoint(url: string): boolean {
  return (
    url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register')
  );
}

// ============================================================================
// 401 REFRESH TOKEN PIPELINE
// ============================================================================

function handle401Unauthorized(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  originalError: HttpErrorResponse,
): Observable<any> {
  if (isDevMode()) {
    console.info('Catched 401 unauthorized, trying to refresh acess token...');
  }
  if (isRefreshing) {
    return waitForTokenRefresh(req, next, originalError);
  }

  return executeTokenRefresh(req, next, authService);
}

function executeTokenRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
): Observable<any> {
  isRefreshing = true;
  refreshTokenSubject.next(null);
  console.log('refreshing access token...');
  return authService.refreshToken().pipe(
    switchMap(() => {
      isRefreshing = false;
      refreshTokenSubject.next(true);
      return next(req);
    }),
    catchError((refreshErr) => {
      isRefreshing = false;
      console.error('failed to refresh access token');
      refreshTokenSubject.next(false);
      authService.handleSessionExpired();
      return throwError(() => refreshErr);
    }),
  );
}

function waitForTokenRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  originalError: HttpErrorResponse,
): Observable<any> {
  return refreshTokenSubject.pipe(
    filter((result) => result !== null),
    take(1),
    switchMap((success) => (success ? next(req) : throwError(() => originalError))),
  );
}
