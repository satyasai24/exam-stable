import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/app/AppContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLayout from "./components/layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";

// Teacher pages
import TeacherLayout from "./components/layouts/TeacherLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateExam from "./pages/teacher/CreateExam";
import ViewQuestions from "./pages/teacher/ViewQuestions";
import ViewSubmissions from "./pages/teacher/ViewSubmissions";
import ViewSubmissionDetail from "./pages/teacher/ViewSubmissionDetail";

// Student pages
import StudentLayout from "./components/layouts/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import TakeExam from "./pages/student/TakeExam";
import ThankYou from "./pages/student/ThankYou";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <AuthProvider>
          <AppProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
              </Route>
              
              {/* Teacher Routes */}
              <Route path="/teacher" element={<TeacherLayout />}>
                <Route index element={<TeacherDashboard />} />
                <Route path="create-exam" element={<CreateExam />} />
                <Route path="exam/:examId/questions" element={<ViewQuestions />} />
                <Route path="exam/:examId/submissions" element={<ViewSubmissions />} />
                <Route path="exam/:examId/submission/:submissionId" element={<ViewSubmissionDetail />} />
              </Route>
              
              {/* Student Routes */}
              <Route path="/student" element={<StudentLayout />}>
                <Route index element={<StudentDashboard />} />
              </Route>
              <Route path="/student/exam/:examId" element={<TakeExam />} />
              <Route path="/student/thank-you" element={<ThankYou />} />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppProvider>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
