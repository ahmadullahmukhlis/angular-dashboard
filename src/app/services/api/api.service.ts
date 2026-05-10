import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface ApiRequestOptions {
  suppressGlobalError?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private BASE_URL = this.stripTrailingSlash(import.meta.env.NG_APP_API_URL);

  private getHeaders(isFormData: boolean = false) {
    const token = localStorage.getItem('accessToken');
    const clientId = localStorage.getItem('clientId');
    const clientAssertion = localStorage.getItem('clientAssertion');
    let headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });

    if (clientId) headers = headers.set('X-Client-Id', clientId);
    if (clientAssertion) headers = headers.set('X-Client-Assertion', clientAssertion);

    // Only add JSON content type if it's NOT FormData
    if (!isFormData) {
      headers = headers.set('Content-Type', 'application/json');
    }

    return headers;
  }
  private stripTrailingSlash(value: string): string {
    return value.replace(/\/+$/, '');
  }

  private buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.BASE_URL}${normalizedPath}`;
  }

  get<T>(url: string, params: Record<string, any> = {}, _options: ApiRequestOptions = {}): Observable<T> {
    return this.http.get<T>(this.buildUrl(url), {
      headers: this.getHeaders(),
      params: params,
    });
  }

  post<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(this.buildUrl(url), body, {
      headers: this.getHeaders(),
    });
  }

  put<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(this.buildUrl(url), body, {
      headers: this.getHeaders(),
    });
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(this.buildUrl(url), {
      headers: this.getHeaders(),
    });
  }
  request<T>(method: string, url: string, body: any): Observable<HttpEvent<T>> {
    const isFormData = body instanceof FormData;

    return this.http.request<T>(method, this.buildUrl(url), {
      body: body,
      headers: this.getHeaders(isFormData),
      observe: 'events', // Required for progress bars
      reportProgress: true, // Required for progress bars
    });
  }
}
