import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
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
  TableEvent,
} from '../../../models/datatable.model';
import { ComponentService } from '../../../services/genral/component.service';

@Component({
  selector: 'app-datatable',
  templateUrl: './datatable.html',
  styleUrls: ['./datatable.css'],
  standalone: true,
  imports: [TableModule, FormsModule],
})
export class Datatable implements OnInit, OnChanges, AfterViewInit {
  // ✅ API URL
  @Input() url!: string;

  @Input() config: DataTableConfig = {
    columns: [],
    serverSide: true,
    pagination: {
      pageSize: 10,
      currentPage: 1,
      totalItems: 0,
      pageSizeOptions: [5, 10, 25, 50, 100],
    },
  };

  @Input() loading: boolean = false;
  @Input() error: string | null = null;

  data: any[] = [];

  @Output() onRowClick = new EventEmitter<any>();
  @Output() onRowSelect = new EventEmitter<any[]>();
  @Output() onAdd = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onExport = new EventEmitter<'csv' | 'excel' | 'pdf'>();
  @Output() tableEvent = new EventEmitter<TableEvent>();

  @ViewChild('dt') dt!: ElementRef;

  internalState: TableState = {
    sort: null,
    filters: {},
    pagination: {
      pageSize: 10,
      currentPage: 1,
      totalItems: 0,
      pageSizeOptions: [5, 10, 25, 50, 100],
    },
    selection: { selectedRows: [], allSelected: false },
  };

  filterInputs: { [key: string]: any } = {};
  private filterSubject = new Subject<FilterState>();

