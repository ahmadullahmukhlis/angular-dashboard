import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AppErrorState } from '../../models/app-error.model';

@Injectable({
  providedIn: 'root',
})
export class AppErrorService {
  normalize(error: unknown, fallbackContext: string = 'request'): AppErrorState {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error;
      const message =
        payload?.message ||
        payload?.error ||
        error.message ||
        `An error occurred while processing ${fallbackContext}.`;

      return {
        title: `Request failed${error.status ? ` (${error.status})` : ''}`,
        message,
        details: typeof payload === 'string' ? payload : JSON.stringify(payload ?? null),
        code: error.status || null,
        retryable: error.status === 0 || error.status >= 500,
      };
    }

    if (error instanceof Error) {
      return {
        title: 'Unexpected error',
        message: error.message || `An error occurred while processing ${fallbackContext}.`,
        details: error.stack ?? null,
        code: null,
        retryable: false,
      };
    }

    return {
      title: 'Unexpected error',
      message: `An error occurred while processing ${fallbackContext}.`,
      details: error ? JSON.stringify(error) : null,
      code: null,
      retryable: false,
    };
  }
}
