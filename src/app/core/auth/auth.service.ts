import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../config/api.config';
import { AuthUser, LoginRequest, LoginResponse } from '../models/auth.models';
import { SessionService } from './session.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private readonly http: HttpClient,
    private readonly session: SessionService,
    private readonly tokenStorage: TokenStorageService,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig
  ) {}

  login(payload: LoginRequest): Observable<AuthUser> {
    return this.http.post<LoginResponse>(`${this.apiConfig.baseUrl}/auth/login`, payload).pipe(
      tap((response) => {
        this.tokenStorage.setToken(response.accessToken);
        this.session.setUser(response.user);
      }),
      map((response) => response.user)
    );
  }

  bootstrap(): Observable<AuthUser | null> {
    const token = this.tokenStorage.getToken();
    if (!token) {
      this.session.setUser(null);
      return of(null);
    }

    return this.http.get<AuthUser>(`${this.apiConfig.baseUrl}/auth/me`).pipe(
      tap((user) => this.session.setUser(user)),
      catchError((error) => {
        this.logout();
        return of(null);
      })
    );
  }

  logout(): void {
    this.tokenStorage.clear();
    this.session.setUser(null);
  }

  getAccessToken(): string | null {
    return this.tokenStorage.getToken();
  }
}
