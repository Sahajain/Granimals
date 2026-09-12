import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  // While checking the saved token → show loading spinner
  if (isLoading) {
    return (
      <div className="spinner-center" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  // Not logged in → redirect to login page
  // `replace` means the /login page replaces current history entry
  // so pressing "back" doesn't loop you back to the protected page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in → render the actual page
  return children;
}
