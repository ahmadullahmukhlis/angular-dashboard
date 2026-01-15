import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [DialogModule, NgIf, NgClass],
  templateUrl: './modal.html',
})
export class ModalComponent {

  @Input() visible: boolean = false;
  @Input() title: string = 'Modal Title';

  // Tailwind or custom classes
  @Input() widthClass: string = 'w-[500px]';
  @Input() heightClass: string = 'auto';

  // Event fired when X is clicked
  @Output() onClose = new EventEmitter<void>();

  // Do NOT change visible here! just emit event
  closeClicked() {
    this.onClose.emit();
  }
}
