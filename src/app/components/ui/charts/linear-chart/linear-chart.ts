import { Component, inject, input, Input } from '@angular/core';
import { IAxisChart } from '../../../../models/chart.model';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApiService } from '../../../../services/api/api.service';

@Component({
  selector: 'app-linear-chart',
  imports: [NgApexchartsModule],
  templateUrl: './linear-chart.html',
  styleUrl: './linear-chart.css',
})
export class LinearChart {
  @Input() config!: IAxisChart;
  @Input() title: string = 'Linear Data';
  @Input() isLoading?: boolean = false;
  @Input() isServer: boolean = false;
  @Input() url?: string;
  @Input() height: number = 350;
  loading = false;
  data: any = [];
  error: any = null;

  private api = inject(ApiService);
  ngOnInit() {
    if (this.isLoading !== undefined) {
      this.loading = this.isLoading;
    }
    if (this.isServer && this.url) {
      this.loadData();
      this.config.categories = this.data; // Update config with fetched data
    }
  }

  loadData() {
    if (!this.url) return;

    this.loading = true;
    this.error = null;

    this.api.get(this.url).subscribe({
      next: (res: any) => {
        // Normalize data (array or object)
        this.data = Array.isArray(res) ? res : (res?.data ?? res);

        this.loading = false;
        console.log(' data:', this.data);
      },
      error: (err) => {
        this.error = err;
        this.loading = false;
      },
    });
  }
}
