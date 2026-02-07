import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ContentChild,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { ApiService } from '../../../services/api/api.service';
import { ComponentService } from '../../../services/genral/component.service';

@Component({
  selector: 'app-server-data',
  imports: [],
  templateUrl: './server-data.html',
  styleUrl: './server-data.css',
})
export class ServerData {
  @Input() url: string = '';
  @Input() fromResource: boolean = true;
  @Input() disableDefaultHeight: boolean = false;
  @Input() id: string | null = null;
  @Input() ignoreNull: boolean = false;
  @Input() fetchData: boolean = true;

  @Output() dataReceived = new EventEmitter<any>();

  @ContentChild(TemplateRef) template!: TemplateRef<any>;

  data: any;
  error: any;
  loading = false;

  private sub!: Subscription;
  private api = inject(ApiService);
  private componentService = inject(ComponentService);

  ngOnInit() {
    if (this.fetchData) {
      this.loadData();
    }

    this.sub = this.componentService.revalidate$.subscribe((value) => {
      if (value && value === this.id) {
        this.data = undefined;
        this.loadData();
      }
    });
  }

  loadData() {
    if (!this.url) return;

    this.loading = true;
    this.error = null;

    this.api.get(this.url).subscribe({
      next: (res: any) => {
        this.data = this.fromResource ? res?.data : res;
        this.dataReceived.emit(this.data);
        this.loading = false;
      },
      error: (err) => {
        this.error = err;
        this.loading = false;
      },
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }
}
