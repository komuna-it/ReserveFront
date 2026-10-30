import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';

import { provideRouter, withComponentInputBinding } from '@angular/router';

import {
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
  withXsrfConfiguration,
} from '@angular/common/http';

import { provideTransloco } from '@jsverse/transloco';

import { routes } from './routes/app.routes';
import { TranslocoHttpLoader } from './transloco-loader';

import { authInterceptor } from './auth/authInterceptor';
import { credentialsInterceptor } from './auth/credentialsInterceptor';
import { AuthService } from './auth/authService';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(routes, withComponentInputBinding()),

    provideHttpClient(
      withInterceptors([authInterceptor, credentialsInterceptor]),

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

    provideAppInitializer(() => {
      return inject(AuthService).initialize();
    }),
  ],
};
