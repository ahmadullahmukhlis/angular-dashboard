import { Component } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { Datatable } from '../../components/ui/datatable/datatable';
import { DataTableConfig } from '../../models/datatable.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [NgClass, NgStyle, Datatable]
})
export class Dashboard {
  loading = false;
  error: string | null = null;

  users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', amount: 1200, date: new Date() },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive', amount: 800, date: new Date() },
  ];

  config: DataTableConfig = {
    columns: [
      { key: 'id', label: 'ID', type: 'text', sortable: true, filterable: true },
      { key: 'name', label: 'Name', type: 'text', sortable: true, filterable: true, filterType: 'text' },
      { key: 'email', label: 'Email', type: 'text', sortable: true, filterable: true },
      { key: 'status', label: 'Status', type: 'select', sortable: true, filterable: true,
        filterType: 'select',
        filterOptions: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'pending', label: 'Pending' }
        ]
      },
      { key: 'amount', label: 'Amount', type: 'currency', sortable: true, filterable: true, filterType: 'range', align: 'right' },
      { key: 'date', label: 'Date', type: 'date', sortable: true, filterable: true, filterType: 'date' },
      { key: 'actions', label: 'Actions', type: 'action', width: '120px' }
    ],
    data: this.users,
    pagination: { pageSize: 10, currentPage: 1, totalItems: this.users.length, pageSizeOptions: [5,10,25] },
    selectable: true,
    showCheckboxes: true,
    rowActions: [
      { label: 'Edit', icon: 'edit', action: (row:any) => this.editRow(row), color: 'primary' },
      { label: 'Delete', icon: 'delete', action: (row:any) => this.deleteRow(row), color: 'danger' }
    ]
  };

  // Handlers
  handleRowClick(event:any){ console.log(event); }
  handleSelection(event:any){ console.log(event); }
  handleTableEvent(event:any){ console.log(event); }

  editRow(row:any){ console.log('Edit', row); }
  deleteRow(row:any){ console.log('Delete', row); }
}
