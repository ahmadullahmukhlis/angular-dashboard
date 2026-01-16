import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { ComponentService } from '../../../services/genral/component.service';


@Component({
  selector: 'app-multi-selected',
  imports: [MultiSelectModule],
  templateUrl: './multi-selected.html',
  styleUrl: './multi-selected.css',
})
export class MultiSelected {
@Input() url!: string;
  @Input() optionLabel!: string;
  @Input() optionValue!: string;
  @Input() placeholder: string = 'Select';
  @Input() showClear:boolean = true
  @Input() isSearable : boolean = true
  @Input () multiple : Boolean = false
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
