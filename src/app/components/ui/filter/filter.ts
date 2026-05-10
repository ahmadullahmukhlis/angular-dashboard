import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

/* PrimeNG */
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

/* Components */
import { SingleSelect } from '../single-select/single-select';

/* Models */
import { DynamicField } from '../../../models/fomrBuilderModel';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    TextareaModule,
    CheckboxModule,
    ToggleSwitchModule,
    PasswordModule,
    ButtonModule,
    SelectModule,
    SingleSelect,
  ],
  templateUrl: './filter.html',
  styleUrls: ['./filter.css'],
})
export class Filter implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) fields: DynamicField[] = [];
  @Input() className: string = '';
  @Input() searchKey: string = 'search';
  @Input() searchPlaceholder: string = 'Search records...';
  @Output() onFilter = new EventEmitter<any>();
  @Output() valuesChanged = new EventEmitter<any>();
  labelTypes = [
    'text',
    'number',
    'date',
    'textarea',
    'checkbox',
    'switch',
    'select',
    'server-select',
  ];

  form!: FormGroup;
  private formSub?: Subscription;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['fields'] || changes['searchKey']) {
      this.buildForm();
    }
  }

  ngOnDestroy() {
    this.formSub?.unsubscribe();
  }

  private buildForm() {
    this.formSub?.unsubscribe();

    const controls: Record<string, any> = {};
    controls[this.searchKey] = this.fb.control(null);

    this.fields.forEach((field) => {
      controls[field.name] = this.fb.control({
        value: field.defaultValue ?? null,
        disabled: field.disabled ?? false,
      });
    });

    this.form = this.fb.group(controls);
    this.syncDisabledStates();

    this.formSub = this.form.valueChanges.subscribe((values) => {
      this.syncDisabledStates();
      this.valuesChanged.emit(values);
    });
  }

  private syncDisabledStates() {
    if (!this.form) return;

    this.fields.forEach((field) => {
      const control = this.form.get(field.name);
      if (!control) return;

      const shouldDisable = field.disabledWhen ? field.disabledWhen(this.form.value) : field.disabled ?? false;
      if (shouldDisable && control.enabled) {
        control.disable({ emitEvent: false });
      } else if (!shouldDisable && control.disabled && !field.disabled) {
        control.enable({ emitEvent: false });
      }
    });
  }

  handleSelectChange(field: DynamicField, selected: any | any[]) {
    if (field.type === 'multi-select') {
      const values = selected?.map((item: any) =>
        field.changeValue ? item[field.changeValue] : item,
      );
      this.form.get(field.name)?.setValue(values);
    } else {
      const val = field.changeValue ? selected?.[field.changeValue] : selected;
      this.form.get(field.name)?.setValue(val);
    }

    field.onSelect?.(selected, this.form);
  }

  applyFilter() {
    this.onFilter.emit(this.form.value);
  }
}
