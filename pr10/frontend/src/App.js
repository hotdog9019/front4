import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import ProductForm from './pages/ProductForm';
import ProtectedRoute from './component/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Защищённые маршруты */}
        <Route path="/products" element={
          <ProtectedRoute><ProductList /></ProtectedRoute>
        } />
        <Route path="/products/:id" element={
          <ProtectedRoute><ProductDetail /></ProtectedRoute>
        } />
        <Route path="/products/create" element={
          <ProtectedRoute><ProductForm /></ProtectedRoute>
        } />
        <Route path="/products/:id/edit" element={
          <ProtectedRoute><ProductForm /></ProtectedRoute>
        } />
        
        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;