import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';
import { SidebarService } from '../../../services/sidebar.service';
import { DeleteConfirmation } from '../../ui/delete-confirmation/delete-confirmation';
import { ToastComponent } from '../../ui/toast.component/toast.component';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    Sidebar, 
    Header, 
    DeleteConfirmation, 
    ToastComponent
  ],
  templateUrl: './main-content.html',
  styleUrls: ['./main-content.css'],
})
export class MainContent implements OnInit, OnDestroy {
  isMobile = false;
  private destroy$ = new Subject<void>();

  constructor(
    private sidebarService: SidebarService,
    private router: Router
  ) {
    this.checkMobile();
  }

  ngOnInit(): void {
    // 1. Listen for route changes to refresh sidebar state automatically
    // This fixes the issue where navigating between children doesn't update the sidebar
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      this.sidebarService.setActiveByRoute(url);
    });

    // 2. Initial trigger for the current URL when the component first loads
    this.sidebarService.setActiveByRoute(this.router.url);
  }
  @HostListener('window:resize', ['$event'])
onResize(event: UIEvent): void { // Add the parameter here
  this.checkMobile();
}

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

  // Getter used in template to adjust layout classes based on sidebar state
  get isCollapsed(): boolean {
    return this.sidebarService.isCollapsed();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.destroy$.next();
    this.destroy$.complete();
  }
}
