
import { User, UserRole, AuthState } from '../types';
import { getAuthFromLocalStorage, setAuthInLocalStorage } from './localStorage';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { supabase } from '@/integrations/supabase/client';

// Helper to hash passwords
export const hashPassword = (password: string): string => {
  try {
    return bcrypt.hashSync(password, 10);
  } catch (error) {
    console.error('Error hashing password:', error);
    return '';
  }
};

// Helper to validate passwords
export const validatePassword = (password: string, hashedPassword: string): boolean => {
  try {
    return bcrypt.compareSync(password, hashedPassword);
  } catch (error) {
    console.error('Error validating password:', error);
    return false;
  }
};

// Login function
export const login = async (email: string, password: string): Promise<{ success: boolean; role?: UserRole; message?: string }> => {
  // Special case for the admin user
  if (email === 'admin' && password === '162024') {
    try {
      const { data: adminUser, error } = await supabase
        .from('users')
        .select('id, name, email, phone, role')
        .eq('role', 'admin')
        .single();

      if (error || !adminUser) {
        console.error('Admin login error:', error);
        return { success: false, message: 'Admin user not found' };
      }

      const token = uuidv4();
      const userWithTypedRole: User = {
        ...adminUser, 
        role: adminUser.role as UserRole,
        password: undefined
      };
      
      setAuthInLocalStorage({
        isAuthenticated: true,
        user: userWithTypedRole,
        token
      });
      
      return { success: true, role: 'admin' };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, message: 'Error during admin login' };
    }
  }
  
  // Regular user login
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, password')
      .eq('email', email)
      .single();

    if (error || !user) {
      console.error('Login error:', error);
      return { success: false, message: 'User not found' };
    }

    if (!user.password) {
      return { success: false, message: 'Invalid credentials' };
    }

    const isValidPassword = validatePassword(password, user.password);

    if (!isValidPassword) {
      return { success: false, message: 'Invalid credentials' };
    }

    const token = uuidv4();
    const userWithTypedRole: User = {
      ...user,
      role: user.role as UserRole,
      password: undefined
    };
    
    setAuthInLocalStorage({
      isAuthenticated: true,
      user: userWithTypedRole,
      token
    });

    return { success: true, role: user.role as UserRole };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Error during login' };
  }
};

// Logout function
export const logout = (): void => {
  setAuthInLocalStorage({
    isAuthenticated: false,
    user: null,
    token: null
  });
};

// Check authentication
export const checkAuth = (): AuthState => {
  return getAuthFromLocalStorage();
};

// Get current user
export const getCurrentUser = (): User | null => {
  const authState = getAuthFromLocalStorage();
  return authState.user;
};
