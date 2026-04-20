import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../core/config/api.config';
import { PaginatedResponse } from '../../core/models/api.models';
import { toHttpParams } from '../../core/http/query-params.util';

export interface EvaluationResponse {
  id: string;
  memberId: string;
  recordedAt: string;
  weight: string;
  visceralFatPercent: string | null;
  trunkSubcutaneousFat: string | null;
  bodyFat: string | null;
  bodyAge: number | null;
  bmi: string;
  bmr: string | null;
  skeletalMuscle: string | null;
  createdAt: string;
  updatedAt: string;
  member: {
    id: string;
    memberCode: string;
    fullName: string;
    centerId: string;
    heightCm: string;
    center: { id: string; name: string; code: string };
    assignedCoach: { id: string; fullName: string; email: string; phone: string | null } | null;
  };
}

export interface ListEvaluationsQuery {
  page?: number;
  limit?: number;
  centerId?: string;
  memberId?: string;
  assignedCoachUserId?: string;
}

export interface EvaluationPayload {
  weight: number;
  visceralFatPercent?: number | null;
  trunkSubcutaneousFat?: number | null;
  bodyFat?: number | null;
  bodyAge?: number | null;
  bmr?: number | null;
  skeletalMuscle?: number | null;
}

@Injectable({ providedIn: 'root' })
export class EvaluationsService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig
  ) {}

  listEvaluations(query: ListEvaluationsQuery = {}): Observable<PaginatedResponse<EvaluationResponse>> {
    return this.http.get<PaginatedResponse<EvaluationResponse>>(`${this.apiConfig.baseUrl}/evaluations`, {
      params: toHttpParams(query as Record<string, string | number | boolean | null | undefined>)
    });
  }

  getEvaluation(evaluationId: string): Observable<EvaluationResponse> {
    return this.http.get<EvaluationResponse>(`${this.apiConfig.baseUrl}/evaluations/${evaluationId}`);
  }

  listMemberEvaluations(memberId: string): Observable<EvaluationResponse[]> {
    return this.http.get<EvaluationResponse[]>(`${this.apiConfig.baseUrl}/members/${memberId}/evaluations`);
  }

  createEvaluation(memberId: string, payload: EvaluationPayload): Observable<EvaluationResponse> {
    return this.http.post<EvaluationResponse>(
      `${this.apiConfig.baseUrl}/members/${memberId}/evaluations`,
      payload
    );
  }

  updateEvaluation(evaluationId: string, payload: Partial<EvaluationPayload>): Observable<EvaluationResponse> {
    return this.http.patch<EvaluationResponse>(
      `${this.apiConfig.baseUrl}/evaluations/${evaluationId}`,
      payload
    );
  }
}
