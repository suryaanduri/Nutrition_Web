import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { forkJoin } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../core/config/api.config';

export interface DashboardSummaryResponse {
  totalCenters: number | null;
  totalMembers: number;
  activeMembers: number;
  recentEvaluationsCount: number;
  membersNeedingAttentionCount: number;
}

export interface DashboardRecentMemberResponse {
  id: string;
  centerId: string;
  memberCode: string;
  fullName: string;
  phone: string;
  email: string;
  status: string;
  createdAt: string;
  center: { id: string; name: string; code: string };
}

export interface DashboardRecentEvaluationResponse {
  id: string;
  memberId: string;
  memberCode: string;
  memberName: string;
  centerId: string;
  centerName: string;
  weight: string;
  bmi: string;
  recordedAt: string;
}

export interface DashboardAttentionMemberResponse {
  id: string;
  centerId: string;
  memberCode: string;
  fullName: string;
  reason: 'NO_EVALUATION_YET' | 'EVALUATION_OVERDUE';
  lastEvaluationAt: string | null;
  createdAt: string;
  center: { id: string; name: string; code: string };
}

export interface DashboardActivityResponse {
  type: 'MEMBER_CREATED' | 'EVALUATION_CREATED';
  entityId: string;
  centerId: string;
  centerName: string;
  message: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig
  ) {}

  loadDashboard() {
    const base = `${this.apiConfig.baseUrl}/dashboard`;
    return forkJoin({
      summary: this.http.get<DashboardSummaryResponse>(`${base}/summary`),
      recentMembers: this.http.get<DashboardRecentMemberResponse[]>(`${base}/recent-members`),
      recentEvaluations: this.http.get<DashboardRecentEvaluationResponse[]>(`${base}/recent-evaluations`),
      membersNeedingAttention: this.http.get<DashboardAttentionMemberResponse[]>(
        `${base}/members-needing-attention`
      ),
      activity: this.http.get<DashboardActivityResponse[]>(`${base}/activity`)
    });
  }
}
