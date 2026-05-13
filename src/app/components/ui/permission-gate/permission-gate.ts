import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-permission-gate',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisible()) {
      <ng-content></ng-content>
    }
  `,
})
export class PermissionGate {
  private readonly permissionService = inject(PermissionService);

  @Input() permission?: string | null;
  @Input() anyPermissions?: string[] | null;

  readonly isVisible = computed(() => {
    if (this.permission) {
      return this.permissionService.hasPermission(this.permission);
    }

    if (this.anyPermissions?.length) {
      return this.permissionService.hasAnyPermission(this.anyPermissions);
    }

    return true;
  });
}