  currentSort: SortConfig | null = null;
  selectedRows: any[] = [];
  selectAll: boolean = false;
  visibleColumns: ColumnDefinition[] = [];
  firstRecord: number = 0;
  totalRecords: number = 0;
  showFilters: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private componentService: ComponentService,
  ) {}

  // ================= LIFECYCLE =================

  ngOnInit() {
    this.initializeTable();

    this.filterSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe((filters) => {
      this.internalState.filters = filters;
      this.internalState.pagination.currentPage = 1;
      this.firstRecord = 0;
      this.loadData();
    });

    if (this.url && this.config.serverSide) {
      this.loadData();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config']) this.initializeTable();
    if (changes['url'] && this.url) this.loadData();
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  // ================= CORE =================

  private initializeTable() {
    this.visibleColumns = this.config.columns
      .filter((c) => !c.hidden)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (this.config.pagination) {
      this.internalState.pagination = { ...this.config.pagination };
      this.firstRecord =
        (this.internalState.pagination.currentPage - 1) * this.internalState.pagination.pageSize;
      this.totalRecords = this.config.pagination.totalItems || 0;
    }

    if (this.config.sort) {
      this.internalState.sort = { ...this.config.sort };
      this.currentSort = this.config.sort;
    }

    if (this.config.filters) {
      this.internalState.filters = { ...this.config.filters };
      this.filterInputs = { ...this.config.filters };
    }

    this.clearSelection();
  }

  private loadData() {
    if (!this.url) return;

    this.loading = true;
    this.error = null;

    const state = {
      page: this.internalState.pagination.currentPage,
      pageSize: this.internalState.pagination.pageSize,
      sortBy: this.internalState.sort?.column,
      sortDir: this.internalState.sort?.direction,
      filters: this.internalState.filters,
    };

    this.componentService.load(this.url, state).subscribe({
      next: (res: any) => {
        this.data = res.items || res.data || [];
        this.totalRecords = res.total || res.totalItems || 0;

        this.internalState.pagination.totalItems = this.totalRecords;
        if (this.config.pagination) this.config.pagination.totalItems = this.totalRecords;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load data';
        this.loading = false;
      },
    });
  }

  // ================= EVENTS =================

  refresh() {
    this.loadData();
    this.tableEvent.emit({ type: 'refresh', data: null });
  }

  handleSort(event: any) {
    if (!this.config.serverSide) return;

    const sortConfig: SortConfig = {
      column: event.field,
      direction: event.order === 1 ? 'asc' : 'desc',
    };

    this.internalState.sort = sortConfig;
    this.currentSort = sortConfig;
    this.loadData();
    this.tableEvent.emit({ type: 'sort', data: sortConfig });
  }

  handlePageChange(event: any) {
    if (!this.config.serverSide) return;

    const newPage = Math.floor(event.first / event.rows) + 1;
    this.internalState.pagination.currentPage = newPage;
    this.firstRecord = event.first;
    this.loadData();
    this.tableEvent.emit({ type: 'page', data: newPage });
  }

  handlePageSizeChange(event: any) {
    const pageSize = event.target?.value || event;

    this.internalState.pagination.pageSize = pageSize;
    this.internalState.pagination.currentPage = 1;
    this.firstRecord = 0;
    this.loadData();
    this.tableEvent.emit({ type: 'pageSize', data: pageSize });
  }

  handleFilter(key: string, value: any) {
    const newFilters = { ...this.filterInputs };

    if (!value) delete newFilters[key];
    else newFilters[key] = value;

    this.filterInputs = newFilters;
    this.filterSubject.next(newFilters);
  }

  handleRowClick(row: any) {
    this.onRowClick.emit(row);
    this.tableEvent.emit({ type: 'rowClick', data: row });
  }

  toggleRowSelection(row: any) {
    const idx = this.selectedRows.indexOf(row);
    if (idx > -1) this.selectedRows.splice(idx, 1);
    else this.selectedRows.push(row);

    this.internalState.selection.selectedRows = [...this.selectedRows];
    this.onRowSelect.emit([...this.selectedRows]);
  }

  handleSelectAll() {
    this.selectedRows = this.selectAll ? [...this.data] : [];
    this.internalState.selection.selectedRows = [...this.selectedRows];
    this.onRowSelect.emit([...this.selectedRows]);
  }

  clearSelection() {
    this.selectedRows = [];
    this.selectAll = false;
    this.internalState.selection = { selectedRows: [], allSelected: false };
    this.onRowSelect.emit([]);
  }

  addNew() {
    this.onAdd.emit();
    this.tableEvent.emit({ type: 'add', data: null });
  }

  handleEdit(row: any) {
    this.onEdit.emit(row);
    this.tableEvent.emit({ type: 'edit', data: row });
  }

  handleDelete(row: any) {
    this.onDelete.emit(row);
    this.tableEvent.emit({ type: 'delete', data: row });
  }

  export(format: 'csv' | 'excel' | 'pdf') {
    this.onExport.emit(format);
    this.tableEvent.emit({ type: 'export', data: format });
  }

  // ================= DISPLAY =================

  getCellValue(row: any, column: ColumnDefinition): any {
    if (column.renderer) return column.renderer(row[column.key], row);

    const val = row[column.key];
    if (column.type === 'date' && val) return new Date(val).toLocaleDateString();
    if (column.type === 'currency' && val !== undefined)
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    if (column.type === 'boolean') return val ? 'Yes' : 'No';
    return val;
  }

  isColumnFilterable(column: ColumnDefinition): boolean {
    return !!column.filterType;
  }

  getFilterPlaceholder(column: ColumnDefinition): string {
    switch (column.filterType) {
      case 'text':
      case 'number':
        return `Enter ${column.label}`;
      case 'date':
        return `Select ${column.label}`;
      case 'boolean':
      case 'select':
      case 'multi-select':
        return `Select ${column.label}`;
      case 'range':
        return `Enter ${column.label} range`;
      default:
        return '';
    }
  }

  getRowClass(row: any): string {
    return this.selectedRows.includes(row) ? 'bg-blue-50' : '';
  }

  getColumnWidth(column: ColumnDefinition): string {
    return column.width || 'auto';
  }

  getCellClasses(column: ColumnDefinition): string {
    return column.cellClass || '';
  }

  getPageNumbers(): number[] {
    const totalItems = this.config.pagination?.totalItems || 0;
    const pageSize = this.internalState.pagination.pageSize || 10;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const currentPage = this.internalState.pagination.currentPage || 1;

    const pages: number[] = [];
    const maxVisible = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    startPage = Math.max(1, endPage - maxVisible + 1);

    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  }

  getHeaderClasses(column: ColumnDefinition): string {
    let classes = 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
    if (column.sortable) classes += ' cursor-pointer';
    return classes;
  }

  isRowSelected(row: any): boolean {
    return this.selectedRows.includes(row);
  }
}
