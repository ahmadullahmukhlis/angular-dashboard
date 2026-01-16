import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { map, Observable } from 'rxjs';
import { ShareHelper } from '../../helpers/SHare-helper';

@Injectable({ providedIn: 'root' })
export class ComponentService {

  private api = inject(ApiService);
  private sharehelper = inject(ShareHelper);

  getList<T>(url: string): Observable<T[]> {
    return this.api.get(url).pipe(
      map((res: any) => this.sharehelper.extractItems(res))
    );
  }
  request(method: string, url: string, data: any) {
    return this.api.request(method, url, data);
  }
}
