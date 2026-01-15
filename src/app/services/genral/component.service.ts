import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ComponentService {

  private api = inject(ApiService);

  getList<T>(url: string): Observable<T[]> {
    return this.api.get(url).pipe(
      map((res: any) =>
        res?.data ??
        res?.content ??
        res?.items ??
        res??
        []
      )
    );
  }
}
