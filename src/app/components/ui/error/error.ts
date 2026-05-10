import { NgClass } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [NgClass],
  templateUrl: './error.html',
  styleUrl: './error.css',
})
export class Error {
  @Input() title: string = 'Something went wrong';
  @Input() error: string = 'Something went wrong!';
  @Input() details: string | null | undefined = null;
  @Input() code: string | number | null | undefined = null;
  @Input() retryLabel: string = 'Try Again';
  @Input() retryable: boolean = true;

  /** Table size for padding variants: 'default' | 'sm' | 'xs' */
  @Input() size: 'default' | 'sm' | 'xs' = 'default';

  /** Event emitted when user clicks "Try Again" */
  @Output() refresh = new EventEmitter<void>();
}
