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
  Renderer2,
  AfterViewInit
} from '@angular/core';
import {Table, TableModule} from 'primeng/table';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {FormsModule, NgModel} from '@angular/forms'; // Make sure FormsModule is imported in the module

// Import your interfaces
import {
  ColumnDefinition,
  DataTableConfig,
  SortConfig,
  PaginationConfig,
  TableEvent,
  FilterState,
  TableState
} from '../../../models/datatable.model';

// Import helper
import { DatatableHelpers } from '../../../helpers/datatable-helpers';

@Component({
  selector: 'app-datatable',
  templateUrl: './datatable.html',
  styleUrls: ['./datatable.css'],
  standalone: true, // ✅ mark as standalone
  imports: [
    TableModule, // PrimeNG Table
    FormsModule, // ngModel for filters
  ]
})
export class Datatable implements OnInit, OnChanges, AfterViewInit {
  @Input() config: DataTableConfig = {
    columns: [],
    data: [],
    pagination: {
      pageSize: 10,
      currentPage: 1,
      totalItems: 0,
      pageSizeOptions: [5, 10, 25, 50, 100]
    }
  };

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

  @ViewChild('dt') dt!: Table;
  @ViewChild('tableContainer') tableContainer!: ElementRef;

  internalState: TableState = {
    sort: null,
    filters: {},
    pagination: {
      pageSize: 10,
      currentPage: 1,
      totalItems: 0,
      pageSizeOptions: [5, 10, 25, 50, 100]
    },
    selection: {
      selectedRows: [],
      allSelected: false
    }
  };

  filterInputs: { [key: string]: any } = {};
  private filterSubject = new Subject<FilterState>();

  currentSort: SortConfig | null = null;
  selectedRows: any[] = [];
  selectAll: boolean = false;

  showFilters: boolean = false;
  visibleColumns: ColumnDefinition[] = [];
  pinnedLeftColumns: ColumnDefinition[] = [];
  pinnedRightColumns: ColumnDefinition[] = [];
  regularColumns: ColumnDefinition[] = [];
  customTemplates: { [key: string]: TemplateRef<any> } = {};

  firstRecord: number = 0;
  totalRecords: number = 0;

  isMobileView: boolean = false;
  screenWidth: number = 0;

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  ngOnInit() {
    this.initializeTable();

    this.filterSubject.pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(filters => {
          this.internalState.filters = filters;
          this.onFilter.emit(filters);
          this.tableEvent.emit({ type: 'filter', data: filters });
        });

    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config']) {
      this.initializeTable();
    }

