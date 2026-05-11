import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { SidebarService } from './sidebar.service';

describe('SidebarService', () => {
  let service: SidebarService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', children: [] },
          { path: 'auth/users', children: [] },
          { path: 'auth/roles', children: [] },
          { path: 'auth/permissions', children: [] },
          { path: 'settings/languages', children: [] },
          { path: 'settings/backups', children: [] },
        ]),
      ],
    });

    router = TestBed.inject(Router);
    service = TestBed.inject(SidebarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('marks parent items active and expanded when a child item is selected', () => {
    service.setActiveItem(42);

    const userManagement = service.getSidebarItems().find((item) => item.id === 4);
    const users = userManagement?.children?.find((item) => item.id === 42);

    expect(userManagement?.isActive).toBe(true);
    expect(userManagement?.isExpanded).toBe(true);
    expect(users?.isActive).toBe(true);
  });

  it('syncs parent and child active state from the current route', async () => {
    await router.navigateByUrl('/settings/backups');

    const settings = service.getSidebarItems().find((item) => item.id === 5);
    const backups = settings?.children?.find((item) => item.id === 51);

    expect(settings?.isActive).toBe(true);
    expect(settings?.isExpanded).toBe(true);
    expect(backups?.isActive).toBe(true);
  });
});
