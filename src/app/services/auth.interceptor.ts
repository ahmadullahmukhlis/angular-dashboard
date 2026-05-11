import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

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

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
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
