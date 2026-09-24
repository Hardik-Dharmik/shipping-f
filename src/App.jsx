import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import RateCalculator from './components/shipping/RateCalculator';
import Billing from './components/billing/Billing';
import Kyc from './components/kyc/Kyc';
import Employees from './components/admin/Employees';
import { routePermission } from './utils/pageAccess';
import Users from './components/admin/Users';
import UsersWithOrders from './components/admin/UsersWithOrders';
import UserOrders from './components/admin/UserOrders';
import KycRequests from './components/admin/KycRequests';
import KycApproval from './components/admin/KycApproval';
import './App.css';
import TicketDashboard from './components/tickets/TicketDashboard';
import Customers from './components/customers/Customers';
import Home from './components/home/Home';
import OrderDetails from './components/orders/order-details/OrderDetails';
import Orders from './components/orders/order-list/Orders';
import ManualOrder from './components/orders/create-order/ManualOrder';
import CreateOrder from './components/orders/create-order/CreateOrder';
import AddressFormsList from './components/orders/address-form/list/AddressFormsList';
import AddressFormPublic from './components/orders/address-form/public/AddressFormPublic';
import CreateAddressFormLink from './components/orders/address-form/create/CreateAddressFormLink';
import ShipmentConfirmed from './components/orders/shipment-confirmed/ShipmentConfirmed';
import ContactDetailsList from './components/contact-details/ContactDetailsList';
import { SchedulePickup, MyPickups } from './components/pickups/Pickups';

function ProtectedRoute({ children }) {
 const {isAuthenticated,loading,authError,refreshPermissions,logout,isEmployee,canAccess,landingPath} = useAuth();
 const {pathname} = useLocation();
 if (loading) return <div role="status">Loading...</div>;
 if (authError) return <div role="alert">{authError} <button onClick={refreshPermissions}>Retry</button> <button onClick={logout}>Logout</button></div>;
 if (!isAuthenticated) return <Navigate to="/login" replace />;
 if (isEmployee && pathname !== '/access-not-assigned' && !canAccess(routePermission(pathname))) return <Navigate to={landingPath} replace />;
 return children;
}
function PublicRoute({children}) {
 const {isAuthenticated,loading,landingPath} = useAuth();
 if (loading) return <div>Loading...</div>;
 return isAuthenticated ? <Navigate to={landingPath} replace /> : children;
}
function AdminRoute({children,adminOnly=false}) {
 const {isAdmin,isEmployee,canAccess,landingPath} = useAuth();
 const {pathname} = useLocation();
 return isAdmin || (!adminOnly && isEmployee && canAccess(routePermission(pathname))) ? children : <Navigate to={landingPath} replace />;
}
function UserRoute({children,allowAdmin=false}) {
 const {isAdmin,isEmployee,landingPath} = useAuth();
 return (isAdmin && !allowAdmin) || isEmployee ? <Navigate to={landingPath} replace /> : children;
}
function DefaultRoute() {
 const {landingPath} = useAuth();
 return <Navigate to={landingPath} replace />;
}
function AccessNotAssigned() {
 const {landingPath,logout} = useAuth();
 if (landingPath !== '/access-not-assigned') return <Navigate to={landingPath} replace />;
 return <section><h1>Access not assigned</h1><p>Contact your administrator to request page access.</p><button onClick={logout}>Logout</button></section>;
}

function AppRoutes() {
  const { accessKey } = useAuth();
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
      <Route path="/public/rate-calculator" element={<Navigate to="/calculate-rate" replace />} />
      <Route path="/address-form/:code" element={<AddressFormPublic />} />
      <Route path="/address-forms/:code" element={<AddressFormPublic />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <SidebarProvider>
              <div className="app">
                <Sidebar />
                <div className="app-content">
                  <Header />
                  <main className="main-content" key={accessKey}>
                    <Routes>
                      <Route path="/" element={<DefaultRoute />} />
<Route path="/access-not-assigned" element={<AccessNotAssigned />} />
<Route path="/admin/employees" element={<AdminRoute adminOnly><Employees /></AdminRoute>} />
                      <Route path="/customers" element={<Customers />} />
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
                          <ProtectedRoute>
                            <RateCalculator />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="/orders/manual" element={<ProtectedRoute><ManualOrder /></ProtectedRoute>} />
                      <Route 
                        path="/orders/create" 
                        element={
                          <ProtectedRoute>
                            <CreateOrder />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/orders/list" 
                        element={
                          <UserRoute allowAdmin>
                            <Orders />
                          </UserRoute>
                        } 
                      />
                      <Route path="/pickups/schedule" element={<UserRoute><SchedulePickup /></UserRoute>} />
                      <Route path="/pickups" element={<UserRoute><MyPickups /></UserRoute>} />
                      <Route
                        path="/orders/confirmed"
                        element={
                          <ProtectedRoute>
                            <ShipmentConfirmed />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/orders/address-forms"
                        element={
                          <UserRoute>
                            <AddressFormsList />
                          </UserRoute>
                        }
                      />
                      <Route 
                        path="/orders/:orderId" 
                        element={
                          <UserRoute allowAdmin>
                            <OrderDetails />
                          </UserRoute>
                        } 
                      />
                      <Route 
                        path="/orders" 
                        element={
                          <UserRoute allowAdmin>
                            <Navigate to="/orders/list" replace />
                          </UserRoute>
                        } 
                      />
                      <Route
                        path="/billing"
                        element={<Billing />}
                      />
                      <Route
                        path="/orders/address-forms/create"
                        element={<UserRoute><CreateAddressFormLink /></UserRoute>}
                      />
                      <Route
                        path="/contact-details"
                        element={
                          <UserRoute>
                            <ContactDetailsList />
                          </UserRoute>
                        }
                      />
                      <Route
                        path="/kyc"
                        element={
                          <UserRoute>
                            <Kyc />
                          </UserRoute>
                        }
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
                        path="/admin/kyc/requests"
                        element={
                          <AdminRoute>
                            <KycRequests />
                          </AdminRoute>
                        }
                      />
                      <Route
                        path="/admin/kyc/requests/:id"
                        element={
                          <AdminRoute>
                            <KycApproval />
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





