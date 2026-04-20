import { Injectable, computed, signal } from '@angular/core';
import { AuthUser, UserRole } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly userState = signal<AuthUser | null>(null);
  private readonly bootstrappedState = signal(false);

  readonly user = this.userState.asReadonly();
  readonly bootstrapped = this.bootstrappedState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);
  readonly role = computed(() => this.userState()?.role ?? null);
  readonly isSuperAdmin = computed(() => this.userState()?.role === 'SUPER_ADMIN');

  setUser(user: AuthUser | null): void {
    this.userState.set(user);
    this.bootstrappedState.set(true);
  }

  setBootstrapped(): void {
    this.bootstrappedState.set(true);
  }

  hasRole(roles: UserRole[]): boolean {
    const role = this.userState()?.role;
    return !!role && roles.includes(role);
  }
}
