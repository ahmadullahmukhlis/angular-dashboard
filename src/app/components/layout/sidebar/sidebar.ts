import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { SidebarService } from '../../../services/sidebar.service';
import { SidebarItem } from '../../../models/sidebar-item.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
  // FIX 1: ChangeDetectionStrategy.OnPush stops Angular from 
  // constantly re-checking the sidebar, significantly boosting speed.
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('sidebarAnimation', [
      transition(':enter', [
        style({ width: '0px' }),
        animate('300ms ease-in-out', style({ width: '260px' })),
        // FIX 2: Use stagger to load items one-by-one (50ms gap)
        // This prevents the "frozen" UI feeling on load.
        query('.sidebar-item', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(50, [
            animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ]),
      transition(':leave', [animate('300ms ease-in-out', style({ width: '0px' }))]),
    ]),
    trigger('childAnimation', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('250ms ease-out', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('200ms ease-in', style({ height: 0, opacity: 0 }))
      ]),
    ]),
  ],
})
export class Sidebar implements OnInit {
  sidebarItems: SidebarItem[] = [];
  isCollapsed = false;

  constructor(
    private sidebarService: SidebarService,
    private cdr: ChangeDetectorRef // Required for OnPush updates
  ) {}

  ngOnInit(): void {
    // FIX 3: If your service is synchronous, ensure data is ready.
    this.sidebarItems = this.sidebarService.getSidebarItems();
    this.isCollapsed = this.sidebarService.isCollapsed();
  }

  toggleItemExpansion(itemId: number): void {
    this.sidebarService.toggleItemExpansion(itemId);
    this.cdr.markForCheck(); // Notify Angular to update UI
  }

  setActiveItem(itemId: number): void {
    this.sidebarService.setActiveItem(itemId);
    this.cdr.markForCheck();
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
    this.isCollapsed = this.sidebarService.isCollapsed();
    this.cdr.markForCheck();
  }

  // FIX 4: trackBy ensures Angular doesn't recreate the DOM for 
  // every item when a single property changes.
  trackById(index: number, item: SidebarItem): number {
    return item.id;
  }

  getActiveItemClass(item: SidebarItem): string {
    if (!item.isActive) return '';
    return this.isCollapsed
      ? 'bg-primary-50 text-primary-600 border-primary-500 border-r-4'
      : 'bg-primary-50 text-primary-600';
  }
}
