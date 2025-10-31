import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(user.role)) {

    console.warn(`Acceso denegado. Rol de usuario: ${user.role}. Roles permitidos: ${allowedRoles}`);
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;