import { NgClass } from '@angular/common';
import { Component, Input, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  imports: [NgClass],
  templateUrl: './loading.html',
  styleUrl: './loading.css',
})
export class Loading {
  @Input() message: string = 'Loading...';
  @Input() size: string = 'default';
}
