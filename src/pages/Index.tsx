
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { initializeLocalStorage } from '@/utils/localStorage';

const Index: React.FC = () => {
  const navigate = useNavigate();
  
  // Initialize local storage
  useEffect(() => {
    initializeLocalStorage();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <header className="w-full py-4 px-4 md:px-8">
        <div className="flex items-center">
          <div className="flex items-center">
            <svg viewBox="0 0 50 50" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="5" width="40" height="40" rx="8" fill="#2563EB" />
              <path d="M15 15H35V35C35 37.7614 32.7614 40 30 40H20C17.2386 40 15 37.7614 15 35V15Z" fill="#FFFFFF" />
              <path d="M20 25H30" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
              <path d="M20 31H30" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
              <path d="M20 19H30" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className="ml-2 text-2xl font-bold text-gray-900">SecureExam</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold text-primary mb-6">Secure Exam Platform</h1>
        
        <p className="text-xl text-gray-600 mb-8">
          A comprehensive solution for creating, managing, and taking secure online examinations.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/login')} 
            size="lg" 
            className="px-8"
          >
            Sign In
          </Button>
          
          <div className="text-sm text-gray-500">
            Access for administrators, teachers, and students
          </div>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg mb-2">For Administrators</h3>
            <p className="text-gray-600">Manage user accounts and system settings</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg mb-2">For Teachers</h3>
            <p className="text-gray-600">Create exams, add questions, and view student results</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg mb-2">For Students</h3>
            <p className="text-gray-600">Take exams securely with fullscreen monitoring</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
