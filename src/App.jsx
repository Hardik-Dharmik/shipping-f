import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import RateCalculator from './components/shipping/RateCalculator';
import Orders from './components/orders/Orders';
import CreateOrder from './components/orders/CreateOrder';
import OrderDetails from './components/orders/OrderDetails';
import Billing from './components/billing/Billing';
import PendingApprovals from './components/admin/PendingApprovals';
import Users from './components/admin/Users';
import UsersWithOrders from './components/admin/UsersWithOrders';
import UserOrders from './components/admin/UserOrders';
import './App.css';
import TicketDashboard from './components/tickets/TicketDashboard';
import Home from './components/home/Home';

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

  return <Navigate to={isAdmin ? "/admin/signups/pending" : "/home"} replace />;
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
                <div className="app-content">
                  <Header />
                  <main className="main-content">
                    <Routes>
                      <Route path="/" element={<DefaultRoute />} />
                      <Route
                        path="/home"
                        element={
                          <ProtectedRoute>
                            <Home />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/calculate-rate" 
                        element={
                          <UserRoute>
                            <RateCalculator />
                          </UserRoute>
                        } 
                      />
                      <Route 
                        path="/orders/create" 
                        element={
                          <UserRoute>
                            <CreateOrder />
                          </UserRoute>
                        } 
                      />
                      <Route 
                        path="/orders/list" 
                        element={
                          <UserRoute>
                            <Orders />
                          </UserRoute>
                        } 
                      />
                      <Route 
                        path="/orders/:orderId" 
                        element={
                          <UserRoute>
                            <OrderDetails />
                          </UserRoute>
                        } 
                      />
                      <Route 
                        path="/orders" 
                        element={
                          <UserRoute>
                            <Navigate to="/orders/list" replace />
                          </UserRoute>
                        } 
                      />
                      <Route
                        path="/billing"
                        element={<Billing />}
                      />
                      <Route 
  path="/tickets" 
  element={
    <ProtectedRoute>
      <TicketDashboard />
    </ProtectedRoute>
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
                      <Route 
                        path="/admin/users/orders" 
                        element={
                          <AdminRoute>
                            <UsersWithOrders />
                          </AdminRoute>
                        } 
                      />
                      <Route 
                        path="/admin/users/:userId/orders" 
                        element={
                          <AdminRoute>
                            <UserOrders />
                          </AdminRoute>
                        } 
                      />
                      <Route 
                        path="/admin/orders/:orderId" 
                        element={
                          <AdminRoute>
                            <OrderDetails />
                          </AdminRoute>
                        } 
                      />
                    </Routes>
                  </main>
                </div>
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





