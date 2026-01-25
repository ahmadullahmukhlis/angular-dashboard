// src/app/pages/login/login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.html'
})
export class Login {

  username = '';
  password = '';

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}

  login() {
    this.http.post<{ token: string }>('http://localhost:8080/api/auth/login', {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.authService.setToken(res.token);
        this.router.navigate(['/dashboard']); // redirect after login
      },
      error: (err) => {
        alert('Invalid credentials');
      }
    });
  }
}
