import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';

/* PrimeNG 18+ Updated Imports */
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { RadioButton } from 'primeng/radiobutton';

/* Custom Components */
import { DynamicField } from '../../../models/fomrBuilderModel';
import { SingleSelect } from '../single-select/single-select';
import { MultiSelected } from '../multi-selected/multi-selected';
import { ToastService } from '../../../services/genral/tost.service';
import { ComponentService } from '../../../services/genral/component.service';
import { AppErrorService } from '../../../services/genral/app-error.service';
import { FileUpload } from '../file-upload/file-upload';
import { AddProfileImage } from '../add-profile-image/add-profile-image';
import { MultipleRecord } from '../multiple-record/multiple-record';

@Component({
  selector: 'app-dynamic-form-builder',
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
    ProgressBarModule,
    SingleSelect,
    SelectModule,
    MultiSelected,
    FileUpload,
    RadioButton,
    AddProfileImage,
    MultipleRecord,
  ],
  templateUrl: './dynamic-form-builder.html',
  styleUrl: './dynamic-form-builder.css',
})
export class DynamicFormBuilder implements OnChanges {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  toastService = inject(ToastService);
  componentService = inject(ComponentService);
  private errorService = inject(AppErrorService);

  @Input({ required: true }) fields: DynamicField[] = [];
  @Input() action!: string;
  @Input() url?: string;
  @Input() method: 'POST' | 'PUT' = 'POST';
  @Input() beforeSubmit?: (v: any) => boolean | void;
  @Input() payloadTransform?: (payload: any) => any;
  @Input() needConfirmation = false;
  @Input() hiddenFields?: { name: string; value: any }[];
  @Input() className: string = '';
  @Input() resetFormOnSubmit = true;
  @Input() initialValues?: Record<string, any>;
  @Input() showSubmitButton = true;
  @Input() submitLabel = 'Submit';

  @Output() submitCompleted = new EventEmitter<any>();
  @Output() valuesChanged = new EventEmitter<any>();
  @Output() formSubmitted = new EventEmitter<any>();

  form!: FormGroup;
  loading = false;
  progress = false;
  percent = 0;
  submitted = false;
  private syncingDisabledStates = false;

  ngOnChanges() {
    this.buildForm();
  }

  private buildForm() {
    const group: any = {};

    this.fields.forEach((f) => {
      const validators = this.getFieldValidators(f);
      if (f.min !== undefined) validators.push(Validators.min(f.min));
      if (f.max !== undefined) validators.push(Validators.max(f.max));
      if (f.minLength) validators.push(Validators.minLength(f.minLength));
      if (f.maxLength) validators.push(Validators.maxLength(f.maxLength));
      if (f.pattern) validators.push(Validators.pattern(f.pattern));

      const hasInitialValue = !!this.initialValues && Object.prototype.hasOwnProperty.call(this.initialValues, f.name);

      let defaultValue: any = hasInitialValue ? this.initialValues?.[f.name] : (f.defaultValue ?? null);
      if (!hasInitialValue && f.type === 'checkbox') defaultValue = f.defaultValue ?? false;
      if (!hasInitialValue && f.type === 'switch') defaultValue = f.defaultValue ?? false;
      if (!hasInitialValue && f.type === 'checkbox-group') defaultValue = f.defaultValue ?? [];
      if (!hasInitialValue && f.type === 'repeater') defaultValue = f.defaultValue ?? [];
      if (!hasInitialValue && f.type === 'radio') defaultValue = f.defaultValue ?? null;

      group[f.name] = [{ value: defaultValue, disabled: f.disabled ?? false }, validators];
    });

    this.form = this.fb.group(group);
    this.syncConditionalDisabledStates();

    // Reset submitted flag and emit changes
    this.submitted = false;
    this.form.valueChanges.subscribe((v) => {
      this.syncConditionalDisabledStates();
      this.valuesChanged.emit(v);
    });
  }

  visibleFields() {
    const values = this.form?.value;
    return this.fields.filter((f) => (f.show ? f.show(values) : true));
  }

  isFieldDisabled(field: DynamicField) {
    const values = this.form?.value;
    return field.disabledWhen ? field.disabledWhen(values) : (field.disabled ?? false);
  }

  private syncConditionalDisabledStates() {
    if (!this.form || this.syncingDisabledStates) return;

    this.syncingDisabledStates = true;

    try {
      this.fields.forEach((field) => {
        const control = this.form.get(field.name);
        if (!control) return;

        control.setValidators(this.getFieldValidators(field));
        control.updateValueAndValidity({ emitEvent: false });

        const shouldDisable = this.isFieldDisabled(field);
        if (shouldDisable && control.enabled) {
          control.disable({ emitEvent: false });
        } else if (!shouldDisable && control.disabled && !field.disabled) {
          control.enable({ emitEvent: false });
        }
      });
    } finally {
      this.syncingDisabledStates = false;
    }
  }

  getFieldUrl(field: DynamicField): string | undefined {
    if (field.type !== 'server-select' && field.type !== 'multi-select') {
      return field.url;
    }

    if (field.urlFactory) {
      const resolved = field.urlFactory(this.form?.value ?? {});
      return resolved || undefined;
    }

    return field.url;
  }

