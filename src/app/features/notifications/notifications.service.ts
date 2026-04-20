import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../core/config/api.config';
import { toHttpParams } from '../../core/http/query-params.util';

export interface NotificationResponse {
  id: string;
  userId: string;
  centerId: string | null;
  type: string;
  title: string;
  message: string;
  referenceEntityType: string | null;
  referenceEntityId: string | null;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface ListNotificationsResponse {
  items: NotificationResponse[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig
  ) {}

  listNotifications(query: { page?: number; limit?: number; unreadOnly?: boolean } = {}):
    Observable<ListNotificationsResponse> {
    return this.http.get<ListNotificationsResponse>(`${this.apiConfig.baseUrl}/notifications`, {
      params: toHttpParams(query)
    });
  }

  markAsRead(notificationId: string): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(
      `${this.apiConfig.baseUrl}/notifications/${notificationId}/read`,
      {}
    );
  }
}
