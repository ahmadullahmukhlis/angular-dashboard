import { Component, Input } from '@angular/core';
import { IRangeChart } from '../../../../models/chart.model';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-range-chart',
  imports: [NgApexchartsModule],
  templateUrl: './range-chart.html',
  styleUrl: './range-chart.css',
})
export class RangeChart {
  @Input() config!: IRangeChart;
  @Input() title: string = 'Range Analysis';
}
