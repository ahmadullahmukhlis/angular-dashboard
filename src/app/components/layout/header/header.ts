import {
  Component,
  HostListener,
  Inject,
  PLATFORM_ID,
  AfterViewInit,
  ElementRef,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SidebarService } from '../../../services/sidebar.service';
import { Breadcrumb } from '../breadcrumb/breadcrumb';
import { Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { ComponentService } from '../../../services/genral/component.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, Breadcrumb],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class Header implements AfterViewInit {
  private readonly sidebarService = inject(SidebarService);
  private readonly elRef = inject(ElementRef);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private componentService = inject(ComponentService);

  isNotificationsOpen = false;
  isProfileMenuOpen = false;
  isMobile = false;
  isBrowser = isPlatformBrowser(this.platformId);

  notifications = signal([
    { id: 1, text: 'New user registered', time: '5 min ago', read: false, icon: 'fa-user-plus' },
    { id: 2, text: 'Server load is high', time: '15 min ago', read: false, icon: 'fa-server' },
    {
      id: 3,
      text: 'Report generated successfully',
      time: '1 hour ago',
      read: true,
      icon: 'fa-file-alt',
    },
    {
      id: 4,
      text: 'Database backup completed',
      time: '2 hours ago',
      read: true,
      icon: 'fa-database',
    },
  ]);

  unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  // Use signal from SidebarService
  isSidebarCollapsed = this.sidebarService.sidebarCollapsedSignal;

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeDropdowns());
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) this.checkMobile();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.isBrowser) this.checkMobile();
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

  toggleNotifications(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isNotificationsOpen = !this.isNotificationsOpen;
    this.isProfileMenuOpen = false;
  }

  toggleProfileMenu(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    this.isNotificationsOpen = false;
  }

  markAsRead(notificationId: number): void {
    this.notifications.update((list) =>
      list.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  private closeDropdowns(): void {
    this.isNotificationsOpen = false;
    this.isProfileMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isBrowser) return;
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.closeDropdowns();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.closeDropdowns();
  }
  reloadData() {
    this.componentService.revalidate('*');
  }
}
