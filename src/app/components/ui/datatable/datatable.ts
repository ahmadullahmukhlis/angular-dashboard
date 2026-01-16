import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  TemplateRef,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  ColumnDefinition,
  DataTableConfig,
  SortConfig,
  FilterState,
  TableState,
  TableEvent
} from '../../../models/datatable.model';
import { DatatableHelpers } from '../../../helpers/datatable-helpers';
import { NgClass, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-datatable',
  templateUrl: './datatable.html',
  styleUrls: ['./datatable.css'],
  standalone: true,
  imports: [TableModule, FormsModule ,NgIf,NgFor],
})
export class Datatable implements OnInit, OnChanges, AfterViewInit {
  @Input() config: DataTableConfig = { columns: [], data: [], pagination: { pageSize: 10, currentPage: 1, totalItems: 0, pageSizeOptions: [5,10,25,50,100] } };
  @Input() loading: boolean = false;
  @Input() error: string | null = null;

  @Output() onRowClick = new EventEmitter<any>();
  @Output() onRowSelect = new EventEmitter<any[]>();
  @Output() onSort = new EventEmitter<SortConfig>();
  @Output() onFilter = new EventEmitter<FilterState>();
  @Output() onPageChange = new EventEmitter<number>();
  @Output() onPageSizeChange = new EventEmitter<number>();
  @Output() onRefresh = new EventEmitter<void>();
  @Output() onExport = new EventEmitter<'csv' | 'excel' | 'pdf'>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onAdd = new EventEmitter<void>();
  @Output() tableEvent = new EventEmitter<TableEvent>();

  @ViewChild('dt') dt!: ElementRef;

