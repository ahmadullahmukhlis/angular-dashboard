import { Injectable, computed, inject } from '@angular/core';
import { AppStateService } from '../state/user.state';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly appState = inject(AppStateService);

  readonly currentUser = this.appState.userSignal;
  readonly permissions = computed(() => this.currentUser()?.permissions ?? []);
  readonly roles = computed(() => this.currentUser()?.roles ?? []);
  readonly permissionSignature = computed(() => this.permissions().slice().sort().join('|'));

  hasPermission(permission: string | null | undefined): boolean {
    if (!permission) return true;
    return this.permissions().includes(permission);
  }

  hasAnyPermission(permissions: Array<string | null | undefined> | null | undefined): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.some((permission) => !!permission && this.hasPermission(permission));
  }

  hasRole(role: string | null | undefined): boolean {
    if (!role) return true;
    return this.roles().includes(role);
  }
}
