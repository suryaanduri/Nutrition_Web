import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  baseUrl: string;
}

const globalConfig = (globalThis as { __NCM_API_BASE_URL__?: string }).__NCM_API_BASE_URL__;

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    baseUrl: globalConfig?.trim() || '/api'
  })
});
