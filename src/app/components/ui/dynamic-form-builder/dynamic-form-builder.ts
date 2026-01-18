import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpEventType,
  HttpClientModule,
} from '@angular/common/http';


/* PrimeNG */
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { DynamicField } from '../../../models/fomrBuilderModel';
import { SingleSelect } from "../single-select/single-select";
import { SelectModule } from 'primeng/select';
import { ToastService } from '../../../services/genral/tost.service';
import { ComponentService } from '../../../services/genral/component.service';
import { MultiSelected } from "../multi-selected/multi-selected";

@Component({
  selector: 'app-dynamic-form-builder',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
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
    MultiSelected,MultiSelected
],
  templateUrl: './dynamic-form-builder.html',
})
export class DynamicFormBuilderComponent implements OnChanges {
  constructor(private fb: FormBuilder, private http: HttpClient) {}

  /* ================= INPUTS ================= */

  @Input({ required: true }) fields: DynamicField[] = [];
  @Input() action!: string;
  @Input() method: 'POST' | 'PUT' = 'POST';

  @Input() beforeSubmit?: (v: any) => boolean | void;
  @Input() needConfirmation = false;

  @Input() hiddenFields?: { name: string; value: any }[];
  @Input () className:string = ""
  /* ================= OUTPUTS ================= */

  @Output() submitCompleted = new EventEmitter<any>();
  @Output() valuesChanged = new EventEmitter<any>();

  /* ================= FORM ================= */
  
  toastService = inject(ToastService);
  componentService = inject(ComponentService)
  form!: FormGroup;

  loading = false;
  progress = false;
  percent = 0;

  ngOnChanges() {
    this.buildForm();
  }

  /* ================= BUILD ================= */

  private buildForm() {
    const group: any = {};

    this.fields.forEach(f => {
      const v = [];

      if (f.required) v.push(Validators.required);
      if (f.min !== undefined) v.push(Validators.min(f.min));
      if (f.max !== undefined) v.push(Validators.max(f.max));
      if (f.minLength) v.push(Validators.minLength(f.minLength));
      if (f.maxLength) v.push(Validators.maxLength(f.maxLength));
      if (f.pattern) v.push(Validators.pattern(f.pattern));

      group[f.name] = [
        { value: f.defaultValue ?? null, disabled: f.disabled },
        v,
      ];
    });

    this.form = this.fb.group(group);

    this.form.valueChanges.subscribe(v => this.valuesChanged.emit(v));
  }

  /* ================= VISIBILITY ================= */

  visibleFields() {
    const values = this.form?.value;
    return this.fields.filter(f => (f.show ? f.show(values) : true));
  }

  /* ================= SERVER SELECT ================= */


  handleSelectChange(field: DynamicField, row: any) {
    const val = field.changeValue ? row?.[field.changeValue] : row;
    this.form.get(field.name)?.setValue(val);
    field.onSelect?.(row);
  }

  /* ================= SUBMIT ================= */

  submit() {
    if (this.beforeSubmit) {
      const r = this.beforeSubmit(this.form.value);
      if (r === false) return;
    }

    if (this.needConfirmation ){
      this.toastService.confirmAction({name:"DO you want to Sumite the form"},()=>{
         this.dataSUbmit()
      })
      return
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
 this.dataSUbmit()
    
  }
  dataSUbmit(){
      let payload: any = this.form.value;
    const hasFile = this.fields.some(f => f.type === 'file');

    if (hasFile) {
      const fd = new FormData();
      Object.keys(payload).forEach(k => fd.append(k, payload[k] ?? ''));
      this.hiddenFields?.forEach(h => fd.append(h.name, h.value));
      payload = fd;
    }

    this.loading = true;

    this.componentService
      .request(this.method, this.action, {
        body: payload,
        observe: 'events',
        reportProgress: true,
      })
      .subscribe({
        next: e => {
          if (e.type === HttpEventType.UploadProgress && e.total) {
            this.progress = true;
            this.percent = Math.round((e.loaded * 100) / e.total);
          }
          if (e.type === HttpEventType.Response) {
            this.submitCompleted.emit(e.body);
          }
        },
        error: err => console.error(err),
        complete: () => {
          this.loading = false;
          this.progress = false;
          this.percent = 0;
        },
      });
  }

  isInvalid(name: string) {
    const c = this.form.get(name);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }
}
