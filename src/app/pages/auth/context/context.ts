import { Component, inject } from '@angular/core';
import { DynamicFormBuilder } from '../../../components/ui/dynamic-form-builder/dynamic-form-builder';
import { DynamicField } from '../../../models/fomrBuilderModel';
import { ClientContextService } from '../../../services/client-context.service';

@Component({
  selector: 'app-auth-context',
  standalone: true,
  imports: [DynamicFormBuilder],
  templateUrl: './context.html',
  styleUrl: './context.css',
})
export class AuthContext {
  private clientContext = inject(ClientContextService);

  message = '';

  fields: DynamicField[] = [
    { type: 'text', name: 'clientId', label: 'Client ID', required: true },
    { type: 'textarea', name: 'clientAssertion', label: 'Client Assertion JWT', required: true },
  ];

  save = (payload: any) => {
    this.clientContext.setContext(payload.clientId, payload.clientAssertion);
    this.message = 'Client context updated';
  };

  clear() {
    this.clientContext.clearContext();
    this.message = 'Client context cleared';
  }

  get currentClientId() {
    return this.clientContext.getClientId();
  }
}
