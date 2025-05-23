
import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

const StudentLayout: React.FC = () => {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // If not authenticated or not a student, redirect to login
  if (!authState.isAuthenticated || authState.user?.role !== 'student') {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determine if this is the TakeExam page by URL pattern
  const isTakingExam = location.pathname.includes('/student/exam/');

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {!isTakingExam && (
        <header className="bg-primary text-primary-foreground p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/student" className="text-xl font-bold hover:opacity-90">
              Secure Exam Student Portal
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
      )}
      
      <main className={isTakingExam ? "flex-1" : "container mx-auto py-8 px-4 flex-1"}>
        <Outlet />
      </main>
      
      {!isTakingExam && (
        <footer className="bg-gray-200 p-4 text-center text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Secure Exam Platform
        </footer>
      )}
    </div>
  );
};

export default StudentLayout;
