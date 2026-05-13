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

  selectedActivity: any | null = null;
  selectedUserLogs: any[] = [];
  detailModalVisible = false;
  detailPayload: any | null = null;

  activityTableConfig: DataTableConfig = {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'user_name', label: 'User' },
      { key: 'email', label: 'Email' },
      { key: 'action', label: 'Action' },
      { key: 'description', label: 'Description' },
      { key: 'model_type', label: 'Model' },
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
        hidden: (row) => !this.resolvePublicUserId(row),
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

  relatedLogsTableConfig: DataTableConfig = {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'action', label: 'Action' },
      { key: 'description', label: 'Description' },
      { key: 'model_type', label: 'Model' },
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
        label: 'Restore Log',
        icon: 'fa-rotate-left',
        color: 'success',
        action: (row) => this.restoreLog(row),
        hidden: () => !this.permissionService.hasPermission('activity-log-recover-delete-record'),
      },
    ],
  };

  selectActivity(row: any): void {
    this.selectedActivity = row;
    if (this.resolvePublicUserId(row)) {
      this.loadUserLogs(row);
    } else {
      this.selectedUserLogs = [];
    }
  }

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

    this.selectedActivity = row;
    this.api.get(`/user-management/activity-log/user-log/${encodeURIComponent(publicUserId)}`).subscribe({
      next: (response: any) => {
        this.selectedUserLogs = this.extractRows(response);
      },
      error: () => {
        this.selectedUserLogs = [];
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
          if (this.selectedActivity) {
            this.loadUserLogs(this.selectedActivity);
          }
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
      row?.publicUserId ??
      row?.public_user_id ??
      row?.user_public_id ??
      row?.public_userId ??
      row?.user?.publicUserId ??
      row?.user?.public_user_id ??
      null
    );
  }

  private extractRows(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.content)) return response.content;
    return [];
  }
}
