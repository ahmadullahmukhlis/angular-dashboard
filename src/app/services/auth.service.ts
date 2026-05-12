import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { Observable, of } from 'rxjs';
import { tap, catchError, finalize, map, shareReplay } from 'rxjs/operators';
import { ClientContextService } from './client-context.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Use inject() for modern DI in field initializers
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly clientContext = inject(ClientContextService);
  private isRedirectingToLogin = false;
  private refreshRequest$: Observable<string | null> | null = null;

  // Signal to track the current token state reactively
  private readonly _accessToken = signal<string | null>(localStorage.getItem('accessToken'));

  /**
   * Computed signal to check if the user is logged in.
   * Components can use authService.isLoggedIn() reactively.
   */
  readonly isLoggedIn = computed(() => {
    const token = this._accessToken();
    return !!token && !this.isTokenExpired(token);
  });

  /* ============================
     TOKEN STORAGE
  ============================ */

  setTokens(accessToken: string, refreshToken?: string | null) {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    this._accessToken.set(accessToken); // Update signal
    this.isRedirectingToLogin = false;
  }

  getAccessToken(): string | null {
    return this._accessToken();
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this._accessToken.set(null);
    this.clientContext.clearContext();
  }

  /* ============================
     LOGIN STATUS
  ============================ */

  isTokenExpired(token: string): boolean {
    // Some backends return opaque bearer tokens instead of JWTs.
    // If the token is not a JWT, treat its presence as a valid logged-in state.
    if (!this.isJwtToken(token)) {
      return false;
    }

    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }

  private isJwtToken(token: string): boolean {
    return token.split('.').length === 3;
  }

  /* ============================
     REFRESH TOKEN
  ============================ */

  refreshToken(): Observable<string | null> {
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    const refreshToken = this.getRefreshToken();
    const clientId = this.clientContext.getClientId();
    const clientAssertion = this.clientContext.getClientAssertion();

    if (!refreshToken) {
      this.logout();
      return of(null);
    }

    const params = { refreshToken };
    this.refreshRequest$ = this.http
      .post<any>(`${import.meta.env.NG_APP_LOGIN_URL}/refresh`, null, {
        params,
        headers: {
          'X-Client-Id': clientId ?? '',
          'X-Client-Assertion': clientAssertion ?? '',
        },
      })
      .pipe(
        map((res: any) => {
          const data = res?.data ?? res;
          if (data?.accessToken) {
            this.setTokens(data.accessToken, data?.refreshToken ?? refreshToken);
            return data.accessToken as string;
          }
          return null;
        }),
        catchError((error) => {
          console.error('Refresh token failed:', error);
          this.logout();
          return of(null);
        }),
        finalize(() => {
          this.refreshRequest$ = null;
        }),
        shareReplay(1),
      );

    return this.refreshRequest$;
  }

  /* ============================
     LOGOUT
  ============================ */

  logout() {
    const refreshToken = this.getRefreshToken();
    const clientId = this.clientContext.getClientId();
    const clientAssertion = this.clientContext.getClientAssertion();

    if (refreshToken && clientId && clientAssertion) {
      this.http
        .post<any>(`${import.meta.env.NG_APP_LOGIN_URL}/logout`, null, {
          params: { refreshToken },
          headers: {
            'X-Client-Id': clientId,
            'X-Client-Assertion': clientAssertion,
          },
        })
        .subscribe({
          complete: () => {
            this.clearTokens();
            this.router.navigate(['/login']);
          },
          error: () => {
            this.clearTokens();
            this.router.navigate(['/login']);
          },
        });
      return;
    }

    this.clearTokens();
    this.redirectToLogin();
  }

  handleUnauthorized(): void {
    this.clearTokens();
    this.redirectToLogin();
  }

  private redirectToLogin(): void {
    if (this.isRedirectingToLogin) {
      return;
    }

    this.isRedirectingToLogin = true;
    void this.router.navigate(['/login']).finally(() => {
      this.isRedirectingToLogin = false;
    });
  }
}
