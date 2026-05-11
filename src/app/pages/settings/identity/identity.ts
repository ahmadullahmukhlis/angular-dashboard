import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { Datatable } from '../../../components/ui/datatable/datatable';
import { DynamicFormBuilder } from '../../../components/ui/dynamic-form-builder/dynamic-form-builder';
import { Modal } from '../../../components/ui/modal/modal';
import { DataTableConfig } from '../../../models/datatable.model';
import { DynamicField } from '../../../models/fomrBuilderModel';
import { ApiService } from '../../../services/api/api.service';
import { ComponentService } from '../../../services/genral/component.service';
import { ToastService } from '../../../services/genral/tost.service';
import { RealmContextService } from '../../../services/realm-context.service';
import { forkJoin } from 'rxjs';

interface RealmItem {
  id: number;
  name: string;
  slug: string;
  is_active?: boolean;
}

interface ClientItem {
  id: number;
  realm_slug: string;
  name: string;
  client_id: string;
  client_type: string;
  description: string | null;
  is_active?: boolean;
}

interface PermissionItem {
  id: number;
  realm_slug?: string;
  name: string;
  key: string;
}

interface PermissionGroupItem {
  id: number;
  realm_slug?: string;
  name: string;
  icon?: string;
  groups?: PermissionGroupItem[];
  permissions?: PermissionItem[];
}

interface ServiceAccountItem {
  id: number;
  realm_slug: string;
  client_id: string;
  name: string;
  principal: string;
  permissions: string[];
  allowed_audiences: string[];
  is_active?: boolean;
  last_used_at?: string | null;
}

@Component({
  selector: 'app-settings-identity',
  standalone: true,
  imports: [CommonModule, Datatable, DynamicFormBuilder, Modal],
  templateUrl: './identity.html',
  styleUrl: './identity.css',
})
export class SettingsIdentity {
  private readonly api = inject(ApiService);
  private readonly componentService = inject(ComponentService);
  private readonly toastService = inject(ToastService);
  private readonly realmContext = inject(RealmContextService);

  clientsForRealm: ClientItem[] = [];
  serviceAccountsForRealm: ServiceAccountItem[] = [];
  permissionOptionsForRealm: Array<{ label: string; value: string }> = [];

  realmFields: DynamicField[] = [];
  clientFields: DynamicField[] = [];
  serviceAccountFields: DynamicField[] = [];
  tokenFields: DynamicField[] = [];

  tokenResponse: { accessToken: string; tokenType: string; expiresIn: number } | null = null;

