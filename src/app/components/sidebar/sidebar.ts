import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { SidebarService } from '../../services/sidebar.service';
import { SidebarItem } from '../../models/sidebar-item.model';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  imports: [
  CommonModule, // for *ngIf, *ngFor
  RouterModule  // for routerLink
],
  animations: [
    trigger('sidebarAnimation', [
      transition(':enter', [
        style({ width: '0px' }),
        animate('300ms ease-in-out', style({ width: '260px' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({ width: '0px' }))
      ])
    ]),
    trigger('itemAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-20px)' }))
      ])
    ]),
    trigger('childAnimation', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ]),
    trigger('rotateChevron', [
      transition(':enter', [
        style({ transform: 'rotate(0deg)' }),
        animate('200ms ease-out', style({ transform: 'rotate(180deg)' }))
      ])
    ])
  ]
})
export class Sidebar implements OnInit {
  sidebarItems: SidebarItem[] = [];
  isCollapsed = false;

  constructor(private sidebarService: SidebarService) { }

  ngOnInit(): void {
    this.sidebarItems = this.sidebarService.getSidebarItems();
    this.isCollapsed = this.sidebarService.isCollapsed();
  }

  toggleItemExpansion(itemId: number): void {
    this.sidebarService.toggleItemExpansion(itemId);
  }

  setActiveItem(itemId: number): void {
    this.sidebarService.setActiveItem(itemId);
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
    this.isCollapsed = this.sidebarService.isCollapsed();
  }

  isSidebarCollapsed(): boolean {
    return this.isCollapsed;
  }

  getActiveItemClass(item: SidebarItem): string {
    if (item.isActive) {
      return this.isCollapsed 
        ? 'bg-primary-50 text-primary-600 border-primary-500 border-r-4' 
        : 'bg-primary-50 text-primary-600';
    }
    return '';
  }
}