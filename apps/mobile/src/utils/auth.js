// apps/mobile/src/utils/auth.js

import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'veloxpay_auth_token';
const API_BASE_URL = 'http://10.0.2.2:5000';   // ← Your current IP from Expo

export const saveToken = async (token) => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    console.log('Token saved successfully');
  } catch (error) {
    console.error('Failed to save token', error);
  }
};

export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok && data.token) {
      await saveToken(data.token);
      return { success: true, user: data.user || data };
    } else {
      throw new Error(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};