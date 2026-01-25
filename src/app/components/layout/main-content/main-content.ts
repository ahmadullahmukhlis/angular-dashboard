import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';
import { SidebarService } from '../../../services/sidebar.service';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [CommonModule, RouterModule, Sidebar, Header],
  templateUrl: './main-content.html',
  styleUrls: ['./main-content.css'],
})
export class MainContent {
  isMobile = false;

  constructor(private sidebarService: SidebarService) {
    this.checkMobile();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkMobile();
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

  get isCollapsed(): boolean {
    return this.sidebarService.isCollapsed();
  }
}
