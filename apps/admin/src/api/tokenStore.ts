const ACCESS_KEY = "amon.admin.accessToken";
const REFRESH_KEY = "amon.admin.refreshToken";

// Vite web app — localStorage is the equivalent of the mobile app's SecureStore.
export const tokenStore = {
  save(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  getAccessToken() {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
