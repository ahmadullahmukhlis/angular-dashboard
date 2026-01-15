import { Component, inject, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ComponentService } from '../../../services/genral/component.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-single-select',
  standalone: true,
  imports: [ FormsModule],
  templateUrl: './single-select.html',
  styleUrl: './single-select.css',
})
export class SingleSelect implements OnInit {

  @Input() url!: string;
  @Input() optionLabel!: string;
  @Input() optionValue!: string;
  @Input() placeholder: string = 'Select';

  @Output() valueChange = new EventEmitter<any>();

  options: any[] = [];
  loading = false;
  selected: any;

  componentService = inject(ComponentService);

  ngOnInit() {
    if (this.url) this.loadOptions();
  }

  loadOptions() {
    this.loading = true;

    this.componentService.getList(this.url).subscribe({
      next: (res) => {
        this.options = res;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onChange(e: any) {
    this.valueChange.emit(e.value);
  }
}
