// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private API_URL = 'http://localhost:8080/api'; // change to your backend

  constructor(
    private router: Router,
    private http: HttpClient,
  ) {}

  /* ============================
     TOKEN STORAGE
  ============================ */

  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  /* ============================
     LOGIN STATUS
  ============================ */

  isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      const now = Date.now() / 1000;
      return decoded.exp < now;
    } catch {
      return true;
    }
  }

  isLoggedIn(): boolean {
    const accessToken = this.getAccessToken();
    if (!accessToken) return false;

    return !this.isTokenExpired(accessToken);
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

    return this.http
      .post<any>(`${this.API_URL}/auth/refresh`, {
        refreshToken: refreshToken,
      })
      .pipe(
        tap((response) => {
          // expected: { accessToken, refreshToken }
          this.setTokens(response.accessToken, response.refreshToken);
        }),
        catchError((error) => {
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
