import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Datatable } from '../../../components/ui/datatable/datatable';
import { DataTableConfig } from '../../../models/datatable.model';

@Component({
  selector: 'app-settings-login-logs',
  standalone: true,
  imports: [CommonModule, Datatable],
  templateUrl: './login-logs.html',
  styleUrl: './login-logs.css',
})
export class SettingsLoginLogs {
  tableConfig: DataTableConfig = {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'email', label: 'Email' },
      { key: 'ip_address', label: 'IP Address' },
      { key: 'login_succeed', label: 'Succeeded', type: 'boolean' },
      { key: 'message', label: 'Message' },
      { key: 'created_at', label: 'Created At', type: 'date' },
    ],
    searchKey: 'search',
  };
}
