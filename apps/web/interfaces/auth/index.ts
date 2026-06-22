export interface LoginPayload {
  email: string;
  password: string;
  fullName?: boolean;
}

export interface AuthUser {
  id: number | string;
  fullName: string;
  email: string;
  role: string;
}