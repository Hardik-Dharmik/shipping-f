import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Signup from './components/Signup';
import RateCalculator from './components/RateCalculator';
import Orders from './components/Orders';
import PendingApprovals from './components/PendingApprovals';
import Users from './components/Users';
import './App.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route Component (redirect based on user role if already authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    if (isAdmin) {
      return <Navigate to="/admin/signups/pending" replace />;
    }
    return <Navigate to="/calculate-rate" replace />;
  }

  return children;
}

// Admin Route Component (only accessible by admin users)
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/calculate-rate" replace />;
  }

  return children;
}

// User Route Component (only accessible by non-admin users)
function UserRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin/signups/pending" replace />;
  }

  return children;
}

// Default Route Component (redirects based on user role)
function DefaultRoute() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return <Navigate to={isAdmin ? "/admin/signups/pending" : "/calculate-rate"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        } 
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <SidebarProvider>
              <div className="app">
                <Sidebar />
                <Routes>
                  <Route path="/" element={<DefaultRoute />} />
                  <Route 
                    path="/calculate-rate" 
                    element={
                      <UserRoute>
                        <RateCalculator />
                      </UserRoute>
                    } 
                  />
                  <Route 
                    path="/orders" 
                    element={
                      <UserRoute>
                        <Orders />
                      </UserRoute>
                    } 
                  />
                  <Route 
                    path="/admin/signups/pending" 
                    element={
                      <AdminRoute>
                        <PendingApprovals />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/users" 
                    element={
                      <AdminRoute>
                        <Users />
                      </AdminRoute>
                    } 
                  />
                </Routes>
              </div>
            </SidebarProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
