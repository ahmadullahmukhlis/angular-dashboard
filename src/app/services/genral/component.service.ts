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
  load(
    url: string,
    state: {
      page: number;
      pageSize: number;
      sortBy?: string;
      sortDir?: string;
      filters?: any;
      extra?: any;
    },
  ): Observable<any> {
    const queryParts: string[] = [];

    // Base params
    queryParts.push(`page=${state.page}`);
    queryParts.push(`pageSize=${state.pageSize}`);

    if (state.sortBy) queryParts.push(`sortBy=${state.sortBy}`);
    if (state.sortDir) queryParts.push(`sortDir=${state.sortDir}`);

    const addParams = (obj: any) => {
      Object.keys(obj).forEach((k) => {
        const value = obj[k];
        if (value === null || value === undefined || value === '') return;

        if (Array.isArray(value)) {
          value.forEach((v) => {
            queryParts.push(`${k}=${v}`);
          });
        } else if (typeof value === 'object') {
          // if you DON'T want JSON encoding, flatten it
          Object.keys(value).forEach((innerKey) => {
            queryParts.push(`${k}.${innerKey}=${value[innerKey]}`);
          });
        } else {
          queryParts.push(`${k}=${value}`);
        }
      });
    };

    if (state.filters) addParams(state.filters);
    if (state.extra) addParams(state.extra);

    const finalUrl = queryParts.length ? `${url}?${queryParts.join('&')}` : url;

    console.log('Final URL:', finalUrl);

    return this.api.get(finalUrl); // no { params }
  }
}
