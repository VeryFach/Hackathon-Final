import { api } from "@/lib/axios";
import { clearAuthSession, storeAuthSession } from "@/lib/auth-storage";

// ==================== TYPES ====================

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: "stakeholder" | "masyarakat" | "pengepul";
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName?: string;
  role?: "masyarakat" | "pengepul";
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
}

// ==================== API FUNCTIONS ====================

export const authService = {
  register: async (data: RegisterDto): Promise<AuthResponse> => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", data);
    storeAuthSession(response.data.access_token, response.data.user);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAuthSession();
    }
  },

  getMe: async (): Promise<User> => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  updateProfile: async (data: UpdateUserDto): Promise<User> => {
    const response = await api.patch("/users", data);
    return response.data;
  },
};
