import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  imports: [ReactiveFormsModule],
})
export class Login implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.authService.clearTokens();
    }
  }

  login(): void {
    if (this.loginForm.invalid || this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.loginForm.disable(); // ✅ prevent double submit

    const { email, password } = this.loginForm.value;
    const loginUrl = import.meta.env.NG_APP_LOGIN_URL;
    const payload = { email, password };

    this.http.post<any>(loginUrl + '/login', payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.loginForm.enable(); // ✅ re-enable form
        const accessToken = res?.accessToken ?? res?.data?.accessToken;
        const refreshToken = res?.refreshToken ?? res?.data?.refreshToken;
 
        if (!accessToken) {
          this.errorMessage = 'Invalid server response';
          alert('Login failed: No access token received');
          return;
        }

        this.authService.setTokens(accessToken, refreshToken);
        this.router.navigate(['/dashboard']);
      },

      error: (err) => {
        this.isLoading = false;
        this.loginForm.enable(); // ✅ re-enable form
        this.errorMessage = err.error?.message || 'Server error. Try again.';
        console.error('Login error:', err);
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

}
