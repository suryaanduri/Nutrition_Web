import { Injectable } from '@angular/core';

const AUTH_TOKEN_STORAGE_KEY = 'ncm.auth.token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  }

  clear(): void {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}
