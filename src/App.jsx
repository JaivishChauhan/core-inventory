import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import OtpPage from './pages/auth/OtpPage'

// Main Pages
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/products/ProductsPage'
import ProductFormPage from './pages/products/ProductFormPage'

// Operations
import ReceiptsPage from './pages/operations/ReceiptsPage'
import ReceiptDetailPage from './pages/operations/ReceiptDetailPage'
import DeliveryPage from './pages/operations/DeliveryPage'
import DeliveryDetailPage from './pages/operations/DeliveryDetailPage'
import AdjustmentPage from './pages/operations/AdjustmentPage'
import MoveHistoryPage from './pages/operations/MoveHistoryPage'

// Settings
import SettingsPage from './pages/settings/SettingsPage'
import ProfilePage from './pages/settings/ProfilePage'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/otp" element={<OtpPage />} />
        
        {/* Protected Authed Routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/new" element={<ProductFormPage />} />
              <Route path="/products/:id" element={<ProductFormPage />} />
              
              <Route path="/operations/receipts" element={<ReceiptsPage />} />
              <Route path="/operations/receipts/new" element={<ReceiptDetailPage />} />
              <Route path="/operations/receipts/:id" element={<ReceiptDetailPage />} />
              
              <Route path="/operations/delivery" element={<DeliveryPage />} />
              <Route path="/operations/delivery/new" element={<DeliveryDetailPage />} />
              <Route path="/operations/delivery/:id" element={<DeliveryDetailPage />} />
              
              <Route path="/operations/adjustment" element={<AdjustmentPage />} />
              
              <Route path="/history" element={<MoveHistoryPage />} />
              
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}
