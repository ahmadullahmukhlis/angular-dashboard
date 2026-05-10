import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Datatable } from '../../../components/ui/datatable/datatable';
import { DataTableConfig } from '../../../models/datatable.model';

@Component({
  selector: 'app-settings-backups',
  standalone: true,
  imports: [CommonModule, Datatable],
  templateUrl: './backups.html',
  styleUrl: './backups.css',
})
export class SettingsBackups {
  tableConfig: DataTableConfig = {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Backup' },
      { key: 'size', label: 'Size' },
      { key: 'created_at', label: 'Created At', type: 'date' },
    ],
    searchKey: 'search',
  };
}
