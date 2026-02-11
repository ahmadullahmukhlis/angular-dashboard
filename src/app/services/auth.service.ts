import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from './api/api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Use inject() for modern DI in field initializers
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);

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

  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    this._accessToken.set(accessToken); // Update signal
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
  }

  /* ============================
     LOGIN STATUS
  ============================ */

  isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }

  /* ============================
     REFRESH TOKEN
  ============================ */

  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.logout();
      return of(null);
    }

    return this.api.post('/auth/refresh', { refreshToken }).pipe(
      tap((response: any) => {
        this.setTokens(response.accessToken, response.refreshToken);
      }),
      catchError((error) => {
        console.error('Refresh token failed:', error);
        this.logout();
        return of(null);
      }),
    );
  }

  /* ============================
     LOGOUT
  ============================ */

  logout() {
    this.clearTokens();
    this.router.navigate(['/login']);
  }
}
