import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormMultipleRecordForm } from '../form-multiple-record-form/form-multiple-record-form';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-multiple-record',
  standalone: true,
  imports: [CommonModule, FormMultipleRecordForm, Modal],
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

  // Modal States
  addModalVisible = false;
  editModalVisible = false;
  selectedRecord: any = null;

  ngOnInit(): void {
    if (this.defaultValues && Array.isArray(this.defaultValues)) {
      this.values = [...this.defaultValues];
    }
  }

  generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /* =========================
     MODAL CONTROL
  ========================== */

  openAddModal() {
    this.addModalVisible = true;
  }

  closeAddModal() {
    this.addModalVisible = false;
  }

  openEditModal(record: any) {
    this.selectedRecord = record;
    this.editModalVisible = true;
  }

  closeEditModal() {
    this.editModalVisible = false;
    this.selectedRecord = null;
  }

  /* =========================
     SUBMIT HANDLERS
  ========================== */

  handleAddSubmit(formValues: any) {
    this.values = [
      ...this.values,
      {
        id: this.generateRandomId(),
        ...formValues,
      },
    ];

    this.onChange.emit(this.values);
    this.closeAddModal();
  }

  handleEditSubmit(formValues: any) {
    const index = this.values.findIndex((item) => item.id === this.selectedRecord?.id);

    if (index > -1) {
      this.values[index] = {
        id: this.selectedRecord.id,
        ...formValues,
      };
    }

    this.onChange.emit(this.values);
    this.closeEditModal();
  }

  handleDelete(id: string) {
    this.values = this.values.filter((v) => v.id !== id);
    this.onChange.emit(this.values);
  }
}
