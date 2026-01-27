import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SidebarItem } from '../models/sidebar-item.model';
import { SIDEBAR_ROUTES } from '../shared/SIdeBarRoutes';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  // 1. Initialize state with BehaviorSubject to make it reactive
  private sidebarItemsSubject = new BehaviorSubject<SidebarItem[]>(structuredClone(SIDEBAR_ROUTES));
  
  // 2. Expose as Observable for components to subscribe to
  sidebarItems$ = this.sidebarItemsSubject.asObservable();

  private isSidebarCollapsed = false;

  constructor() {}

  // Getter to retrieve the current snapshot of items
  private get currentItems(): SidebarItem[] {
    return this.sidebarItemsSubject.value;
  }

  // Helper to notify all subscribers that the data has changed
  private refreshState(): void {
    this.sidebarItemsSubject.next([...this.currentItems]);
  }

  toggleItemExpansion(itemId: number): void {
    if (this.isSidebarCollapsed) return;

    const item = this.findItemById(this.currentItems, itemId);
    if (item && item.children) {
      item.isExpanded = !item.isExpanded;
      this.refreshState();
    }
  }

  setActiveItem(itemId: number): void {
    const items = this.currentItems;
    this.deactivateAllItems(items);

    const item = this.findItemById(items, itemId);
    if (item) {
      item.isActive = true;
      this.refreshState();
    }
  }

  setActiveByRoute(url: string): void {
    const items = this.currentItems;
    this.deactivateAllItems(items);
    this.activateByRoute(items, url);
    this.refreshState();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (this.isSidebarCollapsed) {
      this.collapseAllItems(this.currentItems);
    }
    this.refreshState();
  }

  isCollapsed(): boolean {
    return this.isSidebarCollapsed;
  }

  getBreadcrumb(): SidebarItem[] {
    const path: SidebarItem[] = [];
    this.findActivePath(this.currentItems, path);
    return path;
  }

  // --- Private Helper Methods ---

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

  private findActivePath(items: SidebarItem[], path: SidebarItem[]): boolean {
    for (const item of items) {
      path.push(item);
      if (item.isActive) return true;
      if (item.children && this.findActivePath(item.children, path)) return true;
      path.pop();
    }
    return false;
  }

  private activateByRoute(items: SidebarItem[], url: string): boolean {
    for (const item of items) {
      // Direct match or partial match for nested routes
      if (item.route && (url === item.route || url.startsWith(item.route + '/'))) {
        item.isActive = true;
        return true;
      }

      if (item.children && this.activateByRoute(item.children, url)) {
        item.isExpanded = true; 
        return true;
      }
    }
    return false;
  }
}
