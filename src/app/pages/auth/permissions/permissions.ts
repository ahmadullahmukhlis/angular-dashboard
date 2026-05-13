import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Datatable } from '../../../components/ui/datatable/datatable';
import { DynamicFormBuilder } from '../../../components/ui/dynamic-form-builder/dynamic-form-builder';
import { Modal } from '../../../components/ui/modal/modal';
import { DataTableConfig } from '../../../models/datatable.model';
import { DynamicField } from '../../../models/fomrBuilderModel';
import { ApiService } from '../../../services/api/api.service';
import { ComponentService } from '../../../services/genral/component.service';
import { ToastService } from '../../../services/genral/tost.service';
import { RealmContextService } from '../../../services/realm-context.service';
import { PermissionService } from '../../../services/permission.service';
import { PermissionGate } from '../../../components/ui/permission-gate/permission-gate';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, Datatable, DynamicFormBuilder, Modal, PermissionGate],
  templateUrl: './permissions.html',
  styleUrl: './permissions.css',
})
export class Permissions {
  private api = inject(ApiService);
  private componentService = inject(ComponentService);
  private toastService = inject(ToastService);
  private realmContext = inject(RealmContextService);
  readonly permissionService = inject(PermissionService);

  selectedGroupTrail: any[] = [];
  activePermissionGroupId: number | null = null;
  activeGroupFormMode: 'create' | 'edit' | null = null;
  activeGroupParentId = 0;
  activeGroupEditId: number | null = null;
  permissionFields: DynamicField[] = [];
  permissionGroupFields: DynamicField[] = [];

  get permissionAction(): string {
    return this.withRealm('/user-management/permission');
  }

  get permissionGroupAction(): string {
    return this.withRealm(
      this.activeGroupEditId
        ? `/user-management/permission-groups/${this.activeGroupEditId}`
        : '/user-management/permission-groups',
    );
  }

  get permissionGroupsUrl(): string {
    return this.withRealm('/user-management/permission-groups');
  }

