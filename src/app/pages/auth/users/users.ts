import { Component, inject } from '@angular/core';
import { DynamicFormBuilder } from '../../../components/ui/dynamic-form-builder/dynamic-form-builder';
import { Datatable } from '../../../components/ui/datatable/datatable';
import { Modal } from '../../../components/ui/modal/modal';
import { DynamicField } from '../../../models/fomrBuilderModel';
import { DataTableConfig } from '../../../models/datatable.model';
import { ApiService } from '../../../services/api/api.service';
import { ComponentService } from '../../../services/genral/component.service';
import { ToastService } from '../../../services/genral/tost.service';
import { RealmContextService } from '../../../services/realm-context.service';
import { PermissionService } from '../../../services/permission.service';
import { PermissionGate } from '../../../components/ui/permission-gate/permission-gate';

@Component({
  selector: 'app-auth-users',
  standalone: true,
  imports: [DynamicFormBuilder, Datatable, Modal, PermissionGate],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class AuthUsers {
  private api = inject(ApiService);
  private componentService = inject(ComponentService);
  private toastService = inject(ToastService);
  private realmContext = inject(RealmContextService);
  readonly permissionService = inject(PermissionService);

  showUserModal = false;
  showAssignRolesModal = false;
  showUnassignRolesModal = false;
  isEdit = false;
  selectedUserId: number | null = null;
  assignRolesFields: DynamicField[] = [];
  unassignRolesFields: DynamicField[] = [];
  assignRolesHiddenFields: Array<{ name: string; value: any }> = [];
  unassignRolesHiddenFields: Array<{ name: string; value: any }> = [];

  userFields: DynamicField[] = [
    { type: 'text', name: 'first_name', label: 'First Name', required: true, className: 'md:col-span-1' },
    { type: 'text', name: 'last_name', label: 'Last Name', required: true, className: 'md:col-span-1' },
    {
      type: 'text',
      name: 'email',
      label: 'Email or username',
      required: true,
      className: 'md:col-span-2',
    },
    {
      type: 'password',
      name: 'password',
      label: 'Password',
      requiredWhen: () => !this.isEdit,
      className: 'md:col-span-1',
    },
    {
      type: 'password',
      name: 'confirm_password',
      label: 'Confirm Password',
      requiredWhen: (values) => !this.isEdit || !!values?.password,
      className: 'md:col-span-1',
    },
    {
      type: 'multi-select',
      name: 'roles',
      label: 'Roles',
      url: '',
      optionLabel: 'name',
      optionValue: 'id',
      className: 'md:col-span-2',
    },
    {
      type: 'switch',
      name: 'is_active',
      label: 'Is Active',
      defaultValue: true,
      className: 'md:col-span-2',
    },
  ];

  userTableConfig: DataTableConfig = {
    searchKey: 'search',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      {
        key: 'roles',
        label: 'Roles',
        renderer: (_value, row) =>
          Array.isArray(row?.roles) ? row.roles.map((role: any) => role?.name).filter(Boolean).join(', ') : '',
      },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
    rowActions: [
      {
        label: 'Edit',
        icon: 'fa-edit',
        action: (row) => this.openEdit(row),
        color: 'primary',
        hidden: () => !this.permissionService.hasPermission('users-edit'),
      },
      {
        label: 'Assign Roles',
        icon: 'fa-user-tag',
        action: (row) => this.openAssignRoles(row),
        color: 'warning',
        hidden: () => !this.permissionService.hasPermission('users-edit'),
      },
      {
        label: 'Inactive',
        icon: 'fa-user-slash',
        action: (row) => this.updateUserActiveStatus(row, false),
        color: 'danger',
        hidden: (row) => !row?.is_active || !this.permissionService.hasPermission('users-edit'),
      },
      {
        label: 'Activate',
        icon: 'fa-user-check',
        action: (row) => this.updateUserActiveStatus(row, true),
        color: 'success',
        hidden: (row) => !!row?.is_active || !this.permissionService.hasPermission('users-edit'),
      },
      {
        label: 'Unassign Roles',
        icon: 'fa-user-minus',
        action: (row) => this.openUnassignRoles(row),
        color: 'danger',
        hidden: (row) =>
          !Array.isArray(row?.roles) ||
          row.roles.length === 0 ||
          !this.permissionService.hasPermission('users-edit'),
      },
      {
        label: 'Delete',
        icon: 'fa-trash',
        action: (row) => this.delete(row),
        color: 'danger',
        confirm: {
          title: 'Delete User',
          message: 'This will permanently delete the user.',
        },
        hidden: () => !this.permissionService.hasPermission('users-delete'),
      },
    ],
  };

  canCreateUsers(): boolean {
    return this.permissionService.hasPermission('users-create');
  }

  canEditUsers(): boolean {
    return this.permissionService.hasPermission('users-edit');
  }

  canDeleteUsers(): boolean {
    return this.permissionService.hasPermission('users-delete');
  }

  get userAction(): string {
    return this.withRealm(`/user-management/users${this.selectedUserId ? `/${this.selectedUserId}` : ''}`);
  }

  get assignRolesAction(): string {
    return this.selectedUserId ? this.withRealm(`/user-management/users/${this.selectedUserId}`) : '';
  }

  get usersUrl(): string {
    return this.withRealm('/user-management/users');
  }

  get rolesOptionsUrl(): string {
    return this.withRealm('/user-management/roles', { fetch_all: 'true' });
  }

  openCreate() {
    this.isEdit = false;
    this.selectedUserId = null;
    this.resetDefaults();
    this.showUserModal = true;
  }

  openEdit(row: any) {
    this.isEdit = true;
    this.selectedUserId = row?.id ?? null;
    if (!this.selectedUserId) return;
    this.resetDefaults();
    this.showUserModal = true;

    this.api.get(this.withRealm(`/user-management/users/${this.selectedUserId}`)).subscribe({
      next: (user: any) => {
        this.userFields = this.userFields.map((f) => ({
          ...f,
          defaultValue: this.getFieldDefaultValue(f.name, user),
        }));
      },
    });
  }

  closeModal() {
    this.showUserModal = false;
    this.showAssignRolesModal = false;
    this.showUnassignRolesModal = false;
    this.assignRolesHiddenFields = [];
    this.unassignRolesHiddenFields = [];
  }

  private resetDefaults() {
    this.userFields = this.userFields.map((f) => ({
      ...f,
      url: f.name === 'roles' ? this.rolesOptionsUrl : f.url,
      defaultValue: f.name === 'is_active' ? true : f.name === 'roles' ? [] : null,
    }));
  }

  transformUserPayload = (payload: any) => ({
    first_name: payload.first_name,
    last_name: payload.last_name,
    email: payload.email,
    password: payload.password || null,
    confirm_password: payload.confirm_password || null,
    roles: Array.isArray(payload.roles) ? payload.roles.map((id: any) => ({ id: Number(id) })) : [],
    is_active: !!payload.is_active,
  });

  onUserSaved = (response: any) => {
    this.showUserModal = false;
    this.toastService.success('Success', response?.message ?? (this.isEdit ? 'User updated successfully' : 'User created successfully'));
    this.componentService.revalidate('users-table');
  };

  openAssignRoles(row: any) {
    this.selectedUserId = row?.id ?? null;
    if (!this.selectedUserId) return;

    this.assignRolesFields = [
      {
        type: 'multi-select',
        name: 'roles',
        label: 'Roles',
        url: this.rolesOptionsUrl,
        optionLabel: 'name',
        optionValue: 'id',
        searchable: true,
        defaultValue: Array.isArray(row?.roles) ? row.roles.map((role: any) => role?.id ?? role?.role_id) : [],
      },
    ];
    this.assignRolesHiddenFields = [
      { name: 'first_name', value: row.first_name },
      { name: 'last_name', value: row.last_name },
      { name: 'email', value: row.email },
      { name: 'password', value: null },
      { name: 'confirm_password', value: null },
      { name: 'is_active', value: !!row.is_active },
    ];
    this.showAssignRolesModal = true;
  }

  transformAssignRolesPayload = (payload: any) => ({
    first_name: payload.first_name,
    last_name: payload.last_name,
    email: payload.email,
    password: null,
    confirm_password: null,
    roles: Array.isArray(payload.roles) ? payload.roles.map((id: any) => ({ id: Number(id) })) : [],
    is_active: !!payload.is_active,
  });

  onRolesAssigned = (response: any) => {
    this.showAssignRolesModal = false;
    this.toastService.success('Success', response?.message ?? 'User roles assigned successfully');
    this.componentService.revalidate('users-table');
  };

  openUnassignRoles(row: any) {
    this.selectedUserId = row?.id ?? null;
    if (!this.selectedUserId) return;

    const existingRoles = Array.isArray(row?.roles) ? row.roles.map((role: any) => Number(role?.id ?? role?.role_id)) : [];
    this.unassignRolesFields = [
      {
        type: 'multi-select',
        name: 'roles',
        label: 'Roles To Remove',
        options: Array.isArray(row?.roles)
          ? row.roles.map((role: any) => ({
              id: Number(role?.id ?? role?.role_id),
              name: role?.name,
            }))
          : [],
        optionLabel: 'name',
        optionValue: 'id',
        searchable: true,
        defaultValue: [],
      },
    ];
    this.unassignRolesHiddenFields = [
      { name: 'first_name', value: row.first_name },
      { name: 'last_name', value: row.last_name },
      { name: 'email', value: row.email },
      { name: 'password', value: null },
      { name: 'confirm_password', value: null },
      { name: 'is_active', value: !!row.is_active },
      { name: '__existing_roles', value: existingRoles },
    ];
    this.showUnassignRolesModal = true;
  }

  transformUnassignRolesPayload = (payload: any) => {
    const selectedRoleIds = Array.isArray(payload.roles) ? payload.roles.map((id: any) => Number(id)) : [];
    const existingRoles = Array.isArray(payload.__existing_roles) ? payload.__existing_roles : [];
    return {
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      password: null,
      confirm_password: null,
      roles: existingRoles
        .filter((id: number) => !selectedRoleIds.includes(Number(id)))
        .map((id: number) => ({ id: Number(id) })),
      is_active: !!payload.is_active,
    };
  };

  onRolesUnassigned = (response: any) => {
    this.showUnassignRolesModal = false;
    this.toastService.success('Success', response?.message ?? 'User roles unassigned successfully');
    this.componentService.revalidate('users-table');
  };

  delete(row: any) {
    if (!row?.id) return;
    this.api.delete(this.withRealm(`/user-management/users/${row.id}`)).subscribe({
      next: () => {
        this.toastService.success('Deleted', 'User deleted successfully');
        this.componentService.revalidate('users-table');
      },
    });
  }

  updateUserActiveStatus(row: any, isActive: boolean) {
    if (!row?.id) return;

    this.api.get(this.withRealm(`/user-management/users/${row.id}`)).subscribe({
      next: (user: any) => {
        this.api.put(this.withRealm(`/user-management/users/${row.id}`), {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          password: null,
          confirm_password: null,
          roles: Array.isArray(user.roles)
            ? user.roles.map((role: any) => ({ id: Number(role?.id ?? role?.role_id) }))
            : [],
          is_active: isActive,
        }).subscribe({
          next: () => {
            this.toastService.success('Success', isActive ? 'User activated successfully' : 'User inactivated successfully');
            this.componentService.revalidate('users-table');
          },
        });
      },
    });
  }

  private getFieldDefaultValue(fieldName: string, user: any) {
    if (fieldName === 'roles') {
      return Array.isArray(user?.roles) ? user.roles.map((role: any) => role?.id ?? role?.role_id) : [];
    }
    if (fieldName === 'password' || fieldName === 'confirm_password') {
      return null;
    }
    if (fieldName === 'is_active') {
      return !!user?.is_active;
    }
    return user?.[fieldName] ?? null;
  }

  private withRealm(path: string, params: Record<string, string> = {}): string {
    const search = new URLSearchParams({
      realms: this.realmContext.selectedRealmSlug(),
      ...params,
    });
    return `${path}?${search.toString()}`;
  }
}
