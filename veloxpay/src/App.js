import logo from './logo.svg';
import './App.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Dashboard from './Dashboard';
import DashboardHome from './DashboardHome';
import Upload from './Upload';
import Invoices from './Invoices';
import Profile from './Profile';
import ApproveInvoice from './pages/ApproveInvoice';

function App() {
  return (
    <AuthProvider>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/approve/:invoiceId" element={<ApproveInvoice />} />
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />}>
            <Route index element={<DashboardHome />} />
            <Route path="upload" element={<Upload />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </GoogleOAuthProvider>
    </AuthProvider>
  );
}

export default App;
