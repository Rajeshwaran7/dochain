// Shared auth types and helpers for Dochain apps

export interface JwtPayload {
  sub:   string;
  email: string;
  role:  UserRole;
  iat?:  number;
  exp?:  number;
}

export enum UserRole {
  ADMIN   = 'admin',
  DOCTOR  = 'doctor',
  PATIENT = 'patient',
}

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
}

export interface AuthUser {
  id:              string;
  email:           string;
  firstName:       string;
  lastName:        string;
  role:            UserRole;
  avatar?:         string;
  isEmailVerified: boolean;
}

// Parse JWT payload without verifying (client-side use only)
export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const base64 = token.split('.')[1];
    const decoded = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export function hasRole(user: AuthUser | null, role: UserRole): boolean {
  return user?.role === role;
}

export function isDoctor(user: AuthUser | null): boolean {
  return hasRole(user, UserRole.DOCTOR);
}

export function isPatient(user: AuthUser | null): boolean {
  return hasRole(user, UserRole.PATIENT);
}

export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, UserRole.ADMIN);
}
