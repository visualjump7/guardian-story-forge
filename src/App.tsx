import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminRoute } from "@/components/AdminRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import StoryView from "./pages/StoryView";
import FlipbookStoryView from "./pages/FlipbookStoryView";
import Library from "./pages/Library";
import Profile from "./pages/Profile";
import Test from "./pages/Test";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminStories from "./pages/admin/Stories";
import AdminStoryEditor from "./pages/admin/StoryEditor";
import AdminSettings from "./pages/admin/Settings";
import AdminLLMSettings from "./pages/admin/LLMSettings";
import { CreateLayout } from "./pages/create/CreateLayout";
import CreateStep1 from "./pages/create/CreateStep1";
import { CreateStep2 } from "./pages/create/CreateStep2";
import { CreateStep3 } from "./pages/create/CreateStep3";
import { CreateStep4 } from "./pages/create/CreateStep4";
import { CreateStep5 } from "./pages/create/CreateStep5";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/home" element={<Home />} />
          <Route path="/create/*" element={<CreateLayout />}>
            <Route path="01" element={<CreateStep1 />} />
            <Route path="02" element={<CreateStep2 />} />
              <Route path="03" element={<CreateStep3 />} />
              <Route path="04" element={<CreateStep4 />} />
              <Route path="05" element={<CreateStep5 />} />
          </Route>
            <Route path="/story/:storyId" element={<StoryView />} />
            <Route path="/story/:storyId/flipbook" element={<FlipbookStoryView />} />
            <Route path="/library" element={<Library />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/test" element={<Test />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/stories" element={<AdminRoute><AdminStories /></AdminRoute>} />
          <Route path="/admin/stories/new" element={<AdminRoute><AdminStoryEditor /></AdminRoute>} />
          <Route path="/admin/stories/:id/edit" element={<AdminRoute><AdminStoryEditor /></AdminRoute>} />
          <Route path="/admin/llm-settings" element={<AdminRoute><AdminLLMSettings /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
