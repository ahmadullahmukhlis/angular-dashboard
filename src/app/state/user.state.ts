import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SessionUser {
  id?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  image?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  change_password?: boolean;
  roles?: string[];
  permissions?: string[];
}

export interface AuthMeta {
  tokenType?: string | null;
  expiresIn?: number | null;
  refreshExpiresIn?: number | null;
}

export interface AppState {
  user: SessionUser | null;
  auth: AuthMeta | null;
}

@Injectable({
  providedIn: 'root' // ✅ singleton global state
})
export class AppStateService {

  // private state object
  private state: AppState = { user: null, auth: null };

  // BehaviorSubject to emit state changes
  private stateSubject = new BehaviorSubject<AppState>(this.state);
  readonly stateSignal = signal<AppState>(this.state);
  readonly userSignal = signal<SessionUser | null>(this.state.user);
  readonly authSignal = signal<AuthMeta | null>(this.state.auth);

  // Observable to subscribe globally
  public state$: Observable<AppState> = this.stateSubject.asObservable();

  constructor() {
    // load state from localStorage if exists
    const saved = localStorage.getItem('appState');
    if (saved) {
      try {
        this.state = JSON.parse(saved);
        this.stateSubject.next(this.state);
        this.stateSignal.set({ ...this.state });
        this.userSignal.set(this.state.user);
        this.authSignal.set(this.state.auth);
      } catch {
        localStorage.removeItem('appState');
      }
    }
  }

  // ---- Setters ----

  setUser(user: SessionUser) {
    this.state.user = user;
    this.emit();
  }

  setAuth(auth: AuthMeta | null) {
    this.state.auth = auth;
    this.emit();
  }

  setSession(user: SessionUser | null, auth: AuthMeta | null) {
    this.state.user = user;
    this.state.auth = auth;
    this.emit();
  }

  clearUser() {
    this.state.user = null;
    this.state.auth = null;
    this.emit();
  }

  // ---- Getters ----

  get user(): SessionUser | null {
    return this.state.user;
  }

  get auth(): AuthMeta | null {
    return this.state.auth;
  }

  // emit updated state
  private emit() {
    this.stateSubject.next({ ...this.state });
    this.stateSignal.set({ ...this.state });
    this.userSignal.set(this.state.user);
    this.authSignal.set(this.state.auth);
    localStorage.setItem('appState', JSON.stringify(this.state));
  }
}
