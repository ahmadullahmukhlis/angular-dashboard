import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);

  private BASE_URL = 'https://jsonplaceholder.typicode.com/'; // 🔥 change to your backend

  private getHeaders() {
    const token = localStorage.getItem('token'); // or from auth service

    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  get<T>(url: string): Observable<T> {
    return this.http.get<T>(`${this.BASE_URL}${url}`, {
      headers: this.getHeaders(),
    });
  }

  post<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.BASE_URL}${url}`, body, {
      headers: this.getHeaders(),
    });
  }

  put<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.BASE_URL}${url}`, body, {
      headers: this.getHeaders(),
    });
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(`${this.BASE_URL}${url}`, {
      headers: this.getHeaders(),
    });
  }
}
