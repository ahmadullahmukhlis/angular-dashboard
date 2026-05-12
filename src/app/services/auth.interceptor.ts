import { HttpInterceptorFn, HttpErrorResponse, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const REFRESH_RETRIED = new HttpContextToken<boolean>(() => false);

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = authService.getAccessToken();
  const isAuthRequest = /\/(login|refresh|logout)(\?|$)/.test(req.url);

  if (!token && !isAuthRequest) {
    authService.handleUnauthorized();
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          url: req.url,
        }),
    );
  }

  const attachToken = (request: typeof req, accessToken: string) =>
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

  if (token && authService.isTokenExpired(token) && !isAuthRequest) {
    return authService.refreshToken().pipe(
      switchMap((newToken) => {
        if (!newToken) {
          authService.handleUnauthorized();
          return throwError(
            () =>
              new HttpErrorResponse({
                status: 401,
                statusText: 'Unauthorized',
                url: req.url,
              }),
          );
        }
        return next(attachToken(req, newToken));
      }),
    );
  }

  const authReq = token ? attachToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthRequest && !req.context.get(REFRESH_RETRIED)) {
        return authService.refreshToken().pipe(
          switchMap((newToken) => {
            if (!newToken) {
              authService.handleUnauthorized();
              return throwError(() => error);
            }

            return next(
              attachToken(
                req.clone({
                  context: req.context.set(REFRESH_RETRIED, true),
                }),
                newToken,
              ),
            );
          }),
        );
      }

      if (error.status === 401 && !isAuthRequest) {
        authService.handleUnauthorized();
      } else if ((error.status === 401 || error.status === 403) && isAuthRequest) {
        authService.clearTokens();
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
