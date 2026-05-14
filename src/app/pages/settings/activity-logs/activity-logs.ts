import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Datatable } from '../../../components/ui/datatable/datatable';
import { Modal } from '../../../components/ui/modal/modal';
import { DataTableConfig } from '../../../models/datatable.model';
import { ApiService } from '../../../services/api/api.service';
import { ComponentService } from '../../../services/genral/component.service';
import { ToastService } from '../../../services/genral/tost.service';
import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-settings-activity-logs',
  standalone: true,
  imports: [CommonModule, Datatable, Modal],
  templateUrl: './activity-logs.html',
  styleUrl: './activity-logs.css',
})
export class SettingsActivityLogs {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);
  private readonly componentService = inject(ComponentService);
  readonly permissionService = inject(PermissionService);

  detailModalVisible = false;
  detailPayload: any | null = null;

  activityTableConfig: DataTableConfig = {
    columns: [
      { key: 'id', label: 'ID' },
      {
        key: 'causer',
        label: 'User',
        renderer: (_value, row) => row?.causer?.full_name ?? this.resolveCauserName(row) ?? 'System',
      },
      {
        key: 'causer_email',
        label: 'Email',
        renderer: (_value, row) => row?.causer?.email ?? '-',
      },
      { key: 'subject_type', label: 'Subject Type' },
      { key: 'description', label: 'Description' },
      {
        key: 'changes',
        label: 'Changes',
        renderer: (_value, row) => this.summarizeChanges(row),
      },
      { key: 'created_at', label: 'Created At', type: 'date' },
    ],
    searchKey: 'search',
    rowActions: [
      {
        label: 'View Details',
        icon: 'fa-eye',
        color: 'primary',
        action: (row) => this.viewDetails(row),
        hidden: () => !this.permissionService.hasPermission('activity-log-view-details'),
      },
      {
        label: 'User Logs',
        icon: 'fa-list',
        color: 'warning',
        action: (row) => this.loadUserLogs(row),
        hidden: () => true,
      },
      {
        label: 'Restore Log',
        icon: 'fa-rotate-left',
        color: 'success',
        action: (row) => this.restoreLog(row),
        hidden: () => !this.permissionService.hasPermission('activity-log-recover-delete-record'),
      },
    ],
  };

  viewDetails(row: any): void {
    if (!row?.id) return;

    this.api.get(`/user-management/activity-log/${row.id}`).subscribe({
      next: (response: any) => {
        this.detailPayload = response;
        this.detailModalVisible = true;
      },
      error: () => {
        this.toastService.error('Error', 'Failed to load activity log details');
      },
    });
  }

  loadUserLogs(row: any): void {
    const publicUserId = this.resolvePublicUserId(row);
    if (!publicUserId) return;

    this.api.get(`/user-management/activity-log/user-log/${encodeURIComponent(publicUserId)}`).subscribe({
      next: () => {},
      error: () => {
        this.toastService.error('Error', 'Failed to load user activity logs');
      },
    });
  }

  restoreLog(row: any): void {
    if (!row?.id) return;

    this.toastService.confirmAction({ name: `Restore activity log #${row.id}?` }, () => {
      this.api.post(`/user-management/activity-log/restore-log/${row.id}`, {}).subscribe({
        next: (response: any) => {
          this.toastService.success('Success', response?.message ?? 'Activity log restored successfully');
          this.componentService.revalidate('settings-activity-logs-table');
        },
        error: () => {
          this.toastService.error('Error', 'Failed to restore activity log');
        },
      });
    });
  }

  closeDetailModal(): void {
    this.detailModalVisible = false;
    this.detailPayload = null;
  }

  private resolvePublicUserId(row: any): string | null {
    return (
      row?.causer?.id ??
      row?.properties?.attributes?.public_id ??
      row?.properties?.old?.public_id ??
      row?.publicUserId ??
      row?.public_user_id ??
      row?.user_public_id ??
      row?.public_userId ??
      row?.user?.publicUserId ??
      row?.user?.public_user_id ??
      null
    );
  }

  private resolveCauserName(row: any): string | null {
    const firstName = row?.causer?.first_name ?? row?.causer?.firstName;
    const lastName = row?.causer?.last_name ?? row?.causer?.lastName;
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    return fullName || null;
  }

  private summarizeChanges(row: any): string {
    const changes = row?.properties?.changes;
    if (!changes || typeof changes !== 'object') {
      const hasOld = !!row?.properties?.old;
      const hasAttributes = !!row?.properties?.attributes;
      if (hasOld && hasAttributes) return 'Updated';
      if (hasAttributes) return 'Created';
      if (hasOld) return 'Deleted';
      return '-';
    }

    const parts: string[] = [];

    Object.entries(changes).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        parts.push(`${key}: ${value.length}`);
        return;
      }

      if (value !== null && value !== undefined && value !== '') {
        parts.push(`${key}`);
      }
    });

    return parts.length ? parts.join(', ') : 'Updated';
  }

}
