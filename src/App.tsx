import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Voice from "./pages/Voice";
import VoiceNew from "./pages/VoiceNew";
import VoiceDetail from "./pages/VoiceDetail";
import AdminVoice from "./pages/AdminVoice";
import Hub from "./pages/Hub";
import EventDetail from "./pages/EventDetail";
import EventNew from "./pages/EventNew";
import ClubDashboard from "./pages/ClubDashboard";
import ClubVenues from "./pages/ClubVenues";
import VenueDetail from "./pages/VenueDetail";
import Market from "./pages/Market";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/voice"
              element={
                <ProtectedRoute>
                  <Voice />
                </ProtectedRoute>
              }
            />
            <Route
              path="/voice/new"
              element={
                <ProtectedRoute>
                  <VoiceNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/voice/admin"
              element={
                <ProtectedRoute>
                  <AdminVoice />
                </ProtectedRoute>
              }
            />
            <Route
              path="/voice/:id"
              element={
                <ProtectedRoute>
                  <VoiceDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hub"
              element={
                <ProtectedRoute>
                  <Hub />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hub/event/new"
              element={
                <ProtectedRoute>
                  <EventNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hub/event/:id"
              element={
                <ProtectedRoute>
                  <EventDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/club/dashboard"
              element={
                <ProtectedRoute>
                  <ClubDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/club/venues"
              element={
                <ProtectedRoute>
                  <ClubVenues />
                </ProtectedRoute>
              }
            />
            <Route
              path="/club/venues/:id"
              element={
                <ProtectedRoute>
                  <VenueDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/market"
              element={
                <ProtectedRoute>
                  <Market />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
