import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SidebarItem } from '../models/sidebar-item.model';
import { SIDEBAR_ROUTES } from '../shared/SIdeBarRoutes';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly router = inject(Router);
  private sidebarItems: SidebarItem[] = structuredClone(SIDEBAR_ROUTES);
  private readonly STORAGE_KEY = 'sidebar-collapsed';
  private readonly mobileBreakpoint = 768;
  private _isCollapsed = signal<boolean>(this.readCollapsedState());
  private _isMobile = signal<boolean>(false);
  private _isMobileDrawerOpen = signal<boolean>(false);
  private _sidebarItems = signal<SidebarItem[]>(this.sidebarItems);
  sidebarCollapsedSignal = this._isCollapsed;
  isMobileSignal = this._isMobile;
  mobileDrawerOpenSignal = this._isMobileDrawerOpen;
  sidebarItemsSignal = this._sidebarItems;

  constructor() {
    effect(() => {
      if (this.isBrowser) {
        localStorage.setItem(this.STORAGE_KEY, this._isCollapsed().toString());
      }
    });

    this.syncActiveStateWithRoute(this.router.url);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.syncActiveStateWithRoute(event.urlAfterRedirects);
      });
  }

  // ---------------- Breadcrumb Logic ----------------

  getBreadcrumb(): SidebarItem[] {
    const path: SidebarItem[] = [];

    const traverse = (items: SidebarItem[]): boolean => {
      for (const item of items) {
        // If this item is active, add to path
        if (item.isActive) {
          path.push(item);

          // If children exist, keep digging
          if (item.children?.length) {
            const foundChild = traverse(item.children);
            if (foundChild) {
              return true;
            }
          }
          return true;
        }

        // If not active but has children, search deeper
        if (item.children?.length) {
          const foundChild = traverse(item.children);
          if (foundChild) {
            path.unshift(item); // add parent before child
            return true;
          }
        }
      }
      return false;
    };

    traverse(this.sidebarItems);
    return path;
  }

  // ---------------- Sidebar Items ----------------

  getSidebarItems(): SidebarItem[] {
    return this.sidebarItems;
  }

  toggleItemExpansion(itemId: number): void {
    if (this._isCollapsed() && !this._isMobile()) return; // only block expansion for collapsed desktop sidebar

    const item = this.findItemById(this.sidebarItems, itemId);
    if (item && item.children) {
      item.isExpanded = !item.isExpanded;
      this.publishSidebarItems();
    }
  }

  setActiveItem(itemId: number): void {
    this.deactivateAllItems(this.sidebarItems);
    this.activatePathById(this.sidebarItems, itemId);
    this.publishSidebarItems();
  }

  // ---------------- Sidebar Collapse ----------------

  toggleSidebar(): void {
    this._isCollapsed.set(!this._isCollapsed());

    if (this._isCollapsed()) {
      this.collapseAllItems(this.sidebarItems);
      this.publishSidebarItems();
    }
  }

  isCollapsed(): boolean {
    return this._isCollapsed();
  }

  isMobile(): boolean {
    return this._isMobile();
  }

  isMobileDrawerOpen(): boolean {
    return this._isMobileDrawerOpen();
  }

  updateViewport(width: number): void {
    const isMobile = width < this.mobileBreakpoint;
    this._isMobile.set(isMobile);

    if (!isMobile) {
      this._isMobileDrawerOpen.set(false);
    }
  }

  toggleNavigation(): void {
    if (this._isMobile()) {
      this._isMobileDrawerOpen.update((isOpen) => !isOpen);
      return;
    }

    this.toggleSidebar();
  }

  closeMobileDrawer(): void {
    this._isMobileDrawerOpen.set(false);
  }

  // ---------------- Private Helpers ----------------

  private readCollapsedState(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    return localStorage.getItem(this.STORAGE_KEY) === 'true';
  }

  private deactivateAllItems(items: SidebarItem[]): void {
    items.forEach((item) => {
      item.isActive = false;
      if (item.children) {
        this.deactivateAllItems(item.children);
      }
    });
  }

  private collapseAllItems(items: SidebarItem[]): void {
    items.forEach((item) => {
      if (item.children) {
        item.isExpanded = false;
        this.collapseAllItems(item.children);
      }
    });
  }

  private findItemById(items: SidebarItem[], id: number): SidebarItem | null {
    for (const item of items) {
      if (item.id === id) return item;

      if (item.children) {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  private activatePathById(items: SidebarItem[], id: number): boolean {
    for (const item of items) {
      if (item.id === id) {
        item.isActive = true;
        return true;
      }

      if (item.children?.length && this.activatePathById(item.children, id)) {
        item.isActive = true;
        item.isExpanded = true;
        return true;
      }
    }

    return false;
  }

  private syncActiveStateWithRoute(url: string): void {
    this.deactivateAllItems(this.sidebarItems);
    this.collapseAllItems(this.sidebarItems);
    this.activatePathByRoute(this.sidebarItems, this.normalizeRoute(url));
    this.publishSidebarItems();
  }

  private activatePathByRoute(items: SidebarItem[], currentRoute: string): boolean {
    for (const item of items) {
      if (item.route && this.normalizeRoute(item.route) === currentRoute) {
        item.isActive = true;
        return true;
      }

      if (item.children?.length && this.activatePathByRoute(item.children, currentRoute)) {
        item.isActive = true;
        item.isExpanded = true;
        return true;
      }
    }

    return false;
  }

  private normalizeRoute(route: string): string {
    const [path] = route.split(/[?#]/);
    const normalizedPath = path || '/';

    if (normalizedPath === '/') {
      return '/';
    }

    return normalizedPath.endsWith('/') ? normalizedPath.slice(0, -1) : normalizedPath;
  }

  private publishSidebarItems(): void {
    this._sidebarItems.set([...this.sidebarItems]);
  }
}
