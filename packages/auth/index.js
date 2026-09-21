import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'veloxpay_auth_token';
const USER_KEY = 'veloxpay_user';
const REFRESH_KEY = 'veloxpay_refresh_token';

export const saveAuthData = async (token, user, refreshToken) => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (user) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    }
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    }
    return true;
  } catch (error) {
    console.error('Failed to save auth data:', error);
    return false;
  }
};

export const getRefreshToken = async () => {
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
};

// Replace only the tokens, leaving the stored user alone. Used after a
// successful refresh, which returns no user record.
export const saveTokens = async (token, refreshToken) => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    }
    return true;
  } catch (error) {
    console.error('Failed to save tokens:', error);
    return false;
  }
};

export const getToken = async () => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get token:', error);
    return null;
  }
};

export const getUser = async () => {
  try {
    const userStr = await SecureStore.getItemAsync(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
};

export const logout = async () => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const isLoggedIn = async () => {
  const token = await getToken();
  return !!token;
};