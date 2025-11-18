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
import EventEdit from "./pages/EventEdit";
import EventRegistrations from "./pages/EventRegistrations";
import ClubDashboard from "./pages/ClubDashboard";
import ClubSetup from "./pages/ClubSetup";
import ClubVenues from "./pages/ClubVenues";
import PublicVenues from "./pages/PublicVenues";
import VenueDetail from "./pages/VenueDetail";
import VenueNew from "./pages/VenueNew";
import VenueEdit from "./pages/VenueEdit";
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
              path="/club/events/new"
              element={
                <ProtectedRoute allowedRoles={['club']}>
                  <EventNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/club/events/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['club']}>
                  <EventEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/club/events/:id/registrations"
              element={
                <ProtectedRoute allowedRoles={['club']}>
                  <EventRegistrations />
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
              path="/club/setup"
              element={
                <ProtectedRoute allowedRoles={['club']}>
                  <ClubSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/venues"
              element={
                <ProtectedRoute>
                  <PublicVenues />
                </ProtectedRoute>
              }
            />
            <Route
              path="/venues/:id"
              element={
                <ProtectedRoute>
                  <VenueDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/venues/new"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <VenueNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/venues/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <VenueEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/club/venues"
              element={
                <ProtectedRoute allowedRoles={['club']}>
                  <ClubVenues />
                </ProtectedRoute>
              }
            />
            <Route
              path="/club/venues/:id"
              element={
                <ProtectedRoute allowedRoles={['club']}>
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
