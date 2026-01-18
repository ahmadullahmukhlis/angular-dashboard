import { Component } from '@angular/core';
import { SidebarService } from './services/sidebar.service';
import { MainContent } from './components/layout/main-content/main-content';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [MainContent,ToastModule,ConfirmDialogModule],
})
export class App {
  title = 'Metric Dashboard';

  constructor(private sidebarService: SidebarService) {}

  get isCollapsed(): boolean {
    return this.sidebarService.isCollapsed();
  }
}
