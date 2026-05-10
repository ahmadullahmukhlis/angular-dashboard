import { Component, inject } from '@angular/core';
import { DynamicFormBuilder } from '../../../components/ui/dynamic-form-builder/dynamic-form-builder';
import { Datatable } from '../../../components/ui/datatable/datatable';
import { Modal } from '../../../components/ui/modal/modal';
import { DynamicField } from '../../../models/fomrBuilderModel';
import { DataTableConfig } from '../../../models/datatable.model';
import { ApiService } from '../../../services/api/api.service';
import { ComponentService } from '../../../services/genral/component.service';
import { ToastService } from '../../../services/genral/tost.service';

@Component({
  selector: 'app-auth-users',
  standalone: true,
  imports: [DynamicFormBuilder, Datatable, Modal],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class AuthUsers {
  private api = inject(ApiService);
  private componentService = inject(ComponentService);
  private toastService = inject(ToastService);

  showUserModal = false;
  showAssignRolesModal = false;
  showUnassignRolesModal = false;
  isEdit = false;
  selectedUserId: number | null = null;
  assignRolesFields: DynamicField[] = [];
  unassignRolesFields: DynamicField[] = [];

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
      url: '/user-management/roles?fetch_all=true',
      optionLabel: 'name',
      optionValue: 'id',
      required: true,
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
      },
      {
        label: 'Assign Roles',
        icon: 'fa-user-tag',
        action: (row) => this.openAssignRoles(row),
        color: 'warning',
      },
      {
        label: 'Unassign Roles',
        icon: 'fa-user-minus',
        action: (row) => this.openUnassignRoles(row),
        color: 'danger',
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
      },
    ],
  };

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

    this.api.get(`/user-management/users/${this.selectedUserId}`).subscribe({
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
  }

  private resetDefaults() {
    this.userFields = this.userFields.map((f) => ({
      ...f,
      defaultValue: f.name === 'is_active' ? true : f.name === 'roles' ? [] : null,
    }));
  }

  submit = (payload: any) => {
    const finalPayload = {
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      password: payload.password || null,
      confirm_password: payload.confirm_password || null,
      roles: Array.isArray(payload.roles)
        ? payload.roles.map((id: any) => ({ id: Number(id) }))
        : [],
      is_active: !!payload.is_active,
    };

    const request$ =
      this.isEdit && this.selectedUserId
        ? this.api.put(`/user-management/users/${this.selectedUserId}`, finalPayload)
        : this.api.post('/user-management/users', finalPayload);

    request$.subscribe({
      next: () => {
        this.showUserModal = false;
        this.toastService.success('Success', this.isEdit ? 'User updated successfully' : 'User created successfully');
        this.componentService.revalidate('users-table');
      },
    });
  };

  openAssignRoles(row: any) {
    this.selectedUserId = row?.id ?? null;
    if (!this.selectedUserId) return;

    this.assignRolesFields = [
      {
        type: 'multi-select',
        name: 'roles',
        label: 'Roles',
        url: '/user-management/roles?fetch_all=true',
        optionLabel: 'name',
        optionValue: 'id',
        required: true,
        searchable: true,
        defaultValue: Array.isArray(row?.roles) ? row.roles.map((role: any) => role?.id ?? role?.role_id) : [],
      },
    ];
    this.showAssignRolesModal = true;
  }

  submitAssignRoles = (payload: any) => {
    if (!this.selectedUserId) return;

    this.api.get(`/user-management/users/${this.selectedUserId}`).subscribe({
      next: (user: any) => {
        const finalPayload = {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          password: null,
          confirm_password: null,
          roles: Array.isArray(payload.roles) ? payload.roles.map((id: any) => ({ id: Number(id) })) : [],
          is_active: !!user.is_active,
        };

        this.api.put(`/user-management/users/${this.selectedUserId}`, finalPayload).subscribe({
          next: () => {
            this.showAssignRolesModal = false;
            this.toastService.success('Success', 'User roles assigned successfully');
            this.componentService.revalidate('users-table');
          },
        });
      },
    });
  };

  openUnassignRoles(row: any) {
    this.selectedUserId = row?.id ?? null;
    if (!this.selectedUserId) return;

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
        required: true,
        searchable: true,
        defaultValue: Array.isArray(row?.roles) ? row.roles.map((role: any) => role?.id ?? role?.role_id) : [],
      },
    ];
    this.showUnassignRolesModal = true;
  }

  submitUnassignRoles = (payload: any) => {
    if (!this.selectedUserId) return;

    this.api.get(`/user-management/users/${this.selectedUserId}`).subscribe({
      next: (user: any) => {
        const removeIds = new Set(
          Array.isArray(payload.roles) ? payload.roles.map((id: any) => Number(id)) : [],
        );
        const remainingRoles = (user?.roles ?? [])
          .filter((role: any) => !removeIds.has(Number(role?.id ?? role?.role_id)))
          .map((role: any) => ({ id: Number(role?.id ?? role?.role_id) }));

        this.api.put(`/user-management/users/${this.selectedUserId}`, {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          password: null,
          confirm_password: null,
          roles: remainingRoles,
          is_active: !!user.is_active,
        }).subscribe({
          next: () => {
            this.showUnassignRolesModal = false;
            this.toastService.success('Success', 'User roles unassigned successfully');
            this.componentService.revalidate('users-table');
          },
        });
      },
    });
  };

  delete(row: any) {
    if (!row?.id) return;
    this.api.delete(`/user-management/users/${row.id}`).subscribe({
      next: () => {
        this.toastService.success('Deleted', 'User deleted successfully');
        this.componentService.revalidate('users-table');
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
}
