import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { ClientContextService } from '../../services/client-context.service';

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
    private clientContext: ClientContextService,
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

    this.http.post<any>(loginUrl + '/login', payload, { observe: 'response' }).subscribe({
      next: (response: HttpResponse<any>) => {
        this.isLoading = false;
        this.loginForm.enable(); // ✅ re-enable form
        const res = response.body;
        const accessToken = res?.accessToken ?? res?.data?.accessToken;
        const refreshToken = res?.refreshToken ?? res?.data?.refreshToken;
        const clientId =
          res?.clientId ??
          res?.data?.clientId ??
          response.headers.get('X-Client-Id') ??
          response.headers.get('x-client-id');
        const clientAssertion =
          res?.clientAssertion ??
          res?.data?.clientAssertion ??
          response.headers.get('X-Client-Assertion') ??
          response.headers.get('x-client-assertion');
        const user = res?.user ?? res?.data?.user ?? null;
        const resolvedUser = user
          ? {
              ...user,
              roles: Array.isArray(user?.roles) && user.roles.length > 0 ? user.roles : (res?.roles ?? res?.data?.roles ?? []),
              permissions:
                Array.isArray(user?.permissions) && user.permissions.length > 0
                  ? user.permissions
                  : (res?.permissions ?? res?.data?.permissions ?? []),
            }
          : null;

        if (!accessToken) {
          this.errorMessage = 'Invalid server response';
          alert('Login failed: No access token received');
          return;
        }

        this.authService.setTokens(accessToken, refreshToken);
        this.authService.setUserSession(resolvedUser, {
          tokenType: res?.tokenType ?? res?.data?.tokenType ?? null,
          expiresIn: res?.expiresIn ?? res?.data?.expiresIn ?? null,
          refreshExpiresIn: res?.refreshExpiresIn ?? res?.data?.refreshExpiresIn ?? null,
        });
        if (clientId && clientAssertion) {
          this.clientContext.setContext(clientId, clientAssertion);
        }
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
