import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../core/config/api.config';
import { PaginatedResponse } from '../../core/models/api.models';
import { toHttpParams } from '../../core/http/query-params.util';

export interface FeedPostResponse {
  id: string;
  centerId: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  center: { id: string; name: string; code: string };
  authorType: 'STAFF' | 'MEMBER';
  authorUser: { id: string; fullName: string; email: string; role: string } | null;
  authorMember: { id: string; memberCode: string; fullName: string } | null;
  moderatedByUser: { id: string; fullName: string; email: string } | null;
}

@Injectable({ providedIn: 'root' })
export class FeedService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig
  ) {}

  getModerationQueue(): Observable<FeedPostResponse[]> {
    return this.http.get<FeedPostResponse[]>(`${this.apiConfig.baseUrl}/feed/moderation-queue`);
  }

  listFeedPosts(query: { page?: number; limit?: number; centerId?: string; status?: string } = {}):
    Observable<PaginatedResponse<FeedPostResponse>> {
    return this.http.get<PaginatedResponse<FeedPostResponse>>(`${this.apiConfig.baseUrl}/feed/posts`, {
      params: toHttpParams(query)
    });
  }

  approvePost(postId: string): Observable<FeedPostResponse> {
    return this.http.patch<FeedPostResponse>(`${this.apiConfig.baseUrl}/feed/posts/${postId}/approve`, {});
  }

  rejectPost(postId: string): Observable<FeedPostResponse> {
    return this.http.patch<FeedPostResponse>(`${this.apiConfig.baseUrl}/feed/posts/${postId}/reject`, {});
  }
}
