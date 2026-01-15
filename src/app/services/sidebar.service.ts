import { Injectable } from '@angular/core';
import { SidebarItem } from '../models/sidebar-item.model';
import { SIDEBAR_ROUTES } from '../shared/SIdeBarRoutes';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private sidebarItems: SidebarItem[] = structuredClone(SIDEBAR_ROUTES);

  private isSidebarCollapsed = false;

  constructor() {}

  getSidebarItems(): SidebarItem[] {
    return this.sidebarItems;
  }

  toggleItemExpansion(itemId: number): void {
    if (this.isSidebarCollapsed) {
      // When sidebar is collapsed, don't expand items
      return;
    }

    const item = this.findItemById(this.sidebarItems, itemId);
    if (item && item.children) {
      item.isExpanded = !item.isExpanded;
    }
  }

  setActiveItem(itemId: number): void {
    // Deactivate all items
    this.deactivateAllItems(this.sidebarItems);

    // Activate the clicked item
    const item = this.findItemById(this.sidebarItems, itemId);
    if (item) {
      item.isActive = true;
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;

    // When collapsing sidebar, collapse all items
    if (this.isSidebarCollapsed) {
      this.collapseAllItems(this.sidebarItems);
    }
  }

  isCollapsed(): boolean {
    return this.isSidebarCollapsed;
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
      if (item.id === id) {
        return item;
      }
      if (item.children) {
        const found = this.findItemById(item.children, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }
  private findActivePath(items: SidebarItem[], path: SidebarItem[]): boolean {
    for (const item of items) {
      path.push(item);

      if (item.isActive) {
        return true;
      }

      if (item.children && this.findActivePath(item.children, path)) {
        return true;
      }

      path.pop(); // remove if not in active path
    }
    return false;
  }

  getBreadcrumb(): SidebarItem[] {
    const path: SidebarItem[] = [];
    this.findActivePath(this.sidebarItems, path);
    return path;
  }
  setActiveByRoute(url: string): void {
    this.deactivateAllItems(this.sidebarItems);
    this.activateByRoute(this.sidebarItems, url);
  }

  private activateByRoute(items: SidebarItem[], url: string): boolean {
    for (const item of items) {
      if (item.route && url.startsWith(item.route)) {
        item.isActive = true;
        return true;
      }

      if (item.children && this.activateByRoute(item.children, url)) {
        item.isExpanded = true; // open parent
        return true;
      }
    }
    return false;
  }


}
