import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../core/config/api.config';
import { PaginatedResponse } from '../../core/models/api.models';
import { toHttpParams } from '../../core/http/query-params.util';

export interface MemberResponse {
  id: string;
  centerId: string;
  memberCode: string;
  fullName: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  heightCm: string;
  goal: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  center: { id: string; name: string; code: string };
  assignedCoach: { id: string; fullName: string; email: string; phone: string | null } | null;
  latestEvaluation: {
    id: string;
    evaluatedAt: string;
    weightKg: string;
    visceralFatPercent: string | null;
    trunkSubcutaneousFat: string | null;
    bodyFat: string | null;
    bodyAge: number | null;
    bmi: string | null;
    bmr: string | null;
    skeletalMuscle: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface ListMembersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  assignedCoachUserId?: string;
  centerId?: string;
}

export interface CreateMemberRequest {
  centerId?: string;
  fullName: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  heightCm: number;
  goal: string;
  assignedCoachUserId: string;
  status?: string;
}

export type UpdateMemberRequest = Partial<CreateMemberRequest>;

@Injectable({ providedIn: 'root' })
export class MembersService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig
  ) {}

  listMembers(query: ListMembersQuery = {}): Observable<PaginatedResponse<MemberResponse>> {
    return this.http.get<PaginatedResponse<MemberResponse>>(`${this.apiConfig.baseUrl}/members`, {
      params: toHttpParams(query as Record<string, string | number | boolean | null | undefined>)
    });
  }

  getMember(memberId: string): Observable<MemberResponse> {
    return this.http.get<MemberResponse>(`${this.apiConfig.baseUrl}/members/${memberId}`);
  }

  createMember(payload: CreateMemberRequest): Observable<MemberResponse> {
    return this.http.post<MemberResponse>(`${this.apiConfig.baseUrl}/members`, payload);
  }

  updateMember(memberId: string, payload: UpdateMemberRequest): Observable<MemberResponse> {
    return this.http.patch<MemberResponse>(`${this.apiConfig.baseUrl}/members/${memberId}`, payload);
  }
}
