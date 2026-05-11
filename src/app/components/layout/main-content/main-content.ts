import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, inject, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';
import { SidebarService } from '../../../services/sidebar.service';
import { DeleteConfirmation } from '../../ui/delete-confirmation/delete-confirmation';
import { ToastComponent } from '../../ui/toast.component/toast.component';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [CommonModule, RouterModule, Sidebar, Header, DeleteConfirmation, ToastComponent],
  templateUrl: './main-content.html',
  styleUrls: ['./main-content.css'],
})
export class MainContent {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(private sidebarService: SidebarService) {
    if (this.isBrowser) {
      this.updateViewport();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.isBrowser) {
      this.updateViewport();
    }
  }

  private updateViewport(): void {
    this.sidebarService.updateViewport(window.innerWidth);
  }

  get isCollapsed(): boolean {
    return this.sidebarService.isCollapsed();
  }

  get isMobile(): boolean {
    return this.sidebarService.isMobile();
  }
}
