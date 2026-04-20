export type UserRole = 'SUPER_ADMIN' | 'CENTER_ADMIN' | 'COACH';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  centerId: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
