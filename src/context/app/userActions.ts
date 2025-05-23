
import { User, AppState } from '../../types';
import { hashPassword } from '../../utils/auth';
import { supabase } from '@/integrations/supabase/client';

export const createUser = (
  appState: AppState, 
  setAppState: React.Dispatch<React.SetStateAction<AppState>>
) => async (userData: Omit<User, 'id'>) => {
  try {
    // Hash the password if provided
    const hashedPassword = userData.password ? hashPassword(userData.password) : undefined;

    // Insert user in Supabase
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        password: hashedPassword
      })
      .select('id, name, email, phone, role')
      .single();

    if (error || !newUser) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }

    // Format user for app state
    const formattedUser: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone || '',
      role: newUser.role as "admin" | "teacher" | "student"
    };

    // Update app state
    const updatedState = {
      ...appState,
      users: [...appState.users, formattedUser]
    };

    setAppState(updatedState);
    console.log('Created new user in Supabase:', formattedUser);

    return formattedUser;
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
};

export const getUsersByRole = (appState: AppState) => async (role: string) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role')
      .eq('role', role);

    if (error) {
      console.error('Error fetching users by role:', error);
      return [];
    }

    return users as User[];
  } catch (error) {
    console.error('Error in getUsersByRole:', error);
    return [];
  }
};
