import { Injectable, signal, effect } from '@angular/core';
import { SidebarItem } from '../models/sidebar-item.model';
import { SIDEBAR_ROUTES } from '../shared/SIdeBarRoutes';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private sidebarItems: SidebarItem[] = structuredClone(SIDEBAR_ROUTES);

  private readonly STORAGE_KEY = 'sidebar-collapsed';

  // ✅ Initialize from localStorage
  private _isCollapsed = signal<boolean>(localStorage.getItem(this.STORAGE_KEY) === 'true');

  // Expose signal
  sidebarCollapsedSignal = this._isCollapsed;

  constructor() {
    // ✅ Persist automatically whenever value changes
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, this._isCollapsed().toString());
    });
  }

  // ---------------- Breadcrumb Logic ----------------

  getBreadcrumb(): SidebarItem[] {
    const path: SidebarItem[] = [];

    const findActive = (items: SidebarItem[]) => {
      for (const item of items) {
        if (item.isActive) {
          path.push(item);
          if (item.children) findActive(item.children);
          break;
        } else if (item.children) {
          findActive(item.children);
        }
      }
    };

    findActive(this.sidebarItems);
    return path;
  }

  // ---------------- Sidebar Items ----------------

  getSidebarItems(): SidebarItem[] {
    return this.sidebarItems;
  }

  toggleItemExpansion(itemId: number): void {
    if (this._isCollapsed()) return; // prevent expanding when collapsed

    const item = this.findItemById(this.sidebarItems, itemId);
    if (item && item.children) {
      item.isExpanded = !item.isExpanded;
    }
  }

  setActiveItem(itemId: number): void {
    this.deactivateAllItems(this.sidebarItems);
    const item = this.findItemById(this.sidebarItems, itemId);
    if (item) item.isActive = true;
  }

  // ---------------- Sidebar Collapse ----------------

  toggleSidebar(): void {
    this._isCollapsed.set(!this._isCollapsed());

    if (this._isCollapsed()) {
      this.collapseAllItems(this.sidebarItems);
    }
  }

  isCollapsed(): boolean {
    return this._isCollapsed();
  }

  // ---------------- Private Helpers ----------------

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
}
