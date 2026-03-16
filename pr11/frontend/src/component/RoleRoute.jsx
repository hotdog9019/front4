import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

const RoleRoute = ({ children, allowedRoles }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    return children;
  }

  const role = authService.getRole();
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/products" replace />;
  }

  return children;
};

export default RoleRoute;

