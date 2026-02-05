import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';

/* PrimeNG 18+ Updated Imports */
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker'; // Replaces CalendarModule
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch'; // Replaces InputSwitchModule
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select'; // Replaces DropdownModule

/* Custom Imports */
import { DynamicField } from '../../../models/fomrBuilderModel';
import { SingleSelect } from '../single-select/single-select';
import { MultiSelected } from '../multi-selected/multi-selected';
import { ToastService } from '../../../services/genral/tost.service';
import { ComponentService } from '../../../services/genral/component.service';
import { FileUpload } from '../file-upload/file-upload';
import { RadioButton } from 'primeng/radiobutton';
import { AddProfileImage } from '../add-profile-image/add-profile-image';

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
  ],
  templateUrl: './dynamic-form-builder.html',
})
export class DynamicFormBuilderComponent implements OnChanges {
  // Use inject() for all services to follow Angular 18+ best practices
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  toastService = inject(ToastService);
  componentService = inject(ComponentService);

  @Input({ required: true }) fields: DynamicField[] = [];
  @Input() action!: string;
  @Input() method: 'POST' | 'PUT' = 'POST';
  @Input() beforeSubmit?: (v: any) => boolean | void;
  @Input() needConfirmation = false;
  @Input() hiddenFields?: { name: string; value: any }[];
  @Input() className: string = '';

  @Output() submitCompleted = new EventEmitter<any>();
  @Output() valuesChanged = new EventEmitter<any>();

  form!: FormGroup;
  loading = false;
  progress = false;
  percent = 0;
  submitted = false;

  ngOnChanges() {
    this.buildForm();
  }

  private buildForm() {
    const group: any = {};

    this.fields.forEach((f) => {
      const validators = [];

      if (f.required) {
        if (f.type === 'checkbox-group') {
          validators.push(this.checkboxGroupRequiredValidator());
        } else {
          validators.push(Validators.required);
        }
      }
      if (f.min !== undefined) validators.push(Validators.min(f.min));
      if (f.max !== undefined) validators.push(Validators.max(f.max));
      if (f.minLength) validators.push(Validators.minLength(f.minLength));
      if (f.maxLength) validators.push(Validators.maxLength(f.maxLength));
      if (f.pattern) validators.push(Validators.pattern(f.pattern));

      let defaultValue: any = f.defaultValue ?? null;

      // 🔹 Proper default values by type
      if (f.type === 'checkbox') defaultValue = f.defaultValue ?? false;
      if (f.type === 'switch') defaultValue = f.defaultValue ?? false;
      if (f.type === 'checkbox-group') defaultValue = f.defaultValue ?? [];
      if (f.type === 'radio') defaultValue = f.defaultValue ?? null;

      group[f.name] = [{ value: defaultValue, disabled: f.disabled }, validators];
    });

    this.form = this.fb.group(group);

    this.form.valueChanges.subscribe((v) => this.valuesChanged.emit(v));
  }

  visibleFields() {
    const values = this.form?.value;
    return this.fields.filter((f) => (f.show ? f.show(values) : true));
  }

  handleSelectChange(field: DynamicField, row: any) {
    const val = field.changeValue ? row?.[field.changeValue] : row;
    this.form.get(field.name)?.setValue(val);
    field.onSelect?.(row);
  }
  handleFileChange(field: DynamicField, files: File[]) {
    if (!files || files.length === 0) return;

    // If multiple = false → store single file
    if (!field.multiple) {
      this.form.get(field.name)?.setValue(files[0]);
    } else {
      this.form.get(field.name)?.setValue(files);
    }

    // Mark control as touched to trigger validation
    this.form.get(field.name)?.markAsTouched();
    this.form.get(field.name)?.updateValueAndValidity();
  }

  submit() {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.loading = false;
      return;
    }

    if (this.beforeSubmit) {
      const r = this.beforeSubmit(this.form.value);
      if (r !== true) {
        this.loading = false;
        return;
      }
    }

    if (this.needConfirmation) {
      this.toastService.confirmAction({ name: 'Do you want to submit the form' }, () =>
        this.dataSubmit(),
      );
      return;
    }

    this.dataSubmit();
  }
  private checkboxGroupRequiredValidator() {
    return (control: any) => {
      return Array.isArray(control.value) && control.value.length > 0 ? null : { required: true };
    };
  }

  dataSubmit() {
    this.loading = true;
    this.progress = false;
    this.percent = 0;

    let payload: any = { ...this.form.value };

    // Sanitize null values
    Object.keys(payload).forEach((k) => {
      if (payload[k] === null) payload[k] = '';
    });

    const hasFile = this.fields.some(
      (f) => f.type === 'file' || f.type === 'file-upload' || f.type === 'profile-image',
    );

    if (hasFile) {
      const fd = new FormData();
      Object.keys(payload).forEach((k) => {
        if (payload[k] instanceof File) {
          fd.append(k, payload[k]);
        } else if (Array.isArray(payload[k]) && payload[k][0] instanceof File) {
          payload[k].forEach((file: File) => fd.append(k, file));
        } else {
          fd.append(k, payload[k]);
        }
      });

      this.hiddenFields?.forEach((h) => fd.append(h.name, h.value));
      payload = fd;
    }

    this.componentService
      .request(this.method, this.action, {
        body: payload,
        observe: hasFile ? 'events' : 'body',
        reportProgress: hasFile,
      })
      .subscribe({
        next: (e: any) => {
          if (hasFile && e.type === HttpEventType.UploadProgress && e.total) {
            this.progress = true;
            this.percent = Math.round((e.loaded * 100) / e.total);
          }

          if (!hasFile || e.type === HttpEventType.Response) {
            this.submitCompleted.emit(e.body ?? e);
          }
        },
        error: (err: any) => {
          console.error('Error submitting form:', err);
          this.toastService.error('Error submitting form');
          this.resetLoadingState();
        },
        complete: () => this.resetLoadingState(),
      });
  }

  private resetLoadingState() {
    this.loading = false;
    this.progress = false;
    this.percent = 0;
  }

  isInvalid(name: string) {
    const c = this.form.get(name);
    return !!(c && c.invalid && (c.touched || c.dirty || this.submitted));
  }
}
