import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.html',
  styleUrls: ['./file-upload.css'],
})
export class FileUpload {
  @Input() multiple: boolean = false;
  @Output() fileChange = new EventEmitter<File[]>();

  isDragging = false;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;

    if (!event.dataTransfer?.files) return;

    const files: File[] = Array.from(event.dataTransfer.files);
    this.emitFiles(files);
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files: File[] = Array.from(input.files);
    this.emitFiles(files);
  }

  private emitFiles(files: File[]) {
    if (!this.multiple && files.length > 1) {
      this.fileChange.emit([files[0]]);
    } else {
      this.fileChange.emit(files);
    }
  }
}
