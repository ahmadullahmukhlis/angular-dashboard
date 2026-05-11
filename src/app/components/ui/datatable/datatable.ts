
import {
  ChangeDetectorRef,
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  inject,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

import {
  ColumnDefinition,
  DataTableConfig,
  SortConfig,
  FilterState,
  TableState,
  TableEvent,
} from '../../../models/datatable.model';
import { ComponentService } from '../../../services/genral/component.service';
import { Paginator } from 'primeng/paginator';
import { NgClass } from '@angular/common';
import { Modal } from '../modal/modal';
import { Filter } from '../filter/filter';
import { Loading } from '../loading/loading';
import { Error } from '../error/error';
import { AppErrorService } from '../../../services/genral/app-error.service';
import { AppErrorState } from '../../../models/app-error.model';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { ToastService } from '../../../services/genral/tost.service';

@Component({
  selector: 'app-datatable',
  templateUrl: './datatable.html',
  styleUrls: ['./datatable.css'],
  standalone: true,
  imports: [TableModule, FormsModule, Paginator, NgClass, Modal, Filter, Loading, Error],
})
export class Datatable implements OnInit, OnChanges {
  private readonly compactBreakpoint = 768;
  // ✅ API URL
  @Input() url!: string;
  @Input() name!: string;
  @Input() config: DataTableConfig = {
    columns: [],
  };
  @Input() tableName: string | null = null; // optional, used for parent-triggered revalidate
  @Input() rows: any[] = [];
  @Input() hidePagination = false;
  @Input() showDetails = false;
  @Input() hiddenHeader = false;

  filterModal: boolean = false;
  private readonly elRef = inject(ElementRef);
  loading: boolean = false;
  error: AppErrorState | null = null;

  data: any[] = [];
  totalRecords: number = 0; // total records for pagination
  totalPages: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;

  @Output() onRowClick = new EventEmitter<any>();
  @Output() onRowSelect = new EventEmitter<any[]>();
  @Output() onAdd = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onExport = new EventEmitter<'csv' | 'excel' | 'pdf'>();
  @Output() tableEvent = new EventEmitter<TableEvent>();
  @Input() tableSize = 'sm';

  @ViewChild('dt') dt!: ElementRef;

  internalState: TableState = {
    sort: null,
    filters: {},
    selection: { selectedRows: [], allSelected: false },
  };

  filterInputs: { [key: string]: any } = {};
  private filterSubject = new Subject<FilterState>();
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  currentSort: SortConfig | null = null;
  selectedRows: any[] = [];
  activeRow: any | null = null;
  activeRowKey: string | number | null = null;
  selectAll: boolean = false;
  visibleColumns: ColumnDefinition[] = [];
  showFilters: boolean = false;
  selectedDetailRow: any | null = null;
  activeDetailTab = 'general';
  private componentService = inject(ComponentService);
  private errorService = inject(AppErrorService);
  private sub!: Subscription;
  exportOpen: boolean = false;
  isCompactView: boolean = false;
  rowActionMenuPosition: { [key: string]: { top: number; left: number } } = {};
  private rowActionCloseTimer: ReturnType<typeof setTimeout> | null = null;

  // ================= LIFECYCLE =================

  ngOnInit() {
    this.updateResponsiveState();
    this.initializeTable();

    this.filterSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe((filters) => {
      this.internalState.filters = filters;
      this.currentPage = 1; // reset to first page on filter change
      this.loadData();
    });

    if (this.url) {
      this.pageSize = 10;
      this.loadData();
    } else {
      this.syncLocalRows();
    }

    // Listen for parent-triggered revalidation
    this.sub = this.componentService.revalidate$.subscribe((value) => {
      if (value && (value === this.tableName || value === '*')) {
        this.refresh(); // refresh already calls loadData and emits tableEvent
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config']) this.initializeTable();
    if (changes['url'] && this.url) {
      this.currentPage = 1;
      this.internalState.filters = {};
      this.filterInputs = {};
      this.currentSort = null;
      this.loadData();
    }
    if (changes['rows'] && !this.url) this.syncLocalRows();
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.updateResponsiveState();
  }

  showMoreFilters() {
    this.showFilters = true;
  }
  closemodal() {
    this.showFilters = false;
  }

  // ================= CORE =================

  private initializeTable() {
    this.visibleColumns = this.config.columns
      .filter((c) => !c.hidden)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (this.config.sort) {
      this.internalState.sort = { ...this.config.sort };
      this.currentSort = this.config.sort;
    }

    if (this.config.filters) {
      this.internalState.filters = { ...this.config.filters };
      this.filterInputs = { ...this.config.filters };
    }

    this.pageSize = 10;
    this.clearSelection();
  }

  private syncLocalRows() {
    Promise.resolve().then(() => {
      this.data = [...(this.rows || [])];
      this.totalRecords = this.data.length;
      this.totalPages = this.data.length > 0 ? 1 : 0;
      this.syncActiveRowReference();
      this.loading = false;
      this.error = null;
      this.cdr.detectChanges();
    });
  }
  private exportToCsv(data: any[], filename: string): void {
    if (data.length === 0) {
      this.toastService.warn('Export unavailable', 'There is no data to export.');
      return;
    }

    const csvContent = this.convertToCsv(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // 2. Excel Export (Using SheetJS)
  private exportToExcel(data: any[], filename: string): void {
    if (data.length === 0) {
      this.toastService.warn('Export unavailable', 'There is no data to export.');
      return;
    }

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  private downloadFile(data: any[], filename: string, type: 'csv' | 'excel' | 'pdf'): void {
    switch (type) {
      case 'csv':
        this.exportToCsv(data, filename);
        break;
      case 'excel':
        this.exportToExcel(data, filename);
        break;
      case 'pdf':
        this.exportToPdf(data, filename);
        break;
    }
  }

  // 3. PDF Export (Using jsPDF)
  private exportToPdf(data: any[], filename: string): void {
    if (data.length === 0) {
      this.toastService.warn('Export unavailable', 'There is no data to export.');
      return;
    }

    const doc = new jsPDF();

    // 2. Extract headers
    const head = [Object.keys(data[0])];

    // 3. Map values and cast explicitly to RowInput[]
    const body = data.map((item) => Object.values(item)) as RowInput[];

    autoTable(doc, {
      head: head,
      body: body,
    });

    doc.save(`${filename}.pdf`);
  }

  private convertToCsv(data: any[]): string {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  }

  private loadData() {
    if (!this.url) {
      this.syncLocalRows();
      return;
    }

    this.loading = true;
    this.error = null;

    const state = {
      page: this.currentPage || 1,
      pageNum: Math.max((this.currentPage || 1) - 1, 0),
      pageSize: this.pageSize || 10,
      sortBy: this.internalState.sort?.column || null,
      sortDir: this.internalState.sort?.direction || null,
      filters: this.internalState.filters || {}, // always object
    };

    this.componentService.load(this.url, state).subscribe({
      next: (res: any) => {
        this.data = res.content || res.items || res.data || res.results || res || [];
        this.currentPage = res.current_page || this.currentPage || 1;
        this.pageSize = res.per_page || this.pageSize || 10;
        this.totalRecords = res.total || res.totalElements || res.totalRecords || this.data.length;
        this.totalPages = res.last_page || res.totalPages || 0;
        this.syncActiveRowReference();
        this.loading = false;
        this.error = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = this.errorService.normalize(err, this.name || this.url || 'table data');
        this.loading = false;
        this.toastService.dataLoadingError(this.error.message);
        this.cdr.detectChanges();
      },
    });
  }

  // ================= EVENTS =================

  refresh() {
    if (this.url) {
      this.loadData();
    } else {
      this.syncLocalRows();
    }
    this.tableEvent.emit({ type: 'refresh', data: null });
    console.log('Data table refreshed', this.totalRecords);
  }
  toggleExport() {
    this.exportOpen = !this.exportOpen;
  }

  handleSort(event: any) {
    if (!this.url) return;

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
    // PrimeNG paginator emits first item index (0-based)
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.pageSize = event.rows;

    console.log('Page Change Event:', event, ' -> currentPage:', this.currentPage);

    this.loadData();
  }

  handleFilter(key: string, value: any) {
    const newFilters = { ...this.filterInputs };

    if (!value) delete newFilters[key];
    else newFilters[key] = value;

    this.filterInputs = newFilters;
    this.filterSubject.next(newFilters);
  }

  get searchKey(): string {
    return this.config.searchKey || 'search';
  }

  handleRowClick(row: any) {
    if (this.showDetails) {
      this.selectedDetailRow = row;
      this.activeDetailTab = this.buildDetailTabs(row)[0]?.key || 'general';
    }
    this.config.onRowClick?.(row);
    this.onRowClick.emit(row);
    this.tableEvent.emit({ type: 'rowClick', data: row });
  }

  toggleRowSelection(row: any) {
    const idx = this.selectedRows.indexOf(row);

    if (idx > -1) {
      this.selectedRows.splice(idx, 1);
    } else {
      this.selectedRows.push(row);
    }

    // Update selectAll state
    this.selectAll = this.selectedRows.length === this.data.length && this.data.length > 0;

    this.internalState.selection.selectedRows = [...this.selectedRows];
    this.onRowSelect.emit([...this.selectedRows]);
  }

  handleSelectAll() {
    this.selectAll = !this.selectAll;

    this.selectedRows = this.selectAll ? [...this.data] : [];

    this.internalState.selection.selectedRows = [...this.selectedRows];
    this.onRowSelect.emit([...this.selectedRows]);
  }

  clearSelection() {
    this.selectedRows = [];
    this.selectAll = false;
    this.internalState.selection = { selectedRows: [], allSelected: false };
    this.activeRow = null;
    this.activeRowKey = null;
  }

  addNew() {
    if (this.config?.onAdd) {
      this.config.onAdd();
    }
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
  private getVisibleData(): any[] {
    return this.data.map((row) => {
      const filteredRow: any = {};
      this.visibleColumns.forEach((col) => {
        filteredRow[col.label || col.key] = this.getExportValue(row, col);
      });
      return filteredRow;
    });
  }

  export(format: 'csv' | 'excel' | 'pdf') {
    this.onExport.emit(format);
    this.tableEvent.emit({ type: 'export', data: format });

    const dataToExport = this.getVisibleData(); // only visible columns
    this.downloadFile(dataToExport, this.tableName || 'export', format);
  }

  rowAction(row: any, action: any) {
    if (action.confirm) {
      this.toastService.confirmAction({ name: action.confirm.message }, () => action.action(row));
    } else {
      action.action(row);
    }
  }
  // ================= DISPLAY =================

  private resolveValue(row: any, key: string): any {
    if (!row || !key) return undefined;

    return key.split('.').reduce((current, part) => current?.[part], row);
  }

  getCellValue(row: any, column: ColumnDefinition): any {
    const val = this.resolveValue(row, column.key);

    // 1️⃣ Use custom renderer if defined
    if (column.renderer) return column.renderer(val, row);

    // 2️⃣ Validation message if defined
    if (column.validation) {
      const validationResult = column.validation(val);
      if (validationResult) return validationResult;
    }

    // 3️⃣ Type-based formatting
    switch (column.type) {
      case 'date':
        return val ? new Date(val).toLocaleDateString() : '';
      case 'currency':
        return val !== undefined
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
          : '';
      case 'boolean':
        return val ? 'Yes' : 'No';
      case 'number':
        return val !== undefined ? val : '';
      case 'select':
        // Show label from filterOptions if exists
        if (column.filterOptions && val !== undefined && val !== null) {
          const option = column.filterOptions.find((o) => o.value === val);
          return option ? option.label : val;
        }
        return val ?? '';
      case 'custom':
        return val ?? '';
      case 'action':
        return ''; // actions are handled in template
      default:
        return val ?? '';
    }
  }

  getCellDisplayValue(row: any, column: ColumnDefinition): string {
    const value = this.getCellValue(row, column);
    return value === null || value === undefined || value === '' ? '—' : String(value);
  }

  getCellTitle(row: any, column: ColumnDefinition): string {
    return this.stripHtml(this.getCellDisplayValue(row, column));
  }

  getColumnAlignmentClass(column: ColumnDefinition): string {
    switch (column.align) {
      case 'right':
        return 'text-right';
      case 'center':
        return 'text-center';
      default:
        return 'text-left';
    }
  }

  private getExportValue(row: any, column: ColumnDefinition): string {
    return this.stripHtml(this.getCellDisplayValue(row, column));
  }

  private stripHtml(value: string): string {
    return value
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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
    const classes = [];

    if (this.selectedDetailRow === row) {
      classes.push('!bg-[#fff5b8]', 'hover:!bg-[#ffef9c]');
    }

    if (this.selectedRows.includes(row)) {
      classes.push('bg-blue-50');
    }

    if (this.config.rowClass) {
      const customClass = this.config.rowClass(row);
      if (customClass) classes.push(customClass);
    }

    return classes.join(' ').trim();
  }

  getColumnWidth(column: ColumnDefinition): string {
    return column.width || 'auto';
  }

  getCellClasses(column: ColumnDefinition): string {
    return `${this.getColumnAlignmentClass(column)} ${column.cellClass || column.className || ''}`.trim();
  }

  getHeaderClasses(column: ColumnDefinition): string {
    let classes = 'whitespace-nowrap text-[12px] font-semibold text-white';
    if (column.sortable) classes += ' cursor-pointer';
    classes += ` ${this.getColumnAlignmentClass(column)} ${column.headerClass || ''}`;
    return classes;
  }

  getVisibleRowActions(row: any) {
    return (this.config.rowActions || []).filter((action) => !action.hidden?.(row));
  }

  closeDetails() {
    this.selectedDetailRow = null;
    this.activeDetailTab = 'general';
  }

  get detailTabs(): Array<{
    key: string;
    label: string;
    rows: Array<Array<{ label: string; value: string }>>;
  }> {
    return this.buildDetailTabs(this.selectedDetailRow);
  }

  get activeDetailRows(): Array<Array<{ label: string; value: string }>> {
    return this.detailTabs.find((tab) => tab.key === this.activeDetailTab)?.rows || [];
  }

  get detailArrayTables(): Array<{
    label: string;
    columns: string[];
    rows: string[][];
  }> {
    return this.getArrayTables(this.selectedDetailRow);
  }

  selectDetailTab(key: string) {
    this.activeDetailTab = key;
  }

  isDetailTabActive(key: string): boolean {
    return this.activeDetailTab === key;
  }

  private buildDetailTabs(row: any): Array<{
    key: string;
    label: string;
    rows: Array<Array<{ label: string; value: string }>>;
  }> {
    if (!row || typeof row !== 'object') return [];

    const tabs: Array<{
      key: string;
      label: string;
      rows: Array<Array<{ label: string; value: string }>>;
    }> = [];

    const generalEntries = this.getGeneralEntries(row);
    if (generalEntries.length > 0) {
      tabs.push({
        key: 'general',
        label: 'General',
        rows: this.chunkDetailEntries(generalEntries),
      });
    }

    Object.entries(row).forEach(([key, value]) => {
      if (
        key === 'general' ||
        value === null ||
        value === undefined ||
        Array.isArray(value) ||
        typeof value !== 'object' ||
        value instanceof Date
      ) {
        return;
      }

      const entries = this.flattenObjectEntries(value);
      if (entries.length > 0) {
        tabs.push({
          key,
          label: this.getDetailTabLabel(key),
          rows: this.chunkDetailEntries(entries),
        });
      }
    });

    return tabs;
  }

  private getGeneralEntries(row: any): Array<{ label: string; value: string }> {
    const visibleColumnEntries = this.visibleColumns
      .filter((column) => !column.key.includes('.'))
      .map((column) => ({
        key: column.key,
        label: column.label,
        value: this.getCellDisplayValue(row, column),
      }))
      .filter((item) => item.value !== '—');

    const seen = new Set(visibleColumnEntries.map((item) => item.key));
    const primitiveEntries = Object.entries(row)
      .filter(
        ([key, value]) =>
          !seen.has(key) &&
          !Array.isArray(value) &&
          (value === null ||
            value === undefined ||
            typeof value !== 'object' ||
            value instanceof Date),
      )
      .map(([key, value]) => ({
        label: this.formatDetailLabel(key),
        value: this.stringifyDetailValue(value),
      }))
      .filter((item) => item.value !== '—');

    return [
      ...visibleColumnEntries.map(({ label, value }) => ({ label, value })),
      ...primitiveEntries,
    ];
  }

  private flattenObjectEntries(
    value: any,
    parentKey = '',
  ): Array<{ label: string; value: string }> {
    if (value === null || value === undefined) return [];

    if (Array.isArray(value)) return [];

    if (typeof value !== 'object' || value instanceof Date) {
      return parentKey
        ? [{ label: this.formatDetailLabel(parentKey), value: this.stringifyDetailValue(value) }]
        : [];
    }

    const entries: Array<{ label: string; value: string }> = [];
    Object.entries(value).forEach(([key, nestedValue]) => {
      const nextKey = parentKey ? `${parentKey}.${key}` : key;
      if (
        nestedValue !== null &&
        typeof nestedValue === 'object' &&
        !(nestedValue instanceof Date) &&
        !Array.isArray(nestedValue)
      ) {
        entries.push(...this.flattenObjectEntries(nestedValue, nextKey));
      } else if (!Array.isArray(nestedValue)) {
        const stringValue = this.stringifyDetailValue(nestedValue);
        if (stringValue !== '—') {
          entries.push({
            label: this.formatDetailLabel(nextKey),
            value: stringValue,
          });
        }
      }
    });

    return entries;
  }

  private chunkDetailEntries(entries: Array<{ label: string; value: string }>) {
    const chunkSize = 4;
    const rows: Array<Array<{ label: string; value: string }>> = [];

    for (let i = 0; i < entries.length; i += chunkSize) {
      rows.push(entries.slice(i, i + chunkSize));
    }

    return rows;
  }

  private getArrayTables(row: any): Array<{ label: string; columns: string[]; rows: string[][] }> {
    if (!row || typeof row !== 'object') return [];

    return Object.entries(row)
      .filter(([, value]) => Array.isArray(value) && value.length > 0)
      .map(([key, value]) => this.buildArrayTable(key, value as any[]))
      .filter((table): table is { label: string; columns: string[]; rows: string[][] } => !!table);
  }

  private buildArrayTable(
    key: string,
    items: any[],
  ): { label: string; columns: string[]; rows: string[][] } | null {
    if (!items.length) return null;

    if (items.every((item) => item !== null && typeof item === 'object' && !Array.isArray(item))) {
      const columnSet = new Set<string>();
      items.forEach((item) => {
        Object.keys(item).forEach((column) => columnSet.add(column));
      });

      const columns = Array.from(columnSet);
      const rows = items.map((item) =>
        columns.map((column) => this.stringifyDetailValue(item?.[column])),
      );

      return {
        label: this.formatDetailLabel(key),
        columns: columns.map((column) => this.formatDetailLabel(column)),
        rows,
      };
    }

    return {
      label: this.formatDetailLabel(key),
      columns: ['Value'],
      rows: items.map((item) => [this.stringifyDetailValue(item)]),
    };
  }

  private stringifyDetailValue(value: any): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toLocaleString();
    return String(value);
  }

  private formatDetailLabel(key: string): string {
    return key
      .split('.')
      .map((part) =>
        part
          .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
          .replace(/[_-]+/g, ' ')
          .replace(/^./, (char) => char.toUpperCase()),
      )
      .join(' ');
  }

  private getDetailTabLabel(key: string): string {
    const labels: Record<string, string> = {
      fromInstitution: 'From Institution',
      toInstitution: 'To Institution',
      exchangeRate: 'Exchange Rate',
      requestedBy: 'Requested By',
      normalizedCurrency: 'Normalized Currency',
    };

    return labels[key] || this.formatDetailLabel(key);
  }

  isRowSelected(row: any): boolean {
    return this.selectedRows.includes(row);
  }

  private getRowKey(row: any): string | number | null {
    if (!row || typeof row !== 'object') return null;
    return row.id ?? row.uuid ?? row.code ?? null;
  }

  private setActiveRow(row: any) {
    this.activeRow = row;
    this.activeRowKey = this.getRowKey(row);
  }

  private syncActiveRowReference() {
    if (!this.activeRow) return;

    if (this.activeRowKey !== null) {
      const matched = this.data.find((row) => this.getRowKey(row) === this.activeRowKey);
      this.activeRow = matched ?? null;
      if (!matched) this.activeRowKey = null;
      return;
    }

    const stillExists = this.data.includes(this.activeRow);
    if (!stillExists) this.activeRow = null;
  }

  isActiveRow(row: any): boolean {
    if (!this.activeRow) return false;
    if (this.activeRowKey !== null) return this.getRowKey(row) === this.activeRowKey;
    return row === this.activeRow;
  }
  rowActionMenuOpen: { [key: string]: boolean } = {};

  openRowActions(row: any, event?: MouseEvent) {
    const key = row.id || row.key || JSON.stringify(row);
    const isAlreadyOpen = !!this.rowActionMenuOpen[key];

    if (isAlreadyOpen) {
      this.closeAllRowActions();
      return;
    }

    this.clearRowActionCloseTimer();

    // Close all other menus first
    Object.keys(this.rowActionMenuOpen).forEach((k) => {
      if (k !== key) this.rowActionMenuOpen[k] = false;
    });

    this.rowActionMenuOpen[key] = true;

    if (event?.currentTarget instanceof HTMLElement) {
      const rect = event.currentTarget.getBoundingClientRect();
      const menuWidth = 180;
      const padding = 8;
      const left = Math.min(window.innerWidth - menuWidth - padding, Math.max(padding, rect.right - menuWidth));
      const top = rect.bottom + 6;
      this.rowActionMenuPosition[key] = { top, left };
    }
  }

  scheduleCloseRowActions() {
    this.clearRowActionCloseTimer();
    this.rowActionCloseTimer = setTimeout(() => {
      this.closeAllRowActions();
    }, 120);
  }

  private clearRowActionCloseTimer() {
    if (this.rowActionCloseTimer) {
      clearTimeout(this.rowActionCloseTimer);
      this.rowActionCloseTimer = null;
    }
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;

    // --- Handle row action menus ---
    const insideRowMenu = target.closest('.row-action-container');
    if (!insideRowMenu) {
      this.closeAllRowActions(); // close any open row menus
    }

    // --- Handle export dropdown ---
    const clickedInsideExport = this.elRef.nativeElement.contains(target);
    if (!clickedInsideExport) {
      this.exportOpen = false; // close export menu if clicked outside
    }
  }

  isRowActionsOpen(row: any) {
    const key = row.id || row.key || JSON.stringify(row);
    return !!this.rowActionMenuOpen[key];
  }

  getRowActionKey(row: any): string {
    return row.id || row.key || JSON.stringify(row);
  }

  closeAllRowActions() {
    this.clearRowActionCloseTimer();
    this.rowActionMenuOpen = {};
    this.rowActionMenuPosition = {};
  }
  applyFilters(filters: any) {
    this.internalState.filters = filters;
    console.log('Applying filters:', filters);
    this.currentPage = 1;
    this.showFilters = false;
    this.loadData();
  }
  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  private updateResponsiveState() {
    if (typeof window === 'undefined') return;
    this.isCompactView = window.innerWidth < this.compactBreakpoint;
  }
}
