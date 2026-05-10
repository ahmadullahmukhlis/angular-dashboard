import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DynamicFormBuilder } from '../../../components/ui/dynamic-form-builder/dynamic-form-builder';
import { Datatable } from '../../../components/ui/datatable/datatable';
import { Modal } from '../../../components/ui/modal/modal';
import { DynamicField } from '../../../models/fomrBuilderModel';
import { DataTableConfig } from '../../../models/datatable.model';
import { ApiService } from '../../../services/api/api.service';
import { ToastService } from '../../../services/genral/tost.service';
import { ComponentService } from '../../../services/genral/component.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, DynamicFormBuilder, Datatable, Modal],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class Roles implements OnInit {
  private api = inject(ApiService);
  private toastService = inject(ToastService);
  private componentService = inject(ComponentService);
  private cdr = inject(ChangeDetectorRef);

  showModal = false;
  isEdit = false;
  selectedId: number | null = null;
  permissionOptions: { id: number; name: string }[] = [];
  selectedRole: any | null = null;
  assignedUsers: any[] = [];
  assignedPermissions: any[] = [];

  fields: DynamicField[] = [
    { type: 'text', name: 'name', label: 'Role Name', required: true },
    {
      type: 'multi-select',
      name: 'role_permissions',
      label: 'Permissions',
      options: [],
      optionLabel: 'name',
      optionValue: 'id',
      searchable: true,
      className: 'md:col-span-2',
    },
  ];

  tableConfig: DataTableConfig = {
    searchKey: 'search',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      {
        key: 'permission_ids',
        label: 'Permissions',
        renderer: (value) => Array.isArray(value) ? value.length : 0,
      },
    ],
    rowActions: [
      {
        label: 'Edit',
        icon: 'fa-edit',
        action: (row) => this.openEdit(row),
        color: 'primary',
      },
      {
        label: 'Delete',
        icon: 'fa-trash',
        action: (row) => this.delete(row),
        color: 'danger',
      },
    ],
  };

  assignedUsersTableConfig: DataTableConfig = {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
    ],
    searchKey: 'search',
    rowActions: [
      {
        label: 'Unassign',
        icon: 'fa-user-minus',
        action: (row) => this.unassignUserFromRole(row),
        color: 'danger',
      },
    ],
  };

  assignedPermissionsTableConfig: DataTableConfig = {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Permission' },
      { key: 'key', label: 'Key' },
    ],
    searchKey: 'search',
    rowActions: [
      {
        label: 'Unassign',
        icon: 'fa-unlink',
        action: (row) => this.unassignPermissionFromRole(row),
        color: 'danger',
      },
    ],
  };

  ngOnInit(): void {
    this.loadPermissionOptions();
  }

  openCreate() {
    this.isEdit = false;
    this.selectedId = null;
    this.resetDefaults();
    this.showModal = true;
  }

  openEdit(row: any) {
    this.isEdit = true;
    this.selectedId = row?.id ?? null;
    this.fields = this.fields.map((f) => ({
      ...f,
      options: f.name === 'role_permissions' ? this.permissionOptions : f.options,
      defaultValue:
        f.name === 'role_permissions'
          ? (Array.isArray(row?.permission_ids) ? row.permission_ids.map((value: any) => Number(value)) : [])
          : row?.[f.name] ?? null,
    }));
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  selectRole(row: any) {
    if (!row?.id) return;

    this.selectedRole = row;
    this.assignedUsers = [];
    this.assignedPermissions = [];

    this.api.get(`/user-management/roles/${row.id}`).subscribe({
      next: (response: any) => {
        this.assignedPermissions = (response?.role?.permissions ?? []).map((item: any) => ({
          id: item?.permission?.id ?? item?.permission_id,
          name: item?.permission?.name ?? '',
          key: item?.permission?.key ?? '',
        }));
        this.cdr.detectChanges();
      },
    });

    this.api.get('/user-management/users?fetch_all=true').subscribe({
      next: (users: any) => {
        const rows = Array.isArray(users?.data) ? users.data : Array.isArray(users) ? users : [];
        this.assignedUsers = rows.filter((user: any) =>
          Array.isArray(user?.roles) &&
          user.roles.some((role: any) => Number(role?.id ?? role?.role_id) === Number(row.id)),
        );
        this.cdr.detectChanges();
      },
    });
  }

  unassignPermissionFromRole(permission: any) {
    if (!this.selectedRole?.id || !permission?.id) return;

    this.toastService.confirmAction({ name: `Remove ${permission.name ?? 'permission'} from this role?` }, () => {
      this.api.get(`/user-management/roles/${this.selectedRole.id}`).subscribe({
        next: (response: any) => {
          const role = response?.role;
          const remainingPermissions = (role?.role_permissions ?? [])
            .map((value: any) => Number(value))
            .filter((id: number) => id !== Number(permission.id));

          this.api
            .put(`/user-management/roles/${this.selectedRole.id}`, {
              name: role?.name ?? this.selectedRole.name,
              role_permissions: remainingPermissions,
            })
            .subscribe({
              next: () => {
                this.toastService.success('Success', 'Permission unassigned successfully');
                this.selectRole(this.selectedRole);
                this.componentService.revalidate('roles-table');
              },
            });
        },
      });
    });
  }

  unassignUserFromRole(user: any) {
    if (!this.selectedRole?.id || !user?.id) return;

    this.toastService.confirmAction({ name: `Remove this role from ${user.email ?? 'this user'}?` }, () => {
      this.api.get(`/user-management/users/${user.id}`).subscribe({
        next: (fullUser: any) => {
          const remainingRoles = (fullUser?.roles ?? [])
            .filter((role: any) => Number(role?.id ?? role?.role_id) !== Number(this.selectedRole.id))
            .map((role: any) => ({ id: Number(role?.id ?? role?.role_id) }));

          this.api
            .put(`/user-management/users/${user.id}`, {
              first_name: fullUser.first_name,
              last_name: fullUser.last_name,
              email: fullUser.email,
              password: null,
              confirm_password: null,
              roles: remainingRoles,
              is_active: !!fullUser.is_active,
            })
            .subscribe({
              next: () => {
                this.toastService.success('Success', 'Role unassigned from user successfully');
                this.selectRole(this.selectedRole);
                this.componentService.revalidate('users-table');
              },
            });
        },
      });
    });
  }

  submit = (payload: any) => {
    const finalPayload = {
      name: payload.name,
      role_permissions: Array.isArray(payload.role_permissions)
        ? payload.role_permissions.map((value: any) => Number(value))
        : [],
    };

    if (this.isEdit && this.selectedId) {
      this.api.put(`/user-management/roles/${this.selectedId}`, finalPayload).subscribe({
        next: () => {
          this.showModal = false;
          this.toastService.success('Success', 'Role updated successfully');
          this.componentService.revalidate('roles-table');
          this.clearSelectedRole();
        },
      });
      return;
    }
    this.api.post('/user-management/roles', finalPayload).subscribe({
      next: () => {
        this.showModal = false;
        this.toastService.success('Success', 'Role created successfully');
        this.componentService.revalidate('roles-table');
        this.clearSelectedRole();
      },
    });
  };

  delete(role: any) {
    if (!role?.id) return;
    this.toastService.confirmDelete({ name: role.name ?? 'role' }, () => {
      this.api.delete(`/user-management/roles/${role.id}`).subscribe({
        next: () => {
          this.toastService.success('Deleted', 'Role deleted successfully');
          this.componentService.revalidate('roles-table');
          if (this.selectedRole?.id === role.id) {
            this.clearSelectedRole();
          }
        },
      });
    });
  }

  private resetDefaults() {
    this.fields = this.fields.map((f) => ({
      ...f,
      options: f.name === 'role_permissions' ? this.permissionOptions : f.options,
      defaultValue: f.name === 'role_permissions' ? [] : null,
    }));
  }

  private loadPermissionOptions() {
    this.api.get('/user-management/permission-groups').subscribe({
      next: (response: any) => {
        this.permissionOptions = this.flattenPermissions(response?.data ?? []);
        this.resetDefaults();
      },
      error: () => {
        this.permissionOptions = [];
        this.resetDefaults();
      },
    });
  }

  private clearSelectedRole() {
    this.selectedRole = null;
    this.assignedUsers = [];
    this.assignedPermissions = [];
  }

  private flattenPermissions(groups: any[]): { id: number; name: string }[] {
    return groups.flatMap((group) => [
      ...((group.permissions ?? []).map((permission: any) => ({
        id: Number(permission.id),
        name: `${group.name} / ${permission.name}`,
      })) as { id: number; name: string }[]),
      ...this.flattenPermissions(group.groups ?? []),
    ]);
  }
}
