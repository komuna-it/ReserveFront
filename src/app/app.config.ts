import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
  withXsrfConfiguration,
} from '@angular/common/http';
import {
  provideTransloco,
  provideTranslocoTranspiler,
  DefaultTranspiler,
} from '@jsverse/transloco';
import { routes } from './app.routes';
import { TranslocoHttpLoader } from './transloco-loader';
import { authInterceptor } from './auth/authInterceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withInterceptorsFromDi(),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
    ),
    provideTransloco({
      config: {
        availableLangs: ['en', 'pl', 'ua'],
        defaultLang: 'pl',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