  handleSelectChange(field: DynamicField, row: any) {
    const val = field.changeValue ? row?.[field.changeValue] : row;
    this.form.get(field.name)?.setValue(val);
    field.onSelect?.(row, this.form);
  }

  handleFileChange(field: DynamicField, files: File[]) {
    if (!files || files.length === 0) return;
    this.form.get(field.name)?.setValue(field.multiple ? files : files[0]);
    this.form.get(field.name)?.markAsTouched();
    this.form.get(field.name)?.updateValueAndValidity();
  }

  handleSingleFileChange(field: DynamicField, file: File | string) {
    if (!file) return;
    const control = this.form.get(field.name);
    control?.setValue(file);
    control?.markAsTouched();
    control?.updateValueAndValidity();
  }

  handleFieldChange(field: DynamicField, value: any) {
    field.onChange?.(value, this.form);
  }

  /** ======================
   * FORM SUBMISSION
   * ====================== */
  submit() {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.beforeSubmit) {
      const r = this.beforeSubmit(this.form.value);
      if (r !== true) return;
    }

    if (this.needConfirmation) {
      this.toastService.confirmAction({ name: 'Do you want to submit the form?' }, () =>
        this.dataSubmit(),
      );
      return;
    }

    this.dataSubmit();
  }

  private checkboxGroupRequiredValidator() {
    return (control: any) =>
      Array.isArray(control.value) && control.value.length > 0 ? null : { required: true };
  }

  private getFieldValidators(field: DynamicField) {
    const validators = [];
    const values = this.form?.getRawValue?.() ?? this.initialValues ?? {};
    const isRequired = field.requiredWhen ? field.requiredWhen(values) : field.required;

    if (isRequired) {
      if (field.type === 'checkbox-group') {
        validators.push(this.checkboxGroupRequiredValidator());
      } else {
        validators.push(Validators.required);
      }
    }

    return validators;
  }

  private dataSubmit() {
    this.loading = true;
    this.progress = false;
    this.percent = 0;

    // Start with form values
    let payload: any = { ...this.form.value };

    // Normalize empty values
    Object.keys(payload).forEach((k) => {
      const field = this.fields.find((f) => f.name === k);
      if (!field) return;

      if (['file', 'file-upload', 'profile-image'].includes(field.type)) {
        // Keep empty files as null / empty array
        if (!payload[k] || (Array.isArray(payload[k]) && payload[k].length === 0)) {
          payload[k] = field.multiple ? [] : null;
        }
      } else {
        if (payload[k] === null) payload[k] = '';
      }
    });

    // Determine if we have any real file to upload
    const hasFileWithValue = this.fields.some((f) => {
      if (!['file', 'file-upload', 'profile-image'].includes(f.type)) return false;
      const val = payload[f.name];
      if (!val) return false;
      if (Array.isArray(val) && val.length === 0) return false;
      return val instanceof File || (Array.isArray(val) && val[0] instanceof File);
    });

    // --- Payload type selection ---
    let finalPayload: any;

    if (hasFileWithValue) {
      // Use FormData
      const fd = new FormData();

      Object.keys(payload).forEach((k) => {
        const val = payload[k];

        if (val instanceof File) {
          fd.append(k, val); // single file
        } else if (Array.isArray(val) && val.length > 0 && val[0] instanceof File) {
          val.forEach((file: File) => fd.append(k, file));
        } else {
          fd.append(k, val);
        }
      });

      // Append hidden fields
      this.hiddenFields?.forEach((h) => fd.append(h.name, h.value));
      finalPayload = fd;
    } else {
      // Use plain JSON
      finalPayload = { ...payload };
      this.hiddenFields?.forEach((h) => (finalPayload[h.name] = h.value));
    }

    if (this.payloadTransform) {
      finalPayload = this.payloadTransform(finalPayload);
    }

    // --- Emit or send to API ---
    if (this.formSubmitted.observed) {
      this.formSubmitted.emit(finalPayload);
      if (this.resetFormOnSubmit) {
        this.resetForm();
      }
      this.resetLoading();
      return;
    }

    const submitUrl = this.url || this.action;

    this.componentService.request(this.method, submitUrl, finalPayload).subscribe({
      next: (e: any) => {
        if (hasFileWithValue && e.type === HttpEventType.UploadProgress && e.total) {
          this.progress = true;
          this.percent = Math.round((e.loaded * 100) / e.total);
        }

        if (e.type === undefined || e.type === HttpEventType.Response) {
          this.submitCompleted.emit(e.body ?? e);
          this.toastService.success(e.body?.message ?? e.message);
          if (this.resetFormOnSubmit) {
            this.resetForm();
          }
        }
      },
      error: (err: any) => {
        console.error('Form submission error:', err);
        const normalized = this.errorService.normalize(err, submitUrl || 'form submission');
        this.toastService.error(normalized.message, normalized.title);
        this.resetLoading();
      },
      complete: () => this.resetLoading(),
    });
  }

  /** Reset form after submit */
  private resetForm() {
    this.form.reset();
    this.buildForm(); // rebuild to reset default values
    this.submitted = false;
  }

  private resetLoading() {
    this.loading = false;
    this.progress = false;
    this.percent = 0;
  }

  isInvalid(name: string) {
    const c = this.form.get(name);
    return !!(c && c.invalid && (c.touched || c.dirty || this.submitted));
  }
}
