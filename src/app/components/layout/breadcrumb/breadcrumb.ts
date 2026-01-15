import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SidebarItem } from '../../../models/sidebar-item.model';
import { SidebarService } from '../../../services/sidebar.service';

@Component({
  selector: 'app-breadcrumb',
  standalone: true, // ✅ important
  imports: [CommonModule, RouterModule], // ✅ required for ngFor, ngIf, routerLink
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css',
})
export class Breadcrumb {
  breadcrumb$ = signal<SidebarItem[]>([]);
  private sidebarService = inject(SidebarService);

  ngOnInit() {
    this.breadcrumb$.set(this.sidebarService.getBreadcrumb());
  }
}
