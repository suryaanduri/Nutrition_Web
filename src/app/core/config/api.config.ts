import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  baseUrl: string;
}

const globalConfig = (globalThis as { __NCM_API_BASE_URL__?: string }).__NCM_API_BASE_URL__;
const devDefaultBaseUrl = 'https://ncmbackend-1065621125925.asia-south1.run.app/api';

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    baseUrl: globalConfig?.trim() || devDefaultBaseUrl
  })
});
