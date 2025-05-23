
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

interface LoginFormProps {
  defaultRole?: UserRole;
  allowedRoles?: UserRole[];
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  defaultRole = 'teacher',
  allowedRoles = ['teacher', 'student']
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  
  const [activeTab, setActiveTab] = useState<string>(defaultRole);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Ensure we're logging in with the correct role
      if (activeTab !== 'admin' && email === 'admin') {
        toast({
          title: "Invalid credentials",
          description: "Please use the admin access button for admin login",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const result = await login(email, password);
      
      // Verify the user has the correct role
      if (result.success) {
        if (result.role !== activeTab) {
          toast({
            title: "Access denied",
            description: `You cannot log in as a ${activeTab} with ${result.role} credentials.`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${email}!`,
        });
        
        // Redirect based on role
        switch (result.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'teacher':
            navigate('/teacher');
            break;
          case 'student':
            navigate('/student');
            break;
          default:
            navigate('/');
        }
      } else {
        toast({
          title: "Login failed",
          description: result.message || "Please check your credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter tabs based on allowed roles
  const filteredRoles = allowedRoles.filter(role => ['admin', 'teacher', 'student'].includes(role));

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Secure Exam Platform</CardTitle>
        <CardDescription className="text-center">Sign in to access your account</CardDescription>
      </CardHeader>
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${filteredRoles.length}, 1fr)` }}>
          {filteredRoles.includes('teacher') && <TabsTrigger value="teacher">Teacher</TabsTrigger>}
          {filteredRoles.includes('student') && <TabsTrigger value="student">Student</TabsTrigger>}
          {filteredRoles.includes('admin') && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>
        
        {filteredRoles.map(role => (
          <TabsContent key={role} value={role}>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`${role}-email`}>{role === 'admin' ? 'Username' : 'Email'}</Label>
                  <Input 
                    id={`${role}-email`} 
                    type={role === 'admin' ? 'text' : 'email'} 
                    placeholder={role === 'admin' ? 'Enter admin username' : `${role}@example.com`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${role}-password`}>Password</Label>
                  <Input 
                    id={`${role}-password`} 
                    type="password" 
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
};

export default LoginForm;
