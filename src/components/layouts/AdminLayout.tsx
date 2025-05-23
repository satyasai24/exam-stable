
import React from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Shield } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  
  // If not authenticated or not an admin, redirect to login
  if (!authState.isAuthenticated || authState.user?.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/admin" className="text-xl font-bold hover:opacity-90 flex items-center gap-2">
            <Shield size={20} />
            <span>Secure Exam Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>{authState.user?.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut size={16} />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4 flex-1">
        <Outlet />
      </main>
      
      <footer className="bg-gray-200 p-4 text-center text-sm text-gray-600">
        &copy; {new Date().getFullYear()} Secure Exam Platform
      </footer>
    </div>
  );
};

export default AdminLayout;
