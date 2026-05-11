import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api/api.service';

interface RealmContextItem {
  id: number;
  name: string;
  slug: string;
  is_active?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RealmContextService {
  private readonly api = inject(ApiService);
  private readonly STORAGE_KEY = 'selectedRealmSlug';

  readonly realms = signal<RealmContextItem[]>([]);
  readonly selectedRealmSlug = signal<string>(this.readStoredRealmSlug());
  readonly isLoading = signal(false);

  loadRealms(force: boolean = false): void {
    if (this.isLoading()) return;
    if (!force && this.realms().length > 0) return;

    this.isLoading.set(true);
    this.api.get<RealmContextItem[]>('/identity/realms').subscribe({
      next: (response) => {
        const realms = Array.isArray(response) ? response : [];
        this.realms.set(realms);

        const currentSlug = this.selectedRealmSlug();
        if (!realms.some((realm) => realm.slug === currentSlug)) {
          this.setSelectedRealmSlug(realms[0]?.slug || 'default');
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.realms.set([]);
        this.setSelectedRealmSlug('default');
        this.isLoading.set(false);
      },
    });
  }

  setSelectedRealmSlug(slug: string | null | undefined): void {
    const value = String(slug || 'default').trim() || 'default';
    this.selectedRealmSlug.set(value);
    localStorage.setItem(this.STORAGE_KEY, value);
  }

  private readStoredRealmSlug(): string {
    return localStorage.getItem(this.STORAGE_KEY) || 'default';
  }
}
