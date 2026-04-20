import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../core/config/api.config';
import { PaginatedResponse } from '../../core/models/api.models';
import { toHttpParams } from '../../core/http/query-params.util';

export interface UserResponse {
  id: string;
  centerId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  role: 'SUPER_ADMIN' | 'CENTER_ADMIN' | 'COACH';
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  center: { id: string; name: string; code: string } | null;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig
  ) {}

  listUsers(query: { page?: number; limit?: number; centerId?: string; role?: string; status?: string } = {}):
    Observable<PaginatedResponse<UserResponse>> {
    return this.http.get<PaginatedResponse<UserResponse>>(`${this.apiConfig.baseUrl}/users`, {
      params: toHttpParams(query)
    });
  }
}
