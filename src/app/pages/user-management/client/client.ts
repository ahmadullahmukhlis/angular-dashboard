import { Component, inject } from '@angular/core';
import { Datatable } from '../../../components/ui/datatable/datatable';
import { DataTableConfig } from '../../../models/datatable.model';
import { ComponentService } from '../../../services/genral/component.service';

@Component({
  selector: 'app-client',
  imports: [Datatable],
  templateUrl: './client.html',
  styleUrl: './client.css',
})
export class Client {
  private componentService = inject(ComponentService)
  addCLient :  boolean = false;

    tableConfig: DataTableConfig= {
      columns: [
        { key: 'id', label: 'ID', sortable: true, width: '50px', className: 'font-bold text-center' },
        { key: 'name', label: 'full Name', sortable: true, filterType: 'text' },
        { key: 'publicKey', label: 'Public Key', sortable: false, filterType: 'text' },
        { key: 'privateKey', label: 'Private Key', sortable: false, filterType: 'text' },
   
        {
          key: 'website',
          label: 'Website',
          type: 'text',
          filterType: 'text',
          validation: (value: any) => {
            return value == 'demarco.info' ? '<p class="text-red-500">' + value + '</p>' : value;
          },
        },
      ],
  
      showCheckboxes: true,
      selectable: true,
      onAdd : ()=>{
        this.addCLient = true;
      }
    
    };
    handleRowClick(row: any) {
    console.log('Row clicked:', row);
  }
  handleClose(){
    this.addCLient= false;
  }

  handleRowSelect(rows: any[]) {
    console.log('Rows selected:', rows);
  }

  handleAdd() {
    console.log('Add new row');
  }

  handleEdit(row: any) {
    console.log('Edit row:', row);
  }

  handleDelete(row: any) {
    console.log('Delete row:', row);
  }

  handleExport(format: 'csv' | 'excel' | 'pdf') {
    console.log('Export table as:', format);
  }

  handleTableEvent(event: any) {
    console.log('Table event:', event);
  }
  reloadData() {
    this.componentService.revalidate('users-table');
  }
}
