import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import BackToTop from './components/Layout/BackToTop';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import AuthModal from './components/Auth/AuthModal';
import LandingPage from './pages/LandingPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import CheckoutPage from './pages/CheckoutPage';
import MyTicketsPage from './pages/MyTicketsPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import ProfilePage from './pages/ProfilePage';
import AdminLayout from './components/Layout/AdminLayout';
import RealtimeDashboardPage from './pages/admin/RealtimeDashboardPage';
import ReportsPage from './pages/admin/ReportsPage';
import CreateEventPage from './pages/admin/CreateEventPage';
import EditEventPage from './pages/admin/EditEventPage';
import ManageEventsPage from './pages/admin/ManageEventsPage';
import './index.css';

function AuthRouteFallback({ mode }) {
  const { openAuthModal } = useAuth();
  useEffect(() => {
    openAuthModal(mode);
  }, [mode, openAuthModal]);
  return <Navigate to="/" replace />;
}

// Redirect admin to dashboard when visiting landing page
function AdminRedirect({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return children;
}

function App() {
  const { theme } = useTheme();
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <div className="app" data-theme={theme}>
            <AuthModal />
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<AdminRedirect><LandingPage /></AdminRedirect>} />
                <Route path="/login" element={<AuthRouteFallback mode="login" />} />
                <Route path="/register" element={<AuthRouteFallback mode="register" />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/events/:id/seats" element={
                  <ProtectedRoute customerOnly><SeatSelectionPage /></ProtectedRoute>
                } />
                <Route path="/checkout/:orderId" element={
                  <ProtectedRoute customerOnly><CheckoutPage /></ProtectedRoute>
                } />
                <Route path="/my-tickets" element={
                  <ProtectedRoute customerOnly><MyTicketsPage /></ProtectedRoute>
                } />
                <Route path="/waiting-room/:eventId" element={
                  <ProtectedRoute customerOnly><WaitingRoomPage /></ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute><ProfilePage /></ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>
                }>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<RealtimeDashboardPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="events/create" element={<CreateEventPage />} />
                  <Route path="events/:id/edit" element={<EditEventPage />} />
                  <Route path="events" element={<ManageEventsPage />} />
                  <Route path="settings" element={<div>Cài đặt hệ thống</div>} />
                </Route>
              </Routes>
            </main>
            <Footer />
            <BackToTop />
          </div>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
