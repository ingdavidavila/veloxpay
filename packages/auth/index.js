import * as SecureStore from 'expo-secure-store';   // Mobile only
// For web we'll use localStorage later

const TOKEN_KEY = 'veloxpay_auth_token';

export const saveToken = async (token) => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('Failed to save token', error);
    return false;
  }
};

export const getToken = async () => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get token', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to remove token', error);
  }
};

export const login = async (email, password) => {
  const response = await fetch('http://10.0.2.2:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (response.ok && data.token) {
    await saveToken(data.token);
    return { success: true, user: data.user || data };
  } else {
    throw new Error(data.message || 'Login failed');
  }
};

export { saveToken, getToken, removeToken };