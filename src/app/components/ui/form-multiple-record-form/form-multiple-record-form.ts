import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicFormBuilderComponent } from "../dynamic-form-builder/dynamic-form-builder";

@Component({
  selector: 'app-form-multiple-record-form',
  imports: [DynamicFormBuilderComponent],
  templateUrl: './form-multiple-record-form.html',
  styleUrl: './form-multiple-record-form.css',
})
export class FormMultipleRecordForm implements OnChanges {
  @Input() form: any;
  @Input() record: any | null = null;

  @Output() formSubmitted = new EventEmitter<any>();

  mappedFields: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['form'] || changes['record']) {
      this.mapFields();
    }
  }

  private mapFields() {
    if (!this.form?.fields) {
      this.mappedFields = [];
      return;
    }

    this.mappedFields = this.form.fields.map((field: any) => ({
      ...field,
      value: this.record ? this.record?.[field?.name] : field?.value,
    }));
  }

  handleSubmit(values: any) {
    this.formSubmitted.emit(values);
  }
}
