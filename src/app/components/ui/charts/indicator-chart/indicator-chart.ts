import { Component, Input } from '@angular/core';
import { IIndicatorChart } from '../../../../models/chart.model';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-indicator-chart',
  imports: [NgApexchartsModule],
  templateUrl: './indicator-chart.html',
  styleUrl: './indicator-chart.css',
})
export class IndicatorChart {
  @Input() config!: IIndicatorChart;
  @Input() title: string = 'Performance Indicator';
  isLoading: boolean = false;
  
}
