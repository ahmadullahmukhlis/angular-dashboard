import { Component, inject, Input, OnChanges, OnInit, SimpleChanges, Output, EventEmitter, forwardRef, signal, OnDestroy } from '@angular/core';
import { ComponentService } from '../../../services/genral/component.service';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-single-select',
  standalone: true,
  imports: [FormsModule, SelectModule],
  templateUrl: './single-select.html',
  styleUrls: ['./single-select.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SingleSelect),
      multi: true,
    },
  ],
})
export class SingleSelect implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {
  @Input() url?: string;
  @Input() optionLabel!: string;
  @Input() optionValue!: string;
  @Input() placeholder: string = 'Select';
  @Input() showClear: boolean = true;
  @Input() isSearable: boolean = true;
  @Input() multiple: boolean = false;
  @Input() disabled: boolean = false;

  @Output() valueChange = new EventEmitter<any>();

  options = signal<any[]>([]);
  loading = signal(false);
  disabledState = signal(false);
  private initialized = false;
  private loadTimer: ReturnType<typeof setTimeout> | null = null;

  // Internal value for ngModel / formControl
  selected = signal<any>(null);

  componentService = inject(ComponentService);

  // ControlValueAccessor callbacks
  private onChange: any = () => {};
  private onTouched: any = () => {};

  ngOnInit() {
    this.initialized = true;
    if (this.url && !this.disabled) this.scheduleLoad();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;

    if (changes['url'] && !this.url) {
      this.options.set([]);
      this.loading.set(false);
      return;
    }

    const urlChanged =
      !!changes['url'] && changes['url'].currentValue !== changes['url'].previousValue;
    const reEnabled =
      !!changes['disabled'] &&
      changes['disabled'].previousValue === true &&
      changes['disabled'].currentValue === false;

    if ((urlChanged || reEnabled) && this.url && !this.disabled) {
      this.scheduleLoad();
    }
  }

  ngOnDestroy() {
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
      this.loadTimer = null;
    }
  }

  private scheduleLoad() {
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
    }

    this.loadTimer = setTimeout(() => {
      this.loadTimer = null;
      this.loadOptions();
    }, 0);
  }

  loadOptions() {
    if (!this.url) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.componentService.getList(this.url ?? '').subscribe({
      next: (res) => {
        this.options.set([...(res ?? [])]);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  // Called by PrimeNG p-select
  onSelectChange(e: any) {
    this.selected.set(e.value);

    // 🔹 Update formControl if used
    this.onChange(this.selected());
    this.onTouched();

    // 🔹 Keep valueChange for filters / other uses
    this.valueChange.emit(this.selected());
  }

  // 🔹 ControlValueAccessor methods
  writeValue(value: any): void {
    this.selected.set(value); // 👈 defaultValue from formControl or edit data
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.disabledState.set(isDisabled);
  }
}
