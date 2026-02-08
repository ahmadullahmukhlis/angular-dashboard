import { Component, Input } from '@angular/core';
import { IProportionalChart } from '../../../../models/chart.model';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-pie-chart',
  imports: [NgApexchartsModule],
  templateUrl: './pie-chart.html',
  styleUrl: './pie-chart.css',
})
export class PieChart {
  @Input() config!: IProportionalChart;
  @Input() title: string = 'Distribution';
}
