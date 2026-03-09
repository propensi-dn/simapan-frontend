import Cookies from "js-cookie";
import api from "@/lib/axios";

export const saveAuth = (access: string, refresh: string, role: string, email: string, rememberMe = false) => {
  const expires = rememberMe ? 7 : 1;
  Cookies.set("access_token", access, { expires });
  Cookies.set("refresh_token", refresh, { expires: 7 });
  Cookies.set("user_role", role, { expires });
  Cookies.set("user_email", email, { expires });
};

export const clearAuth = () => {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  Cookies.remove("user_role");
  Cookies.remove("user_email");
};

export const logout = async () => {
  const refreshToken = Cookies.get("refresh_token");
  try {
    if (refreshToken) {
      await api.post("/auth/logout/", { refresh: refreshToken });
    }
  } catch {
  } finally {
    clearAuth();
  }
};

export const isAuthenticated = () => Boolean(Cookies.get("access_token"));
