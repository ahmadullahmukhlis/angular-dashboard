import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  HostListener,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { SidebarService } from '../../../services/sidebar.service';
import { SidebarItem } from '../../../models/sidebar-item.model';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

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
export class Sidebar implements OnInit {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly sidebarService = inject(SidebarService);
  readonly isCollapsed = this.sidebarService.sidebarCollapsedSignal;
  readonly isMobile = this.sidebarService.isMobileSignal;
  readonly isMobileDrawerOpen = this.sidebarService.mobileDrawerOpenSignal;
  readonly sidebarItems = this.sidebarService.sidebarItemsSignal;

  ngOnInit(): void {
    if (this.isBrowser) {
      this.sidebarService.updateViewport(window.innerWidth);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.isBrowser) {
      this.sidebarService.updateViewport(window.innerWidth);
    }
  }

  toggleItemExpansion(itemId: number): void {
    this.sidebarService.toggleItemExpansion(itemId);
  }

  onItemClick(event: MouseEvent, item: SidebarItem): void {
    if (item.children?.length) {
      event.preventDefault();
      this.toggleItemExpansion(item.id);
      return;
    }

    this.setActiveItem(item.id);
  }

  setActiveItem(itemId: number): void {
    this.sidebarService.setActiveItem(itemId);
    if (this.isMobile()) {
      this.sidebarService.closeMobileDrawer();
    }
  }

  toggleSidebar(): void {
    this.sidebarService.toggleNavigation();
  }

  closeMobileDrawer(): void {
    this.sidebarService.closeMobileDrawer();
  }

  trackById(index: number, item: SidebarItem): number {
    return item.id;
  }
}
