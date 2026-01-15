import {
  Component,
  HostListener,
  Inject,
  PLATFORM_ID,
  AfterViewInit,
  ElementRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SidebarService } from '../../../services/sidebar.service';
import { Breadcrumb } from '../breadcrumb/breadcrumb';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, Breadcrumb],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class Header implements AfterViewInit {
  isNotificationsOpen = false;
  isProfileMenuOpen = false;
  isMobile = false;
  isBrowser = false;

  notifications = [
    { id: 1, text: 'New user registered', time: '5 min ago', read: false, icon: 'fa-user-plus' },
    { id: 2, text: 'Server load is high', time: '15 min ago', read: false, icon: 'fa-server' },
    { id: 3, text: 'Report generated successfully', time: '1 hour ago', read: true, icon: 'fa-file-alt' },
    { id: 4, text: 'Database backup completed', time: '2 hours ago', read: true, icon: 'fa-database' },
  ];

  constructor(
      private sidebarService: SidebarService,
      private elRef: ElementRef,
      private router: Router,
      @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Close dropdowns on route change
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.closeDropdowns();
      }
    });
  }

  ngAfterViewInit(): void {
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
    this.isMobile = window.innerWidth < 768;
  }

  toggleNotifications(event?: MouseEvent): void {
    if (event) event.stopPropagation(); // prevent click-outside closing immediately
    this.isNotificationsOpen = !this.isNotificationsOpen;
    this.isProfileMenuOpen = false;
  }

  toggleProfileMenu(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    this.isNotificationsOpen = false;
  }

  markAsRead(notificationId: number): void {
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (notification) notification.read = true;
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  isSidebarCollapsed(): boolean {
    return this.sidebarService.isCollapsed();
  }

  private closeDropdowns(): void {
    this.isNotificationsOpen = false;
    this.isProfileMenuOpen = false;
  }

  // Close dropdowns when clicking anywhere outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isBrowser) return;

    const clickedInside = this.elRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.closeDropdowns();
    }
  }

  // Optional: close dropdowns on ESC key
  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.closeDropdowns();
  }
}
