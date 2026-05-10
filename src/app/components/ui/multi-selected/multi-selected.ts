import {
  Component,
  ChangeDetectorRef,
  EventEmitter,
  inject,
  Input,
  Output,
  forwardRef,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { ComponentService } from '../../../services/genral/component.service';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-multi-selected',
  standalone: true,
  imports: [FormsModule, MultiSelectModule], // 🔹 add FormsModule here!
  templateUrl: './multi-selected.html',
  styleUrls: ['./multi-selected.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelected),
      multi: true,
    },
  ],
})
export class MultiSelected implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {
  @Input() url!: string;
  @Input() optionsInput: any[] | null = null;
  @Input() optionLabel!: string;
  @Input() optionValue!: string;
  @Input() placeholder: string = 'Select';
  @Input() showClear: boolean = true;
  @Input() isSearable: boolean = true;
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<any>();

  options: any[] = [];
  loading = false;
  private initialized = false;
  private loadTimer: ReturnType<typeof setTimeout> | null = null;
  private lastLoadedUrl?: string;
  private cdr = inject(ChangeDetectorRef);

  // internal value for ngModel / formControl
  selected: any[] = [];

  componentService = inject(ComponentService);

  // ControlValueAccessor callbacks
  private onChange: any = () => {};
  private onTouched: any = () => {};

  ngOnInit() {
    this.initialized = true;
    if (this.hasStaticOptions()) {
      this.options = [...(this.optionsInput ?? [])];
      return;
    }
    if (this.url && !this.disabled) this.scheduleLoad();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;

    if (changes['optionsInput'] && this.hasStaticOptions()) {
      this.options = [...(this.optionsInput ?? [])];
      this.loading = false;
      this.lastLoadedUrl = undefined;
      return;
    }

    if (changes['url'] && !this.url) {
      this.options = [];
      this.loading = false;
      this.lastLoadedUrl = undefined;
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
    if (this.hasStaticOptions()) {
      this.options = [...(this.optionsInput ?? [])];
      this.loading = false;
      return;
    }

    if (!this.url || this.disabled) {
      this.options = [];
      this.loading = false;
      return;
    }

    if (this.lastLoadedUrl === this.url && this.options.length > 0) {
      return;
    }

    this.lastLoadedUrl = this.url;
    this.loading = true;

    this.componentService.getList(this.url).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.options = Array.isArray(res) ? [...res] : [];
          this.loading = false;
          this.cdr.detectChanges();
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.options = [];
          this.loading = false;
          this.cdr.detectChanges();
        }, 0);
      },
    });
  }

  // called by PrimeNG MultiSelect
  onSelectChange(e: any) {
    this.selected = e.value;

    // 🔹 update formControl if used
    this.onChange(this.selected);
    this.onTouched();

    // 🔹 keep valueChange for filters / other uses
    this.valueChange.emit(this.selected);
  }

  // 🔹 ControlValueAccessor methods
  writeValue(value: any): void {
    this.selected = value ?? [];
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;

    if (!isDisabled && this.url && this.options.length === 0 && !this.hasStaticOptions()) {
      this.scheduleLoad();
    }
  }

  private hasStaticOptions(): boolean {
    return Array.isArray(this.optionsInput);
  }
}
