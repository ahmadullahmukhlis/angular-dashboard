import { Component, HostListener, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
   standalone: true,               // <-- make it standalone
  imports: [CommonModule],
})
export class Header implements AfterViewInit {
  isNotificationsOpen = false;
  isProfileMenuOpen = false;
  isMobile = false;
  isBrowser = false; // detect if we are in browser

  notifications = [
    { id: 1, text: 'New user registered', time: '5 min ago', read: false, icon: 'fa-user-plus' },
    { id: 2, text: 'Server load is high', time: '15 min ago', read: false, icon: 'fa-server' },
    { id: 3, text: 'Report generated successfully', time: '1 hour ago', read: true, icon: 'fa-file-alt' },
    { id: 4, text: 'Database backup completed', time: '2 hours ago', read: true, icon: 'fa-database' }
  ];

  constructor(
    private sidebarService: SidebarService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    // Only check window width in the browser
    if (this.isBrowser) {
      this.checkMobile();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (this.isBrowser) {
      this.checkMobile();
    }
  }

  private checkMobile(): void {
    // Safe to use window now
    this.isMobile = window.innerWidth < 768;
  }

  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    this.isProfileMenuOpen = false;
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    this.isNotificationsOpen = false;
  }

  markAsRead(notificationId: number): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  isSidebarCollapsed(): boolean {
    return this.sidebarService.isCollapsed();
  }
}
