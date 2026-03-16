import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import ProductForm from './pages/ProductForm';
import UsersList from './pages/UsersList';
import UserEdit from './pages/UserEdit';
import RoleRoute from './component/RoleRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/products"
          element={
            <RoleRoute>
              <ProductList />
            </RoleRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <RoleRoute>
              <ProductDetail />
            </RoleRoute>
          }
        />
        <Route
          path="/products/create"
          element={
            <RoleRoute allowedRoles={['seller', 'admin']}>
              <ProductForm />
            </RoleRoute>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <RoleRoute allowedRoles={['seller', 'admin']}>
              <ProductForm />
            </RoleRoute>
          }
        />

        <Route
          path="/users"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <UsersList />
            </RoleRoute>
          }
        />
        <Route
          path="/users/:id/edit"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <UserEdit />
            </RoleRoute>
          }
        />

        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

