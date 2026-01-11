import { Injectable } from '@angular/core';
import { SidebarItem } from '../models/sidebar-item.model';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  
  private sidebarItems: SidebarItem[] = [
    {
      id: 1,
      label: 'Dashboard',
      icon: 'fa-home',
      route: '/dashboard',
      isActive: true,
      isExpanded: true,
      children: [
        { 
          id: 11, 
          label: 'Overview', 
          icon: 'fa-chart-pie', 
          route: '/dashboard/overview', 
          isActive: true,
          badge: { text: '5', color: 'bg-primary-500' }
        },
        { id: 12, label: 'Analytics', icon: 'fa-chart-line', route: '/dashboard/analytics', isActive: false },
        { id: 13, label: 'Campaigns', icon: 'fa-bullhorn', route: '/dashboard/campaigns', isActive: false }
      ]
    },
    {
      id: 2,
      label: 'Apps',
      icon: 'fa-th-large',
      route: '/apps',
      isActive: false,
      isExpanded: false,
      children: [
        { id: 21, label: 'Chat', icon: 'fa-comments', route: '/apps/chat', isActive: false },
        { id: 22, label: 'Email', icon: 'fa-envelope', route: '/apps/email', isActive: false },
        { id: 23, label: 'Calendar', icon: 'fa-calendar-alt', route: '/apps/calendar', isActive: false }
      ]
    },
    {
      id: 3,
      label: 'Pages',
      icon: 'fa-file-alt',
      route: '/pages',
      isActive: false,
      isExpanded: false,
      children: [
        { id: 31, label: 'Users', icon: 'fa-users', route: '/pages/users', isActive: false },
        { id: 32, label: 'Profile', icon: 'fa-user-circle', route: '/pages/profile', isActive: false },
        { id: 33, label: 'Settings', icon: 'fa-cog', route: '/pages/settings', isActive: false }
      ]
    },
    {
      id: 4,
      label: 'Authentication',
      icon: 'fa-shield-alt',
      route: '/auth',
      isActive: false,
      isExpanded: false,
      children: [
        { id: 41, label: 'Login', icon: 'fa-sign-in-alt', route: '/auth/login', isActive: false },
        { id: 42, label: 'Register', icon: 'fa-user-plus', route: '/auth/register', isActive: false },
        { id: 43, label: 'Forgot Password', icon: 'fa-key', route: '/auth/forgot-password', isActive: false }
      ]
    },
    {
      id: 5,
      label: 'Layouts',
      icon: 'fa-layer-group',
      route: '/layouts',
      isActive: false,
      isExpanded: false,
      children: [
        { id: 51, label: 'Light', icon: 'fa-sun', route: '/layouts/light', isActive: false },
        { id: 52, label: 'Dark', icon: 'fa-moon', route: '/layouts/dark', isActive: false },
        { id: 53, label: 'Fluid', icon: 'fa-expand-alt', route: '/layouts/fluid', isActive: false }
      ]
    }
  ];

  private isSidebarCollapsed = false;

  constructor() { }

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
    items.forEach(item => {
      item.isActive = false;
      if (item.children) {
        this.deactivateAllItems(item.children);
      }
    });
  }

  private collapseAllItems(items: SidebarItem[]): void {
    items.forEach(item => {
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