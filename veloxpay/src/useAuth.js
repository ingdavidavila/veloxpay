import { useContext } from 'react';
import { AuthContext } from './AuthContext';

/**
 * useAuth - Custom hook to access auth context
 * Usage: const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
}