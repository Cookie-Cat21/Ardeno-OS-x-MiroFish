import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/AppLayout";
import { MotionConfig } from "framer-motion";
import Index from "./pages/Index";
import AgentChat from "./pages/AgentChat";
import Orchestrator from "./pages/Orchestrator";
import SettingsPage from "./pages/SettingsPage";
import ParallelSociety from "./components/ParallelSociety";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  // Login bypassed based on user request ("let's not use a login for now")
  return <>{children}</>;
}

const App = () => (
  <ErrorBoundary>
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/*" element={
                  <AuthGate>
                    <Routes>
                      <Route element={<AppLayout />}>
                        <Route path="/" element={<Index />} />
                        <Route path="/chat" element={<AgentChat />} />
                        <Route path="/orchestrate" element={<Orchestrator />} />
                        <Route path="/mirofish" element={<ParallelSociety />} />
                        <Route path="/settings" element={<SettingsPage />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AuthGate>
                } />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </MotionConfig>
  </ErrorBoundary>
);

export default App;