  tableConfig: DataTableConfig = {
    searchKey: 'search',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Permission Group' },
      { key: 'icon', label: 'Icon' },
      {
        key: 'groups',
        label: 'Child Groups',
        renderer: (value) => Array.isArray(value) ? value.length : 0,
      },
      {
        key: 'permissions',
        label: 'Permissions',
        renderer: (value) => Array.isArray(value) ? value.length : 0,
      },
    ],
    rowActions: [
      {
        label: 'Add Child Group',
        icon: 'fa-folder-plus',
        action: (row) => this.openGroupModal(row.id, null),
        color: 'primary',
        hidden: () => !this.permissionService.hasPermission('permission-groups-create'),
      },
      {
        label: 'Add Permission',
        icon: 'fa-plus',
        action: (row) => this.openPermissionModal(row),
        color: 'success',
        hidden: () => !this.permissionService.hasPermission('permissions-create'),
      },
      {
        label: 'Edit',
        icon: 'fa-edit',
        action: (row) => this.openGroupModal(row.parentId ?? 0, row),
        color: 'warning',
        hidden: () => !this.permissionService.hasPermission('permission-groups-edit'),
      },
      {
        label: 'Delete',
        icon: 'fa-trash',
        action: (row) => this.deleteGroup(row),
        color: 'danger',
        hidden: () => !this.permissionService.hasPermission('permission-groups-delete'),
      },
    ],
  };

  childGroupTableConfig: DataTableConfig = {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Child Group' },
      { key: 'icon', label: 'Icon' },
      {
        key: 'groups',
        label: 'Child Groups',
        renderer: (value) => Array.isArray(value) ? value.length : 0,
      },
      {
        key: 'permissions',
        label: 'Permissions',
        renderer: (value) => Array.isArray(value) ? value.length : 0,
      },
    ],
    rowActions: [
      {
        label: 'Add Child Group',
        icon: 'fa-folder-plus',
        action: (row) => this.openGroupModal(row.id, null),
        color: 'primary',
        hidden: () => !this.permissionService.hasPermission('permission-groups-create'),
      },
      {
        label: 'Add Permission',
        icon: 'fa-plus',
        action: (row) => this.openPermissionModal(row),
        color: 'success',
        hidden: () => !this.permissionService.hasPermission('permissions-create'),
      },
      {
        label: 'Edit',
        icon: 'fa-edit',
        action: (row) => this.openGroupModal(row.parentId ?? 0, row),
        color: 'warning',
        hidden: () => !this.permissionService.hasPermission('permission-groups-edit'),
      },
      {
        label: 'Delete',
        icon: 'fa-trash',
        action: (row) => this.deleteGroup(row),
        color: 'danger',
        hidden: () => !this.permissionService.hasPermission('permission-groups-delete'),
      },
    ],
  };

  permissionTableConfig: DataTableConfig = {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Permission' },
      { key: 'key', label: 'Key' },
    ],
    rowActions: [
      {
        label: 'Copy',
        icon: 'fa-copy',
        action: (row) => this.copyPermission(row),
        color: 'primary',
      },
      {
        label: 'Delete',
        icon: 'fa-trash',
        action: (row) => this.deletePermission(row),
        color: 'danger',
        hidden: () => !this.permissionService.hasPermission('permissions-delete'),
      },
    ],
  };

  openPermissionModal(group?: any) {
    this.activePermissionGroupId = group?.id ?? 0;
    this.permissionFields = [
      {
        type: 'text',
        name: 'name',
        label: 'Permission Name',
        required: true,
      },
    ];
  }

  openGroupModal(parentId: number = 0, group: any | null = null) {
    this.activeGroupFormMode = group?.id ? 'edit' : 'create';
    this.activeGroupParentId = parentId;
    this.activeGroupEditId = group?.id ?? null;

    this.permissionGroupFields = [
      {
        type: 'text',
        name: 'name',
        label: 'Permission Group Name',
        required: true,
        defaultValue: group?.name ?? null,
        className:'col-span-2'
      },
    ];
  }

  closeModal() {
    this.activePermissionGroupId = null;
    this.activeGroupFormMode = null;
    this.activeGroupParentId = 0;
    this.activeGroupEditId = null;
    this.permissionFields = [];
    this.permissionGroupFields = [];
  }

  selectGroup(row: any, level: number = 0) {
    this.selectedGroupTrail = [...this.selectedGroupTrail.slice(0, level), row];
  }

  trackBySelectedGroup(_index: number, group: any) {
    return group.id;
  }

  transformPermissionPayload = (payload: any) => ({
    name: payload.name,
    permission_group_id: Number(this.activePermissionGroupId ?? 0),
  });

  transformGroupPayload = (payload: any) => ({
    name: payload.name,
    permission_group_id: Number(this.activeGroupParentId ?? 0),
  });

  onPermissionSaved = (response: any) => {
    this.closeModal();
    this.toastService.success('Success', response?.message ?? 'Permission created successfully');
    this.resetPermissionView();
  };

  onGroupSaved = (response: any) => {
    this.closeModal();
    this.toastService.success(
      'Success',
      response?.message ??
        (this.activeGroupEditId ? 'Permission group updated successfully' : 'Permission group created successfully'),
    );
    this.resetPermissionView();
  };

  deletePermission(permission: any) {
    if (!permission?.id) return;
    this.toastService.confirmDelete({ name: permission.name ?? 'permission' }, () => {
      this.api.delete(this.withRealm(`/user-management/permission/${permission.id}`)).subscribe({
        next: () => {
          this.toastService.success('Deleted', 'Permission deleted successfully');
          this.resetPermissionView();
        },
      });
    });
  }

  deleteGroup(group: any) {
    if (!group?.id) return;
    this.toastService.confirmDelete({ name: group.name ?? 'permission group' }, () => {
      this.api.delete(this.withRealm(`/user-management/permission-groups/${group.id}`)).subscribe({
        next: () => {
          this.toastService.success('Deleted', 'Permission group deleted successfully');
          this.resetPermissionView();
        },
      });
    });
  }

  isPermissionFormOpen(groupId: number) {
    return this.activePermissionGroupId === groupId;
  }

  isCreateGroupFormOpen(parentId: number) {
    return this.activeGroupFormMode === 'create' && this.activeGroupParentId === parentId;
  }

  isEditGroupFormOpen(groupId: number) {
    return this.activeGroupFormMode === 'edit' && this.activeGroupEditId === groupId;
  }

  trackByGroupId(_index: number, group: any) {
    return group.id;
  }

  trackByPermissionId(_index: number, permission: any) {
    return permission.id;
  }

  copyPermission(permission: any) {
    const value = permission?.key ?? permission?.name;
    if (!value) return;

    navigator.clipboard.writeText(String(value)).then(() => {
      this.toastService.success('Copied', 'Permission copied to clipboard');
    });
  }

  private resetPermissionView() {
    this.selectedGroupTrail = [];
    this.componentService.revalidate('permission-groups-table');
  }

  private withRealm(path: string, params: Record<string, string> = {}): string {
    const search = new URLSearchParams({
      realms: this.realmContext.selectedRealmSlug(),
      ...params,
    });
    return `${path}?${search.toString()}`;
  }
}
