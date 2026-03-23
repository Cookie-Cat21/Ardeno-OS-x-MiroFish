import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/AppLayout";
import { MotionConfig } from "framer-motion";
import { AppLoader } from "@/components/loaders/AppLoader";
import Login from "./pages/Login";
import Index from "./pages/Index";
import AgentChat from "./pages/AgentChat";
import Orchestrator from "./pages/Orchestrator";
import Projects from "./pages/Projects";
import Gmail from "./pages/Gmail";
import Tasks from "./pages/Tasks";
import LeadEngine from "./pages/LeadEngine";
import WebsiteAnalyzer from "./pages/WebsiteAnalyzer";
import Analytics from "./pages/Analytics";
import Pipeline from "./pages/Pipeline";
import Assets from "./pages/Assets";
import SettingsPage from "./pages/SettingsPage";
import Intelligence from "./pages/Intelligence";
import Proposals from "./pages/Proposals";
import Outreach from "./pages/Outreach";
import Invoices from "./pages/Invoices";
import ClientIntake from "./pages/ClientIntake";
import ProjectStatus from "./pages/ProjectStatus";
import Nurturing from "./pages/Nurturing";
import Skills from "./pages/Skills";
import WebsiteBuilder from "./pages/WebsiteBuilder";
import AgentManager from "./pages/AgentManager";
import TelegramPage from "./pages/TelegramPage";
import SecurityOverviewPage from "./pages/SecurityOverview";
import ActivityLogPage from "./pages/ActivityLog";
import NotFound from "./pages/NotFound";
import LoaderPreview from "./pages/LoaderPreview";
import PredictionEngine from "./pages/PredictionEngine";

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, isLocalDevBypass } = useAuth();
  // Track whether the intro animation has finished playing
  const [animDone, setAnimDone] = useState(false);

  // Show the branded loader until BOTH auth has resolved AND the animation
  // has completed — whichever takes longer wins, giving auth time to warm up
  // while the client intro plays out.
  if (loading || !animDone) {
    return <AppLoader onComplete={() => setAnimDone(true)} />;
  }

  if (isLocalDevBypass) return <>{children}</>;
  if (!user) return <Login />;
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
                <Route path="/intake" element={<ClientIntake />} />
                <Route path="/status" element={<ProjectStatus />} />
                <Route path="/loader-preview" element={<LoaderPreview />} />
                <Route path="/*" element={
                  <AuthGate>
                    <Routes>
                      <Route element={<AppLayout />}>
                        <Route path="/" element={<Index />} />
                        <Route path="/intelligence" element={<Intelligence />} />
                        <Route path="/chat" element={<AgentChat />} />
                        <Route path="/orchestrate" element={<Orchestrator />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/leads" element={<LeadEngine />} />
                        <Route path="/proposals" element={<Proposals />} />
                        <Route path="/nurturing" element={<Nurturing />} />
                        <Route path="/outreach" element={<Outreach />} />
                        <Route path="/invoices" element={<Invoices />} />
                        <Route path="/analyzer" element={<WebsiteAnalyzer />} />
                        <Route path="/gmail" element={<Gmail />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/pipeline" element={<Pipeline />} />
                        <Route path="/assets" element={<Assets />} />
                        <Route path="/skills" element={<Skills />} />
                        <Route path="/website-builder" element={<WebsiteBuilder />} />
                        <Route path="/agents" element={<AgentManager />} />
                        <Route path="/telegram" element={<TelegramPage />} />
                        <Route path="/security" element={<SecurityOverviewPage />} />
                        <Route path="/activity" element={<ActivityLogPage />} />
                        <Route path="/prediction" element={<PredictionEngine />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        {/* Redirect aliases for legacy / bookmarked URLs */}
                        <Route path="/orchestrator" element={<Navigate to="/orchestrate" replace />} />
                        <Route path="/agent-manager" element={<Navigate to="/agents" replace />} />
                        <Route path="/website_builder" element={<Navigate to="/website-builder" replace />} />
                        <Route path="/lead-engine" element={<Navigate to="/leads" replace />} />
                        <Route path="/website-analyzer" element={<Navigate to="/analyzer" replace />} />
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
