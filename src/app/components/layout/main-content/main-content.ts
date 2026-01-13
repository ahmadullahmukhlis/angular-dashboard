import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';
import { SidebarService } from '../../../services/sidebar.service';

@Component({
  selector: 'app-main-content',
  standalone: true, // <-- important
  imports: [CommonModule, RouterModule, Sidebar, Header],
  templateUrl: './main-content.html',
  styleUrls: ['./main-content.css'], // <-- fix here
})
export class MainContent {
  constructor(private sidebarService: SidebarService) {}

  isMobile = false;

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
