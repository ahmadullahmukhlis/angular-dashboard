import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { map, Observable, Subject } from 'rxjs';
import { ShareHelper } from '../../helpers/SHare-helper';
import { HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ComponentService {
  private api = inject(ApiService);
  private sharehelper = inject(ShareHelper);

  getList<T>(url: string): Observable<T[]> {
    return this.api.get(url).pipe(map((res: any) => this.sharehelper.extractItems(res)));
  }
  request(method: string, url: string, data: any) {
    return this.api.request(method, url, data);
  }
  private revalidateSubject = new Subject<string | null>();
  revalidate$ = this.revalidateSubject.asObservable();

  revalidate(id: string | null) {
    this.revalidateSubject.next(id);
  }
  load(url: string, state: any): Observable<any> {
    const queryParts: string[] = [];

    const page = state.page ?? 1;
    const pageSize = state.pageSize ?? 10;
    const sortBy = state.sortBy;
    const sortDir = state.sortDir;
    const filters = state.filters && typeof state.filters === 'object' ? state.filters : {};

    // Keep the existing query shape for current Angular consumers.
    queryParts.push(`page=${page}`);
    queryParts.push(`pageSize=${pageSize}`);
    queryParts.push(`limit=${pageSize}`);

    if (sortBy) {
      queryParts.push(`sortBy=${encodeURIComponent(sortBy)}`);
      queryParts.push(`order_by=${encodeURIComponent(sortBy)}`);
    }
    if (sortDir) {
      queryParts.push(`sortDir=${encodeURIComponent(sortDir)}`);
      queryParts.push(`direction=${encodeURIComponent(sortDir)}`);
    }

    if (Object.keys(filters).length > 0) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key];

        // Ignore null / undefined / objects
        if (value === null || value === undefined || typeof value === 'object') {
          return;
        }

        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      });

      const searchValue = filters['search'];
      if (searchValue !== null && searchValue !== undefined && searchValue !== '') {
        queryParts.push(`filter=${encodeURIComponent(searchValue)}`);
      }
    }

    const separator = url.includes('?') ? '&' : '?';
    const finalUrl = `${url}${separator}${queryParts.join('&')}`;

    return this.api.get(finalUrl);
  }
}
