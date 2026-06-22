import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

const getCookie = (name: string) => {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.substring(name.length + 1));
};

api.interceptors.request.use((config) => {
  const token = getCookie("XSRF-TOKEN");
  if (token) {
    config.headers["X-XSRF-TOKEN"] = token;
  }

  return config;
});

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     const requestUrl = (error.config?.url || "").toString();
//     const isAuthMe = requestUrl.includes("auth/me");
//     const isLoginPage =
//       typeof window !== "undefined" && window.location.pathname === "/login";

//     if (error.response?.status === 401 && !isAuthMe && !isLoginPage) {
//       useAuthStore.getState().logout();
//       window.location.href = "/login";
//     }
//     return Promise.reject(error);
//   },
// );
