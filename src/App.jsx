import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Setup from '@/pages/Setup';
import Dashboard from '@/pages/Dashboard';
import Family from '@/pages/Family';
import Inventory from '@/pages/Inventory';
import Shopping from '@/pages/Shopping';
import Expenses from '@/pages/Expenses';
import Profile from '@/pages/Profile';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Ruta Protegida: Setup (Requiere Auth pero NO Hogar) */}
          <Route element={<ProtectedRoute requireHome={false} />}>
            <Route path="/setup" element={<Setup />} />
          </Route>

          {/* Rutas Protegidas Core (Requieren Auth Y Hogar) */}
          <Route element={<ProtectedRoute requireHome={true} />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/family" element={<Family />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/shopping" element={<Shopping />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
