import { Component } from '@angular/core';
import { SidebarService } from './services/sidebar.service';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [ToastModule, ConfirmDialogModule, RouterModule], // remove MainContent import!
})
export class App {
  title = 'Metric Dashboard';

  constructor(private sidebarService: SidebarService) {}

  get isCollapsed(): boolean {
    return this.sidebarService.isCollapsed();
  }
}
