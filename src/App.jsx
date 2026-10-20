import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import HomePage from './pages/HomePage';
import ProductDetails from './pages/ProductDetails';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import AdminInventory from './pages/AdminInventory';
import Login from './pages/Login';
import Shop from './pages/Shop';
import Account from './pages/Account';
import SavedAddresses from './pages/SavedAddresses';
import Settings from './pages/Settings';
import WhatsAppButton from './components/WhatsAppButton';
import { Toaster } from 'react-hot-toast';

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/tracking" element={<OrderTracking />} />
        <Route path="/admin" element={<AdminInventory />} />
        <Route path="/login" element={<Login />} />
        <Route path="/account" element={<Account />} />
        <Route path="/addresses" element={<SavedAddresses />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/wishlist" element={<Shop />} />
      </Routes>
      <WhatsAppButton />
      <Toaster position="top-center" reverseOrder={false} />
    </Router>
  );
}

export default App;