  internalState: TableState = {
    sort: null,
    filters: {},
    pagination: { pageSize: 10, currentPage: 1, totalItems: 0, pageSizeOptions: [5,10,25,50,100] },
    selection: { selectedRows: [], allSelected: false }
  };
  Math = Math;
  Object = Object;
  filterInputs: { [key: string]: any } = {};
  private filterSubject = new Subject<FilterState>();
  currentSort: SortConfig | null = null;
  selectedRows: any[] = [];
  selectAll: boolean = false;
  showFilters: boolean = false;
  visibleColumns: ColumnDefinition[] = [];
  firstRecord: number = 0;
  totalRecords: number = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.initializeTable();
    this.filterSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(filters => {
      this.internalState.filters = filters;
      this.onFilter.emit(filters);
      this.tableEvent.emit({ type: 'filter', data: filters });
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config']) this.initializeTable();
    if (changes['loading'] && this.loading) this.clearSelection();
  }

  ngAfterViewInit() { this.cdr.detectChanges(); }

  private initializeTable() {
    this.visibleColumns = this.config.columns.filter(c => !c.hidden).sort((a,b)=> (a.order||0)-(b.order||0));
    if (this.config.pagination) {
      this.internalState.pagination = { ...this.config.pagination };
      this.firstRecord = (this.internalState.pagination.currentPage - 1) * this.internalState.pagination.pageSize;
      this.totalRecords = this.config.pagination.totalItems;
    }
    if (this.config.filters) {
      this.internalState.filters = { ...this.config.filters };
      this.filterInputs = { ...this.config.filters };
    }
    if (this.config.sort) {
      this.internalState.sort = { ...this.config.sort };
      this.currentSort = this.config.sort;
    }
    this.clearSelection();
  }

  // ===== PUBLIC METHODS =====
  clearFilters() { this.filterInputs = {}; this.filterSubject.next({}); }
  clearSelection() { this.selectedRows = []; this.selectAll = false; this.internalState.selection = { selectedRows: [], allSelected: false }; this.onRowSelect.emit([]); }
  refresh() { this.onRefresh.emit(); this.tableEvent.emit({ type: 'refresh', data: null }); }
  export(format: 'csv'|'excel'|'pdf') { this.onExport.emit(format); this.tableEvent.emit({ type:'export', data:format }); }
  addNew() { this.onAdd.emit(); this.tableEvent.emit({ type:'add', data:null }); }

  handleSort(event:any) {
    if (this.config.serverSide) {
      const sortConfig: SortConfig = { column: event.field, direction: event.order === 1 ? 'asc':'desc' };
      this.internalState.sort = sortConfig;
      this.currentSort = sortConfig;
      this.onSort.emit(sortConfig);
      this.tableEvent.emit({ type:'sort', data:sortConfig });
    }
  }

  handlePageChange(event:any) {
    if (this.config.serverSide) {
      const newPage = Math.floor(event.first / event.rows) + 1;
      this.internalState.pagination.currentPage = newPage;
      this.firstRecord = event.first;
      this.onPageChange.emit(newPage);
      this.tableEvent.emit({ type:'page', data:newPage });
    }
  }

  handlePageSizeChange(event:any) {
    const pageSize = event.target?.value || event;
    this.internalState.pagination.pageSize = pageSize;
    this.internalState.pagination.currentPage = 1;
    this.firstRecord = 0;
    this.onPageSizeChange.emit(pageSize);
  }

  handleFilter(key:string, value:any) {
    const newFilters = { ...this.filterInputs };
    if (value === null || value === undefined || value === '') delete newFilters[key];
    else newFilters[key] = value;
    this.filterInputs = newFilters;
    this.filterSubject.next(newFilters);
  }

  handleRowClick(row:any) { this.onRowClick.emit(row); this.tableEvent.emit({ type:'rowClick', data:row }); }
  toggleRowSelection(row:any) {
    const idx = this.selectedRows.indexOf(row);
    if (idx > -1) this.selectedRows.splice(idx,1);
    else this.selectedRows.push(row);
    this.internalState.selection.selectedRows = [...this.selectedRows];
    this.onRowSelect.emit([...this.selectedRows]);
  }
  handleSelectAll() {
    this.selectedRows = this.selectAll ? [...this.config.data] : [];
    this.internalState.selection.selectedRows = [...this.selectedRows];
    this.onRowSelect.emit([...this.selectedRows]);
  }

  getCellValue(row:any, column:ColumnDefinition):any {
    if (column.renderer) return column.renderer(row[column.key], row);
    const val = row[column.key];
    if (column.type==='date' && val) return new Date(val).toLocaleDateString();
    if (column.type==='currency' && val!==undefined) return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(val);
    if (column.type==='boolean') return val?'Yes':'No';
    return val;
  }

  isColumnFilterable(column:ColumnDefinition):boolean { return !!column.filterType; }
  getFilterPlaceholder(column:ColumnDefinition):string {
    switch(column.filterType){
      case 'text': return `Enter ${column.label}`;
      case 'number': return `Enter ${column.label}`;
      case 'date': return `Select ${column.label}`;
      case 'boolean': return `Select ${column.label}`;
      case 'select': case 'multi-select': return `Select ${column.label}`;
      case 'range': return `Enter ${column.label} range`;
      default: return '';
    }
  }

  getRowClass(row:any):string { return this.selectedRows.includes(row)?'bg-blue-50':''; }
  getColumnWidth(column:ColumnDefinition):string { return column.width || 'auto'; }
  getCellClasses(column:ColumnDefinition):string { return column.cellClass || ''; }

  getPageNumbers():number[] {
    const totalItems = this.config.pagination?.totalItems||0;
    const pageSize = this.internalState.pagination.pageSize||10;
    const totalPages = Math.ceil(totalItems/pageSize)||1;
    const currentPage = this.internalState.pagination.currentPage||1;
    const pages:number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1,currentPage-Math.floor(maxVisible/2));
    let endPage = Math.min(totalPages,startPage+maxVisible-1);
    startPage = Math.max(1,endPage-maxVisible+1);
    for(let i=startPage;i<=endPage;i++) pages.push(i);
    return pages;
  }
  // Get column label by key
  getColumnLabel(key: string): string {
    const col = this.config.columns.find(c => c.key === key);
    return col ? col.label : key;
  }

// Row style (optional, return empty string if none)
  getRowStyle(row: any): string {
    return '';
  }

// Header classes (optional, e.g., sortable)
  getHeaderClasses(column: ColumnDefinition): string {
    let classes = 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
    if (column.sortable) classes += ' cursor-pointer';
    return classes;
  }

// Check if a row is selected
  isRowSelected(row: any): boolean {
    return this.selectedRows.includes(row);
  }

// Action button classes
  getActionButtonClass(action: any): string {
    return 'text-sm px-2 py-1 rounded-md hover:bg-gray-100';
  }

// Edit / Delete handlers
  handleEdit(row: any) { if (this.onEdit) this.onEdit.emit(row); }
  handleDelete(row: any) { if (this.onDelete) this.onDelete.emit(row); }

// Page button class for pagination
  getPageButtonClass(page: number): string {

    return page === this.internalState.pagination.currentPage
        ? 'bg-blue-600 text-white border border-gray-300'
        : 'bg-white text-gray-700 border border-gray-300';
  }
  

}
