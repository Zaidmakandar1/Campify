import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AuthBypass } from '@/components/AuthBypass';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('student' | 'faculty' | 'club')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();
  const [showBypass, setShowBypass] = useState(false);
  const [bypassUser, setBypassUser] = useState<{ role: string } | null>(null);

  // Show bypass after 8 seconds of loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowBypass(true);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleBypass = (role: 'student' | 'faculty' | 'club') => {
    setBypassUser({ role });
    setShowBypass(false);
  };

  if (loading && !showBypass) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  if (showBypass && !user && !bypassUser) {
    return <AuthBypass onBypass={handleBypass} />;
  }

  // Use bypass user if available
  const currentUser = user || bypassUser;
  const currentRole = userRole || (bypassUser?.role as any);

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
    console.warn('[ProtectedRoute] Access denied:', {
      currentRole,
      allowedRoles,
      user: currentUser,
      userRole,
      bypassUser
    });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
