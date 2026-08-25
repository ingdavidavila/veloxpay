import { Platform } from 'react-native';

const LOCAL_API_HOST = Platform.select({
    android: '10.0.2.2',
    ios: 'localhost',
    default: 'localhost',
});

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || `http://${LOCAL_API_HOST}:5000`;

export const apiUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
