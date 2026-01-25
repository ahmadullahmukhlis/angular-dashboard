import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { map, Observable } from 'rxjs';
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
    let params = new HttpParams().set('page', state.page).set('pageSize', state.pageSize);

    if (state.sortBy) params = params.set('sortBy', state.sortBy);
    if (state.sortDir) params = params.set('sortDir', state.sortDir);

    if (state.filters) {
      Object.keys(state.filters).forEach((k) => {
        if (state.filters[k] !== null && state.filters[k] !== '') {
          params = params.set(k, state.filters[k]);
        }
      });
    }

    if (state.extra) {
      Object.keys(state.extra).forEach((k) => {
        params = params.set(k, state.extra[k]);
      });
    }

    var data = this.api.get(url, { params });
    console.log(data);
    return data;
  }
}
