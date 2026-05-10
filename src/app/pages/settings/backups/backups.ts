import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Datatable } from '../../../components/ui/datatable/datatable';
import { DataTableConfig } from '../../../models/datatable.model';
import { ApiService } from '../../../services/api/api.service';
import { ComponentService } from '../../../services/genral/component.service';
import { ToastService } from '../../../services/genral/tost.service';

@Component({
  selector: 'app-settings-backups',
  standalone: true,
  imports: [CommonModule, Datatable],
  templateUrl: './backups.html',
  styleUrl: './backups.css',
})
export class SettingsBackups {
  private api = inject(ApiService);
  private toastService = inject(ToastService);
  private componentService = inject(ComponentService);

  tableConfig: DataTableConfig = {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Backup' },
      { key: 'user', label: 'User' },
      { key: 'size', label: 'Size' },
      { key: 'created_at', label: 'Created At', type: 'date' },
    ],
    searchKey: 'search',
  };

  runBackup() {
    this.api.get('/configurations/backup/run').subscribe({
      next: (response: any) => {
        this.toastService.success('Success', response?.message ?? 'Backup completed successfully');
        this.componentService.revalidate('settings-backups-table');
      },
    });
  }
}
