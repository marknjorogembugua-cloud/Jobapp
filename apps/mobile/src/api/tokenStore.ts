import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "amon.accessToken";
const REFRESH_KEY = "amon.refreshToken";

export const tokenStore = {
  async save(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  },
  getAccessToken() {
    return SecureStore.getItemAsync(ACCESS_KEY);
  },
  getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};
