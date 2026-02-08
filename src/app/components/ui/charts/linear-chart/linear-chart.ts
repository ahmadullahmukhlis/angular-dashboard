import { Component, input, Input } from '@angular/core';
import { IAxisChart } from '../../../../models/chart.model';
import { NgApexchartsModule } from 'ng-apexcharts';

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
  loading = false;
  data: any = [];
  ngOnInit() {
    if (this.isLoading !== undefined) {
      this.loading = this.isLoading;
    }
  }
}
