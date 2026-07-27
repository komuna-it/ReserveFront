import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from './authService';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<boolean | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);

  let clonedReq = req.clone({ withCredentials: true });

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const name = 'XSRF-TOKEN';
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
    const xsrfToken = match ? decodeURIComponent(match[2]) : null;

    if (xsrfToken) {
      clonedReq = clonedReq.clone({
        headers: clonedReq.headers.set('X-XSRF-TOKEN', xsrfToken),
      });
    }
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
          return throwError(() => error);
        }

        const authService = injector.get(AuthService);
        return handle401Error(clonedReq, next, authService, error);
      }

      return throwError(() => error);
    }),
  );
};

function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  originalError: HttpErrorResponse,
): Observable<any> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap(() => {
        isRefreshing = false;
        refreshTokenSubject.next(true);
        return next(req);
      }),
      catchError((refreshErr) => {
        isRefreshing = false;
        refreshTokenSubject.next(false);

        authService.handleSessionExpired();
        return throwError(() => refreshErr);
      }),
    );
  } else {
    return refreshTokenSubject.pipe(
      filter((result) => result !== null),
      take(1),
      switchMap((success) => {
        if (success) {
          return next(req);
        }
        return throwError(() => originalError);
      }),
    );
  }
}
