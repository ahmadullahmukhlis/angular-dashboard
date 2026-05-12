import {
  Component,
  ElementRef,
  inject,
  signal,
  computed,
  PLATFORM_ID,
  afterNextRender,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SidebarService } from '../../../services/sidebar.service';
import { Breadcrumb } from '../breadcrumb/breadcrumb';
import { Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { ComponentService } from '../../../services/genral/component.service';
import { RealmContextService } from '../../../services/realm-context.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, Breadcrumb],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  host: {
    '(window:resize)': 'onResize()',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEsc()',
  },
})
export class Header {
  private readonly sidebarService = inject(SidebarService);
  private readonly elRef = inject(ElementRef);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly componentService = inject(ComponentService);
  private readonly realmContext = inject(RealmContextService);
  private readonly authService = inject(AuthService);

  isNotificationsOpen = signal(false);
  isProfileMenuOpen = signal(false);
  isMobile = signal(false);
  realms = this.realmContext.realms;
  selectedRealmSlug = this.realmContext.selectedRealmSlug;

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
  isSidebarCollapsed = this.sidebarService.sidebarCollapsedSignal;

  constructor() {
    afterNextRender(() => {
      if (this.isBrowser) {
        this.sidebarService.updateViewport(window.innerWidth);
        this.isMobile.set(this.sidebarService.isMobile());
        this.realmContext.loadRealms();
      }
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.closeDropdowns();
        this.sidebarService.closeMobileDrawer();
      });
  }

  onResize(): void {
    if (this.isBrowser) {
      this.sidebarService.updateViewport(window.innerWidth);
      this.isMobile.set(this.sidebarService.isMobile());
    }
  }

  toggleNotifications(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isNotificationsOpen.update((v) => !v);
    this.isProfileMenuOpen.set(false);
  }

  toggleProfileMenu(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isProfileMenuOpen.update((v) => !v);
    this.isNotificationsOpen.set(false);
  }

  markAsRead(notificationId: number): void {
    this.notifications.update((list) =>
      list.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
  }

  toggleSidebar(): void {
    this.sidebarService.toggleNavigation();
  }

  private closeDropdowns(): void {
    this.isNotificationsOpen.set(false);
    this.isProfileMenuOpen.set(false);
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.isBrowser && !this.elRef.nativeElement.contains(event.target)) {
      this.closeDropdowns();
    }
  }

  onEsc(): void {
    this.closeDropdowns();
  }

  reloadData() {
    this.componentService.revalidate('*');
  }

  onRealmChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value || 'default';
    this.realmContext.setSelectedRealmSlug(value);
    this.componentService.revalidate('*');
  }

  logout(event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.closeDropdowns();
    this.authService.logout();
  }
}
