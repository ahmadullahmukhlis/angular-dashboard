// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private router: Router) {}

  // Save token in localStorage
  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Check if token exists and is valid
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token); // <- use jwt_decode
      const now = Date.now().valueOf();
      if (decoded.exp && decoded.exp * 1000 < now) {
        // token expired
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }
  clearToken() {
    localStorage.removeItem('token');
  }
  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