    if (changes['loading'] && this.loading) {
      this.internalState.selection.selectedRows = [];
      this.internalState.selection.allSelected = false;
    }
  }

  ngAfterViewInit() {
    this.setupKeyboardNavigation();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', () => this.checkScreenSize());
  }

  private initializeTable() {
    this.visibleColumns = this.config.columns.filter(c => !c.hidden).sort((a, b) => (a.order || 0) - (b.order || 0));
    this.pinnedLeftColumns = this.visibleColumns.filter(c => c.pinned === 'left');
    this.pinnedRightColumns = this.visibleColumns.filter(c => c.pinned === 'right');
    this.regularColumns = this.visibleColumns.filter(c => !c.pinned);

    if (this.config.pagination) {
      this.internalState.pagination = { ...this.config.pagination };
      this.firstRecord = (this.internalState.pagination.currentPage - 1) * this.internalState.pagination.pageSize;
      this.totalRecords = this.internalState.pagination.totalItems;
    }

    if (this.config.filters) {
      this.internalState.filters = { ...this.config.filters };
      this.filterInputs = { ...this.config.filters };
    }

    if (this.config.sort) {
      this.internalState.sort = { ...this.config.sort };
      this.currentSort = this.config.sort;
    }

    this.internalState.selection = { selectedRows: [], allSelected: false };
  }

  private checkScreenSize() {
    this.screenWidth = window.innerWidth;
    this.isMobileView = this.screenWidth < 768;
  }

  private setupKeyboardNavigation() {
    this.renderer.listen(this.el.nativeElement, 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') this.handleKeyboardNavigation(event);
    });
  }

  // ====== PUBLIC METHODS ======

  clearFilters() {
    this.filterInputs = {};
    this.internalState.filters = {};
    this.onFilter.emit({});
    this.tableEvent.emit({ type: 'filter', data: {} });
  }

  clearSelection() {
    this.selectedRows = [];
    this.selectAll = false;
    this.internalState.selection = { selectedRows: [], allSelected: false };
    this.onRowSelect.emit([]);
  }

  refresh() {
    this.onRefresh.emit();
    this.tableEvent.emit({ type: 'refresh', data: null });
  }

  export(format: 'csv' | 'excel' | 'pdf') {
    this.onExport.emit(format);
    this.tableEvent.emit({ type: 'export', data: format });
  }

  addNew() {
    this.onAdd.emit();
    this.tableEvent.emit({ type: 'add', data: null });
  }

  handleSort(event: any) {
    if (this.config.serverSide) {
      const sortConfig: SortConfig = { column: event.field, direction: event.order === 1 ? 'asc' : 'desc' };
      this.internalState.sort = sortConfig;
      this.currentSort = sortConfig;
      this.onSort.emit(sortConfig);
      this.tableEvent.emit({ type: 'sort', data: sortConfig });
    }
  }

  handlePageChange(event: any) {
    if (this.config.serverSide) {
      const newPage = Math.floor(event.first / event.rows) + 1;
      this.internalState.pagination.currentPage = newPage;
      this.firstRecord = event.first;
      this.onPageChange.emit(newPage);
      this.tableEvent.emit({ type: 'page', data: newPage });
    }
  }

  handlePageSizeChange(event: any) {
    const pageSize = event.target?.value || event;
    this.internalState.pagination.pageSize = pageSize;
    this.internalState.pagination.currentPage = 1;
    this.firstRecord = 0;
    this.onPageSizeChange.emit(pageSize);
  }

  handleFilter(key: string, value: any) {
    const newFilters = { ...this.filterInputs };
    if (value === null || value === undefined || value === '') delete newFilters[key];
    else newFilters[key] = value;

    this.filterInputs = newFilters;
    this.filterSubject.next(newFilters);
  }

  handleRowClick(row: any) { this.onRowClick.emit(row); this.tableEvent.emit({ type: 'rowClick', data: row }); }
  handleSelectionChange() {
    this.internalState.selection.selectedRows = this.selectedRows;
    this.internalState.selection.allSelected = this.selectAll;
    this.onRowSelect.emit(this.selectedRows);
    this.tableEvent.emit({ type: 'select', data: this.selectedRows });
  }

  handleEdit(row: any) { this.onEdit.emit(row); this.tableEvent.emit({ type: 'edit', data: row }); }
  handleDelete(row: any) { this.onDelete.emit(row); this.tableEvent.emit({ type: 'delete', data: row }); }

  handleSelectAll() {
    this.selectedRows = this.selectAll ? [...this.config.data] : [];
    this.handleSelectionChange();
  }

  getCellValue(row: any, column: ColumnDefinition): any {
    if (column.renderer) return column.renderer(row[column.key], row);

    const value = row[column.key];
    if (column.type === 'date' && value) return new Date(value).toLocaleDateString();
    if (column.type === 'currency' && value !== undefined) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    if (column.type === 'boolean') return value ? 'Yes' : 'No';
    return value;
  }

  getHeaderClasses(column: ColumnDefinition): string { return DatatableHelpers.getActionButtonClass(column as any); }
  getActionButtonClass(action: any): string { return DatatableHelpers.getActionButtonClass(action); }
  getPageButtonClass(page: number): string { return DatatableHelpers.getPageButtonClass(page); }
  getPageNumbers(): number[] {
    const totalItems = this.config.pagination?.totalItems || 0;
    const pageSize = this.internalState.pagination.pageSize || 10;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const currentPage = this.internalState.pagination.currentPage || 1;

    const pages: number[] = [];

    // Optional: show max 5 page numbers around current
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    // Adjust start if end hits totalPages
    startPage = Math.max(1, endPage - maxVisible + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  getColumnLabel(key: string): string { return DatatableHelpers.getColumnLabel(key, this.config.columns); }

  private handleKeyboardNavigation(event: KeyboardEvent) { event.preventDefault(); /* TODO */ }
  // Add inside your Datatable class (Datatable.ts)

// Check if a column is filterable
  isColumnFilterable(column: ColumnDefinition): boolean {
    return !!column.filterType;
  }

// Get placeholder text for a filter input
  getFilterPlaceholder(column: ColumnDefinition): string {
    switch (column.filterType) {
      case 'text':
        return `Enter ${column.label}`;
      case 'number':
        return `Enter ${column.label}`;
      case 'date':
        return `Select ${column.label}`;
      case 'boolean':
        return `Select ${column.label}`;
      case 'select':
      case 'multi-select':
        return `Select ${column.label}`;
      case 'range':
        return `Enter ${column.label} range`;
      default:
        return '';
    }
  }

// Get CSS classes for table rows (optional: highlight selected rows)
  getRowClass(row: any): string {
    return this.isRowSelected(row) ? 'bg-blue-50' : '';
  }

// Get inline styles for table rows (if needed)
  getRowStyle(row: any): any {
    return {};
  }

// Check if a row is selected
  isRowSelected(row: any): boolean {
    return this.selectedRows.includes(row);
  }

// Toggle selection of a single row
  toggleRowSelection(row: any) {
    const index = this.selectedRows.indexOf(row);
    if (index > -1) {
      this.selectedRows.splice(index, 1);
    } else {
      this.selectedRows.push(row);
    }
    this.handleSelectionChange();
  }

// Get width of a column
  getColumnWidth(column: ColumnDefinition): string {
    return column.width ? column.width : 'auto';
  }

// Get CSS classes for a cell
  getCellClasses(column: ColumnDefinition): string {
    return column.cellClass || '';
  }


  protected readonly Math = Math;
}
