import { useContext } from 'react';
import { AuthContext } from './AuthContext';

/**
 * useAuth - Custom hook to access authentication context
 * 
 * Usage:
 * const { 
 *   user, 
 *   token, 
 *   isAuthenticated, 
 *   login, 
 *   logout, 
 *   updateUser 
 * } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure your component is wrapped with <AuthProvider>.'
    );
  }

  return context;
}