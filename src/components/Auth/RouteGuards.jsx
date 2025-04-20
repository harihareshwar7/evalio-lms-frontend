import { useAuth } from "./FirebaseAuthContext";
import { Navigate, Outlet } from "react-router-dom";

// Route guard for authenticated users only
export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    // Show loading indicator while Firebase loads
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to sign-in if not authenticated
    return <Navigate to="/sign-in" replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
}

// Route guard for non-authenticated users only
export function PublicRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    // Show loading indicator while Firebase loads
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (user) {
    // Redirect to dashboard if already authenticated
    return <Navigate to="/dashboard" replace />;
  }

  // Render child routes if not authenticated
  return <Outlet />;
}