  realmTableConfig: DataTableConfig = {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Realm' },
      { key: 'slug', label: 'Slug' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
    searchKey: 'search',
  };

  clientTableConfig: DataTableConfig = {
    columns: [
      { key: 'realm_slug', label: 'Realm', renderer: (value) => this.renderBadge(value) },
      { key: 'name', label: 'Name' },
      { key: 'client_id', label: 'Client ID' },
      { key: 'client_type', label: 'Type' },
      { key: 'description', label: 'Description' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
    searchKey: 'search',
    rowActions: [
      {
        label: 'Copy Client ID',
        icon: 'fa-copy',
        color: 'primary',
        action: (row) => this.copyValue(row?.client_id, 'Client ID copied'),
      },
    ],
  };

  serviceAccountTableConfig: DataTableConfig = {
    columns: [
      { key: 'realm_slug', label: 'Realm', renderer: (value) => this.renderBadge(value) },
      { key: 'client_id', label: 'Client ID' },
      { key: 'name', label: 'Name' },
      { key: 'principal', label: 'Principal' },
      { key: 'permissions', label: 'Permissions', renderer: (value) => this.renderTags(value) },
      { key: 'allowed_audiences', label: 'Allowed Audiences', renderer: (value) => this.renderTags(value) },
      { key: 'is_active', label: 'Active', type: 'boolean' },
      { key: 'last_used_at', label: 'Last Used', type: 'date' },
    ],
    searchKey: 'search',
    rowActions: [
      {
        label: 'Copy Principal',
        icon: 'fa-key',
        color: 'warning',
        action: (row) => this.copyValue(row?.principal, 'Principal copied'),
      },
      {
        label: 'Copy Client ID',
        icon: 'fa-copy',
        color: 'primary',
        action: (row) => this.copyValue(row?.client_id, 'Client ID copied'),
      },
    ],
  };

  constructor() {
    this.realmContext.loadRealms();
    effect(() => {
      this.realmContext.selectedRealmSlug();
      this.tokenResponse = null;
      this.loadClientsForRealm();
      this.loadServiceAccountsForRealm();
      this.loadPermissionsForRealm();
      this.componentService.revalidate('settings-identity-clients-table');
      this.componentService.revalidate('settings-identity-service-accounts-table');
    });
  }

  get realms(): RealmItem[] {
    return this.realmContext.realms() as RealmItem[];
  }

  get selectedRealmSlug(): string {
    return this.realmContext.selectedRealmSlug();
  }

  get realmsUrl(): string {
    return '/identity/realms';
  }

  get clientsUrl(): string {
    return `/identity/realms/${encodeURIComponent(this.selectedRealmSlug)}/clients`;
  }

  get serviceAccountsUrl(): string {
    return `/identity/realms/${encodeURIComponent(this.selectedRealmSlug)}/service-accounts`;
  }

  get realmAction(): string {
    return '/identity/realms';
  }

  get clientAction(): string {
    return '/identity/clients';
  }

  get serviceAccountAction(): string {
    return '/identity/service-accounts';
  }

  get tokenAction(): string {
    return '/service-auth/token';
  }

  onRealmChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value || 'default';
    this.realmContext.setSelectedRealmSlug(value);
  }

  selectRealm(row: RealmItem): void {
    this.realmContext.setSelectedRealmSlug(row?.slug || 'default');
  }

  reloadRealms(): void {
    this.realmContext.loadRealms(true);
    this.componentService.revalidate('settings-identity-realms-table');
  }

  openRealmModal(): void {
    this.realmFields = [
      {
        type: 'text',
        name: 'name',
        label: 'Realm Name',
        required: true,
        onChange: (value, form) => {
          const slug = this.slugify(value);
          form?.get('slug')?.setValue(slug);
        },
      },
      {
        type: 'text',
        name: 'slug',
        label: 'Realm Slug',
        required: true,
        readonly: true,
      },
    ];
  }

  openClientModal(): void {
    this.clientFields = [
      this.createRealmField(),
      {
        type: 'text',
        name: 'name',
        label: 'Client Name',
        required: true,
        onChange: (value, form) => {
          form?.get('client_id')?.setValue(this.slugify(value));
        },
      },
      {
        type: 'text',
        name: 'client_id',
        label: 'Client ID',
        required: true,
        readonly: true,
      },
      {
        type: 'select',
        name: 'client_type',
        label: 'Client Type',
        required: true,
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Confidential', value: 'confidential' },
          { label: 'Service', value: 'service' },
        ],
        optionLabel: 'label',
        optionValue: 'value',
        defaultValue: 'service',
      },
      { type: 'textarea', name: 'description', label: 'Description', className: 'md:col-span-2' },
    ];
  }

  openServiceAccountModal(): void {
    this.tokenResponse = null;
    this.buildServiceAccountFields(this.selectedRealmSlug, this.generateSecret());
  }

  openTokenModal(): void {
    this.tokenResponse = null;
    this.buildTokenFields(this.selectedRealmSlug);
  }

  closeModals(): void {
    this.realmFields = [];
    this.clientFields = [];
    this.serviceAccountFields = [];
    this.tokenFields = [];
  }

  transformClientPayload = (payload: any) => ({
    realm_slug: payload.realm_slug || this.selectedRealmSlug,
    name: payload.name,
    client_id: payload.client_id,
    client_type: payload.client_type,
    description: payload.description || '',
  });

  transformServiceAccountPayload = (payload: any) => ({
    realm_slug: payload.realm_slug || this.selectedRealmSlug,
    client_id: payload.client_id,
    name: payload.name,
    principal: payload.principal,
    secret: payload.secret,
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    allowed_audiences: Array.isArray(payload.allowed_audiences) ? payload.allowed_audiences : [],
  });

  transformTokenPayload = (payload: any) => ({
    realm_slug: payload.realm_slug || this.selectedRealmSlug,
    principal: payload.principal,
    secret: payload.secret,
    audience: payload.audience,
  });

  onRealmSaved = (response: any) => {
    this.closeModals();
    this.toastService.success('Success', response?.message ?? 'Realm created successfully');
    this.realmContext.loadRealms(true);
  };

  transformRealmPayload = (payload: any) => ({
    name: payload.name,
    slug: this.slugify(payload.slug || payload.name),
  });

  onClientSaved = (response: any) => {
    this.closeModals();
    this.toastService.success('Success', response?.message ?? 'Client created successfully');
    this.componentService.revalidate('settings-identity-clients-table');
  };

  onServiceAccountSaved = (response: any) => {
    this.closeModals();
    this.toastService.success('Success', response?.message ?? 'Service account created successfully');
    this.componentService.revalidate('settings-identity-service-accounts-table');
    this.loadServiceAccountsForRealm();
  };

  onTokenIssued = (response: any) => {
    this.tokenResponse = {
      accessToken: response?.accessToken ?? '',
      tokenType: response?.tokenType ?? 'Bearer',
      expiresIn: Number(response?.expiresIn ?? 0),
    };
    this.toastService.success('Success', 'Service token generated successfully');
  };

  copyToken(): void {
    if (!this.tokenResponse?.accessToken) return;
    this.copyValue(this.tokenResponse.accessToken, 'Access token copied');
  }

  private loadClientsForRealm(): void {
    this.api.get<ClientItem[]>(this.clientsUrl).subscribe({
      next: (response) => {
        this.clientsForRealm = Array.isArray(response) ? response : [];
      },
      error: () => {
        this.clientsForRealm = [];
      },
    });
  }

  private loadServiceAccountsForRealm(): void {
    this.api.get<ServiceAccountItem[]>(this.serviceAccountsUrl).subscribe({
        next: (response) => {
          this.serviceAccountsForRealm = Array.isArray(response) ? response : [];
        },
        error: () => {
          this.serviceAccountsForRealm = [];
        },
      });
  }

  private loadPermissionsForRealm(): void {
    this.api
      .get<{ data: PermissionGroupItem[] }>(
        `/user-management/permission-groups?realms=${encodeURIComponent(this.selectedRealmSlug)}`,
      )
      .subscribe({
        next: (response) => {
          this.permissionOptionsForRealm = this.flattenPermissionOptions(response?.data ?? []);
        },
        error: () => {
          this.permissionOptionsForRealm = [];
        },
      });
  }

  private createRealmField(): DynamicField {
    return this.createModalRealmField(this.selectedRealmSlug);
  }

  private createModalRealmField(
    realmSlug: string,
    onChange?: (value: string, form?: any) => void,
  ): DynamicField {
    return {
      type: 'select',
      name: 'realm_slug',
      label: 'Realm',
      required: true,
      options: this.realms.map((realm) => ({ label: realm.name, value: realm.slug })),
      optionLabel: 'label',
      optionValue: 'value',
      defaultValue: realmSlug,
      onChange,
      className: 'md:col-span-2',
    };
  }

  private buildServiceAccountFields(realmSlug: string, secret: string): void {
    forkJoin({
      clients: this.api.get<ClientItem[]>(`/identity/realms/${encodeURIComponent(realmSlug)}/clients`),
      permissions: this.api.get<{ data: PermissionGroupItem[] }>(
        `/user-management/permission-groups?realms=${encodeURIComponent(realmSlug)}`,
      ),
    }).subscribe({
      next: ({ clients, permissions }) => {
        const clientOptions = (Array.isArray(clients) ? clients : []).map((client) => ({
          label: client.client_id,
          value: client.client_id,
        }));
        const permissionOptions = this.flattenPermissionOptions(permissions?.data ?? []);

        this.serviceAccountFields = [
          this.createModalRealmField(realmSlug, (value) => this.buildServiceAccountFields(value || 'default', secret)),
          {
            type: 'select',
            name: 'client_id',
            label: 'Client ID',
            required: true,
            options: clientOptions,
            optionLabel: 'label',
            optionValue: 'value',
            searchable: true,
          },
          { type: 'text', name: 'name', label: 'Service Account Name', required: true },
          { type: 'text', name: 'principal', label: 'Principal', required: true },
          {
            type: 'password',
            name: 'secret',
            label: 'Secret',
            required: true,
            readonly: true,
            defaultValue: secret,
          },
          {
            type: 'multi-select',
            name: 'permissions',
            label: 'Permissions',
            options: permissionOptions,
            optionLabel: 'label',
            optionValue: 'value',
            searchable: true,
            className: 'md:col-span-2',
          },
          {
            type: 'multi-select',
            name: 'allowed_audiences',
            label: 'Allowed Audiences',
            options: clientOptions,
            optionLabel: 'label',
            optionValue: 'value',
            searchable: true,
            className: 'md:col-span-2',
          },
        ];
      },
      error: () => {
        this.serviceAccountFields = [];
        this.toastService.error('Error', 'Failed to load realm data for service account form');
      },
    });
  }

  private buildTokenFields(realmSlug: string, principal?: string): void {
    forkJoin({
      clients: this.api.get<ClientItem[]>(`/identity/realms/${encodeURIComponent(realmSlug)}/clients`),
      serviceAccounts: this.api.get<ServiceAccountItem[]>(
        `/identity/realms/${encodeURIComponent(realmSlug)}/service-accounts`,
      ),
    }).subscribe({
      next: ({ clients, serviceAccounts }) => {
        const clientRows = Array.isArray(clients) ? clients : [];
        const accountRows = Array.isArray(serviceAccounts) ? serviceAccounts : [];
        const principalOptions = accountRows.map((account) => ({
          label: `${account.name} (${account.principal})`,
          value: account.principal,
        }));
        const selectedAccount =
          accountRows.find((account) => account.principal === principal) ?? accountRows[0] ?? null;
        const audienceOptions =
          selectedAccount?.allowed_audiences?.map((audience) => ({ label: audience, value: audience })) ??
          clientRows.map((client) => ({ label: client.client_id, value: client.client_id }));

        this.tokenFields = [
          this.createModalRealmField(realmSlug, (value) => this.buildTokenFields(value || 'default')),
          {
            type: 'select',
            name: 'principal',
            label: 'Principal',
            required: true,
            options: principalOptions,
            optionLabel: 'label',
            optionValue: 'value',
            searchable: true,
            defaultValue: selectedAccount?.principal ?? null,
            onChange: (value) => this.buildTokenFields(realmSlug, value),
          },
          { type: 'password', name: 'secret', label: 'Secret', required: true },
          {
            type: 'select',
            name: 'audience',
            label: 'Audience',
            required: true,
            options: audienceOptions,
            optionLabel: 'label',
            optionValue: 'value',
            searchable: true,
            defaultValue: audienceOptions[0]?.value ?? null,
            className: 'md:col-span-2',
          },
        ];
      },
      error: () => {
        this.tokenFields = [];
        this.toastService.error('Error', 'Failed to load realm data for token form');
      },
    });
  }

  private parseCsv(value: string | null | undefined): string[] {
    return String(value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private flattenPermissionOptions(groups: PermissionGroupItem[]): Array<{ label: string; value: string }> {
    return groups.flatMap((group) => [
      ...((group.permissions ?? []).map((permission) => ({
        label: `${group.name} / ${permission.name}`,
        value: permission.key,
      })) as Array<{ label: string; value: string }>),
      ...this.flattenPermissionOptions(group.groups ?? []),
    ]);
  }

  private slugify(value: string | null | undefined): string {
    return String(value ?? '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private generateSecret(length: number = 32): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let result = '';

    for (let i = 0; i < length; i += 1) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  private renderBadge(value: string | null | undefined): string {
    return `<span class="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">${value || 'default'}</span>`;
  }

  private renderTags(value: string[] | null | undefined): string {
    if (!Array.isArray(value) || value.length === 0) {
      return '—';
    }

    return value
      .map(
        (item) =>
          `<span class="mr-1 inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">${item}</span>`,
      )
      .join(' ');
  }

  private copyValue(value: string | null | undefined, message: string): void {
    if (!value) return;

    navigator.clipboard.writeText(String(value)).then(() => {
      this.toastService.success('Copied', message);
    });
  }
}
