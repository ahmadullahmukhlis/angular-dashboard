import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { DynamicFormBuilder } from '../../components/ui/dynamic-form-builder/dynamic-form-builder';
import { DynamicField } from '../../models/fomrBuilderModel';
import { AppStateService } from '../../state/user.state';
import { ComponentService } from '../../services/genral/component.service';
import { ToastService } from '../../services/genral/tost.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, DynamicFormBuilder],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfilePage {
  private readonly appState = inject(AppStateService);
  private readonly componentService = inject(ComponentService);
  private readonly toastService = inject(ToastService);

  readonly currentUser = this.appState.userSignal;

  readonly profileFields: DynamicField[] = [
    {
      type: 'profile-image',
      name: 'image',
      label: 'Profile Image',
      className: 'md:col-span-2',
    },
    {
      type: 'text',
      name: 'first_name',
      label: 'First Name',
      required: true,
      className: 'md:col-span-1',
    },
    {
      type: 'text',
      name: 'last_name',
      label: 'Last Name',
      required: true,
      className: 'md:col-span-1',
    },
    {
      type: 'text',
      name: 'email',
      label: 'Email',
      required: true,
      className: 'md:col-span-2',
    },
  ];

  readonly passwordFields: DynamicField[] = [
    {
      type: 'password',
      name: 'old_password',
      label: 'Current Password',
      required: true,
      className: 'md:col-span-1',
    },
    {
      type: 'password',
      name: 'new_password',
      label: 'New Password',
      required: true,
      minLength: 8,
      className: 'md:col-span-1',
    },
    {
      type: 'password',
      name: 'confirm_password',
      label: 'Confirm Password',
      required: true,
      minLength: 8,
      className: 'md:col-span-2',
    },
  ];

  readonly profileInitialValues = computed(() => ({
    image: this.currentUser()?.image_url || this.currentUser()?.image || null,
    first_name: this.currentUser()?.first_name || '',
    last_name: this.currentUser()?.last_name || '',
    email: this.currentUser()?.email || '',
  }));

  readonly profileAction = '/user/profile';
  readonly passwordAction = '/user/change-password';

  transformProfilePayload = (payload: any) => payload;

  onProfileSaved(response: any): void {
    const updatedUser = response?.user;

    if (updatedUser) {
      const currentUser = this.currentUser();
      this.appState.setUser({
        ...(currentUser ?? {}),
        ...updatedUser,
        roles: updatedUser?.roles ?? currentUser?.roles ?? [],
        permissions: updatedUser?.permissions ?? currentUser?.permissions ?? [],
      });
    }

    this.toastService.success('Success', response?.message ?? 'Profile updated successfully');
    this.componentService.revalidate('*');
  }

  onPasswordChanged(response: any): void {
    this.toastService.success('Success', response?.message ?? 'Password updated successfully');
  }
}
