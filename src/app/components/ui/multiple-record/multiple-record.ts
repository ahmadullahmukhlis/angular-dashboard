import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-multiple-record',
  imports: [],
  templateUrl: './multiple-record.html',
  styleUrl: './multiple-record.css',
})
export class MultipleRecord implements OnInit {
  @Input() defaultValues: any[] = [];
  @Input() label!: string;
  @Input() field: any;
  @Input() errorMessage!: string;

  @Output() onChange = new EventEmitter<any[]>();

  values: any[] = [];

  ngOnInit(): void {
    if (this.defaultValues && Array.isArray(this.defaultValues)) {
      this.values = [...this.defaultValues];
    }
  }

  generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  onFormSubmitted(formValues: any, record: any | null = null) {
    if (!record) {
      this.values = [
        ...this.values,
        {
          id: this.generateRandomId(),
          ...formValues,
        },
      ];
    } else {
      const index = this.values.findIndex((item) => item.id === record?.id);

      if (index > -1) {
        this.values[index] = {
          id: record.id,
          ...formValues,
        };
      }
    }

    this.onChange.emit(this.values);
  }

  handleDelete(id: string) {
    this.values = this.values.filter((v) => v.id !== id);
    this.onChange.emit(this.values);
  }
}
