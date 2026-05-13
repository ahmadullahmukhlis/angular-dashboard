import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Datatable } from '../../../components/ui/datatable/datatable';
import { DynamicFormBuilder } from '../../../components/ui/dynamic-form-builder/dynamic-form-builder';
import { Modal } from '../../../components/ui/modal/modal';
import { DataTableConfig } from '../../../models/datatable.model';
import { DynamicField } from '../../../models/fomrBuilderModel';
import { ApiService } from '../../../services/api/api.service';
import { ComponentService } from '../../../services/genral/component.service';
import { ToastService } from '../../../services/genral/tost.service';
import { PermissionGate } from '../../../components/ui/permission-gate/permission-gate';
import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-settings-languages',
  standalone: true,
  imports: [CommonModule, Datatable, DynamicFormBuilder, Modal, PermissionGate],
  templateUrl: './languages.html',
  styleUrl: './languages.css',
})
export class SettingsLanguages {
  private api = inject(ApiService);
  private toastService = inject(ToastService);
  private componentService = inject(ComponentService);
  readonly permissionService = inject(PermissionService);

  selectedLanguage: any | null = null;
  languageFields: DynamicField[] = [];
  wordFields: DynamicField[] = [];
  editingWordId: number | null = null;

  languageTableConfig: DataTableConfig = {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Language' },
      { key: 'abbr', label: 'Abbr' },
      { key: 'direction', label: 'Direction' },
      { key: 'status', label: 'Status', type: 'boolean' },
    ],
    searchKey: 'search',
    rowActions: [
      {
        label: 'Delete',
        icon: 'fa-trash',
        color: 'danger',
        action: (row) => this.deleteLanguage(row),
        hidden: () => !this.permissionService.hasPermission('languages-delete'),
      },
    ],
  };

  wordTableConfig: DataTableConfig = {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'word', label: 'Word' },
      { key: 'translation', label: 'Translation' },
      { key: 'created_at', label: 'Created At' },
    ],
    searchKey: 'search',
    rowActions: [
      {
        label: 'Edit',
        icon: 'fa-edit',
        color: 'warning',
        action: (row) => this.openWordModal(row),
        hidden: () => !this.permissionService.hasPermission('language-dictionary-add-word'),
      },
      {
        label: 'Delete',
        icon: 'fa-trash',
        color: 'danger',
        action: (row) => this.deleteWord(row),
        hidden: () => !this.permissionService.hasPermission('language-dictionary-delete-word'),
      },
    ],
  };

  get wordsUrl(): string {
    if (!this.selectedLanguage?.id) {
      return '';
    }

    return `/configurations/language/words?language_id=${this.selectedLanguage.id}`;
  }

  get languageAction(): string {
    return '/configurations/languages';
  }

  get wordAction(): string {
    return this.editingWordId
      ? `/configurations/language/words/${this.editingWordId}`
      : '/configurations/language/words';
  }

  openLanguageModal() {
    this.languageFields = [
      {
        type: 'text',
        name: 'name',
        label: 'Language Name',
        required: true,
      },
      {
        type: 'text',
        name: 'abbr',
        label: 'Abbr',
        required: true,
      },
      {
        type: 'select',
        name: 'direction',
        label: 'Direction',
        required: true,
        options: [
          { label: 'LTR', value: 'ltr' },
          { label: 'RTL', value: 'rtl' },
        ],
        optionLabel: 'label',
        optionValue: 'value',
        defaultValue: 'ltr',
      },
      {
        type: 'switch',
        name: 'status',
        label: 'Active',
        defaultValue: true,
      },
    ];
  }

  openWordModal(word: any | null = null) {
    this.editingWordId = word?.id ?? null;
    this.wordFields = [
      {
        type: 'text',
        name: 'word',
        label: 'Word',
        required: true,
        defaultValue: word?.word ?? null,
      },
      {
        type: 'text',
        name: 'translation',
        label: 'Translation',
        required: true,
        defaultValue: word?.translation ?? null,
      },
    ];
  }

  closeModals() {
    this.languageFields = [];
    this.wordFields = [];
    this.editingWordId = null;
  }

  selectLanguage(language: any) {
    this.selectedLanguage = language;
  }

  transformLanguagePayload = (payload: any) => ({
    name: payload.name,
    abbr: payload.abbr,
    direction: payload.direction ?? 'ltr',
    status: Boolean(payload.status),
  });

  transformWordPayload = (payload: any) => ({
    id: this.editingWordId ?? 0,
    word: payload.word,
    translation: payload.translation,
    language_id: this.selectedLanguage.id,
  });

  onLanguageSaved = (response: any) => {
    this.closeModals();
    this.toastService.success('Success', response?.message ?? 'Language created successfully');
    this.componentService.revalidate('settings-languages-table');
  };

  onWordSaved = (response: any) => {
    this.closeModals();
    this.toastService.success(
      'Success',
      response?.message ??
        (this.editingWordId ? 'Language dictionary updated successfully' : 'Language dictionary added successfully'),
    );
    this.componentService.revalidate('settings-language-words-table');
  };

  deleteLanguage(language: any) {
    if (!language?.id) return;

    this.toastService.confirmDelete({ name: language.name ?? 'language' }, () => {
      this.api.delete(`/configurations/languages/${language.id}`).subscribe({
        next: (response: any) => {
          if (response?.result === false) {
            this.toastService.error(response?.message ?? 'Language cannot be deleted');
            return;
          }

          if (this.selectedLanguage?.id === language.id) {
            this.selectedLanguage = null;
          }

          this.toastService.success('Deleted', response?.message ?? 'Language deleted successfully');
          this.componentService.revalidate('settings-languages-table');
        },
      });
    });
  }

  deleteWord(word: any) {
    if (!word?.id) return;

    this.toastService.confirmDelete({ name: word.word ?? 'language word' }, () => {
      this.api.delete(`/configurations/language/words/${word.id}`).subscribe({
        next: (response: any) => {
          this.toastService.success('Deleted', response?.message ?? 'Language dictionary deleted successfully');
          this.componentService.revalidate('settings-language-words-table');
        },
      });
    });
  }
}
