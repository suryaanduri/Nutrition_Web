import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../core/config/api.config';
import { PaginatedResponse } from '../../core/models/api.models';
import { toHttpParams } from '../../core/http/query-params.util';

export interface ChatConversationResponse {
  id: string;
  centerId: string;
  type: 'DIRECT';
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  member: {
    id: string;
    memberCode: string;
    fullName: string;
    status: string;
  };
  latestMessage: {
    id: string;
    senderType: 'USER' | 'MEMBER';
    content: string;
    createdAt: string;
  } | null;
}

export interface ChatMessageResponse {
  id: string;
  conversationId: string;
  senderType: 'USER' | 'MEMBER';
  senderUser: { id: string; fullName: string; email: string } | null;
  senderMember: { id: string; memberCode: string; fullName: string } | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig
  ) {}

  listConversations(query: { page?: number; limit?: number; memberId?: string; search?: string } = {}):
    Observable<PaginatedResponse<ChatConversationResponse>> {
    return this.http.get<PaginatedResponse<ChatConversationResponse>>(
      `${this.apiConfig.baseUrl}/chat/conversations`,
      { params: toHttpParams(query) }
    );
  }

  getConversationMessages(
    conversationId: string,
    query: { page?: number; limit?: number } = {}
  ): Observable<PaginatedResponse<ChatMessageResponse>> {
    return this.http.get<PaginatedResponse<ChatMessageResponse>>(
      `${this.apiConfig.baseUrl}/chat/conversations/${conversationId}/messages`,
      { params: toHttpParams(query) }
    );
  }

  sendMessage(conversationId: string, content: string): Observable<ChatMessageResponse> {
    return this.http.post<ChatMessageResponse>(
      `${this.apiConfig.baseUrl}/chat/conversations/${conversationId}/messages`,
      { content }
    );
  }

  getUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.apiConfig.baseUrl}/chat/unread-count`);
  }
}
