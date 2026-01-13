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
}
