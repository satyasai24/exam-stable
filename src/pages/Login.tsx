
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

const Login: React.FC = () => {
  const { authState } = useAuth();
  const [showAdmin, setShowAdmin] = useState<boolean>(false);

  // If already authenticated, redirect to the appropriate dashboard
  if (authState.isAuthenticated) {
    switch (authState.user?.role) {
      case 'admin':
        return <Navigate to="/admin" />;
      case 'teacher':
        return <Navigate to="/teacher" />;
      case 'student':
        return <Navigate to="/student" />;
      default:
        // Should never reach here
        return <Navigate to="/" />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 px-4">
      <div className="absolute top-4 right-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowAdmin(!showAdmin)}
          className="flex items-center gap-2"
        >
          <Shield size={16} />
          {showAdmin ? 'Back to User Login' : 'Admin Access'}
        </Button>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        {showAdmin ? (
          <LoginForm defaultRole="admin" allowedRoles={['admin']} />
        ) : (
          <LoginForm allowedRoles={['teacher', 'student']} />
        )}
      </div>
    </div>
  );
};

export default Login;
