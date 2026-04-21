import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../core/config/api.config';

export interface CenterResponse {
  id: string;
  name: string;
  code: string;
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  centerAdmins: Array<{ id: string; fullName: string; email: string; phone: string | null }>;
}

export interface CreateCenterOnboardingRequest {
  center: {
    name: string;
    code: string;
    contactEmail: string;
    contactPhone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    status: string;
  };
  admin: {
    fullName: string;
    email: string;
    phone: string;
  };
}

export interface CreateCenterOnboardingResponse {
  center: CenterResponse;
  initialAdmin: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    temporaryPassword: string;
  };
}

export interface UpdateCenterRequest {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class CentersService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig
  ) {}

  listCenters(): Observable<CenterResponse[]> {
    return this.http.get<CenterResponse[]>(`${this.apiConfig.baseUrl}/centers`);
  }

  getCenter(centerId: string): Observable<CenterResponse> {
    return this.http.get<CenterResponse>(`${this.apiConfig.baseUrl}/centers/${centerId}`);
  }

  createCenter(payload: CreateCenterOnboardingRequest): Observable<CreateCenterOnboardingResponse> {
    return this.http.post<CreateCenterOnboardingResponse>(
      `${this.apiConfig.baseUrl}/centers/onboard`,
      payload
    );
  }

  updateCenter(centerId: string, payload: UpdateCenterRequest): Observable<CenterResponse> {
    return this.http.patch<CenterResponse>(`${this.apiConfig.baseUrl}/centers/${centerId}`, payload);
  }
}
