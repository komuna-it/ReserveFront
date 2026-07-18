import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // send cookies with every request to the backend (for session management)
  let clonedReq = req.clone({ withCredentials: true });

  // Add XSRF token to the request headers if it exists in cookies
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

  return next(clonedReq);
};
