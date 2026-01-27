import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { SidebarService } from '../../../services/sidebar.service';
import { SidebarItem } from '../../../models/sidebar-item.model';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('childAnimation', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('200ms ease-out', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('150ms ease-in', style({ height: 0, opacity: 0 })),
      ]),
    ]),
  ],
})
export class Sidebar implements OnInit, OnDestroy {
  sidebarItems: SidebarItem[] = [];
  isCollapsed = false;
  
  // Used to clean up subscriptions and prevent memory leaks
  private destroy$ = new Subject<void>();

  constructor(
    public sidebarService: SidebarService, // Public so it can be used in template if needed
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1. Subscribe to items from the service
    this.sidebarService.sidebarItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        this.sidebarItems = items;
        this.isCollapsed = this.sidebarService.isCollapsed();
        this.cdr.markForCheck(); // Essential for OnPush
      });

    // 2. Automatically update active state when the route changes
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        this.sidebarService.setActiveByRoute(event.urlAfterRedirects || event.url);
      });

    // Initial check for the current route on load
    this.sidebarService.setActiveByRoute(this.router.url);
  }

  toggleItemExpansion(itemId: number): void {
    this.sidebarService.toggleItemExpansion(itemId);
    // No need for manual markForCheck() here if the service refreshes the stream
  }

  setActiveItem(itemId: number): void {
    this.sidebarService.setActiveItem(itemId);
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  trackById(index: number, item: SidebarItem): number {
    return item.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
