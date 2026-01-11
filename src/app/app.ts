import { Component } from '@angular/core';
import { SidebarService } from './services/sidebar.service';
import { MainContent } from './components/main-content/main-content';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports:[MainContent]
})
export class App {
  title = 'Metric Dashboard';
  
  constructor(private sidebarService: SidebarService) {}
  
  get isCollapsed(): boolean {
    return this.sidebarService.isCollapsed();
  }
}