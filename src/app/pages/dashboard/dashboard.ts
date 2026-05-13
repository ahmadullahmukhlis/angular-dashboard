import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ServerData } from '../../components/ui/server-data/server-data';
import { ComponentService } from '../../services/genral/component.service';

interface RealmStatsItem {
  realm_id: number;
  realm_name: string;
  realm_slug: string;
  is_active: boolean;
  users_count: number;
  active_users_count: number;
  clients_count: number;
  active_clients_count: number;
  service_accounts_count: number;
  active_service_accounts_count: number;
}

interface IdentityDashboardStatsResponse {
  users_count: number;
  active_users_count: number;
  realms_count: number;
  active_realms_count: number;
  clients_count: number;
  active_clients_count: number;
  service_accounts_count: number;
  active_service_accounts_count: number;
  realm_stats: RealmStatsItem[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ServerData],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly componentService = inject(ComponentService);

  readonly statsUrl = '/identity/dashboard/stats';
  readonly statsCardConfig = [
    {
      key: 'users',
      title: 'Users',
      totalKey: 'users_count',
      activeKey: 'active_users_count',
      icon: 'fa-users',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      key: 'realms',
      title: 'Realms',
      totalKey: 'realms_count',
      activeKey: 'active_realms_count',
      icon: 'fa-globe',
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      key: 'clients',
      title: 'Clients',
      totalKey: 'clients_count',
      activeKey: 'active_clients_count',
      icon: 'fa-diagram-project',
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      key: 'serviceAccounts',
      title: 'Service Accounts',
      totalKey: 'service_accounts_count',
      activeKey: 'active_service_accounts_count',
      icon: 'fa-key',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ] as const;

  reloadStats(): void {
    this.componentService.revalidate('dashboard-stats');
  }

  totalFor(stats: IdentityDashboardStatsResponse, totalKey: keyof IdentityDashboardStatsResponse): number {
    return Number(stats?.[totalKey] ?? 0);
  }

  activeFor(stats: IdentityDashboardStatsResponse, activeKey: keyof IdentityDashboardStatsResponse): number {
    return Number(stats?.[activeKey] ?? 0);
  }

  inactiveFor(stats: IdentityDashboardStatsResponse, totalKey: keyof IdentityDashboardStatsResponse, activeKey: keyof IdentityDashboardStatsResponse): number {
    return Math.max(this.totalFor(stats, totalKey) - this.activeFor(stats, activeKey), 0);
  }

  activePercentFor(stats: IdentityDashboardStatsResponse, totalKey: keyof IdentityDashboardStatsResponse, activeKey: keyof IdentityDashboardStatsResponse): number {
    const total = this.totalFor(stats, totalKey);
    if (!total) return 0;
    return Math.round((this.activeFor(stats, activeKey) / total) * 100);
  }

  realmStats(stats: IdentityDashboardStatsResponse): RealmStatsItem[] {
    return Array.isArray(stats?.realm_stats) ? stats.realm_stats : [];
  }

  trackRealm(_index: number, realm: RealmStatsItem): string {
    return realm.realm_slug;
  }
}
