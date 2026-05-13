import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';

export const PermissionGuard: CanActivateFn = (route) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);
  const permissions = route.data?.['permissions'] as string[] | undefined;

  if (!permissions?.length || permissionService.hasAnyPermission(permissions)) {
    return true;
  }

  return router.parseUrl('/');
};
