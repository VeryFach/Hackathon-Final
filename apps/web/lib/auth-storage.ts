import type { User } from "@/lib/api/auth";

export const ACCESS_TOKEN_KEY = "access_token";
export const USER_KEY = "user";

export function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function storeAuthSession(accessToken: string, user: User) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function storeCurrentUser(user: User) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function getRoleHome(role: User["role"]) {
  const roleHome: Record<User["role"], string> = {
    stakeholder: "/stakeholder",
    pengepul: "/pengepul",
    masyarakat: "/masyarakat",
  };

  return roleHome[role] ?? "/login";
}
