import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import './App.css';

// --- Páginas de Acceso ---
import Login from './pages/login';

// --- Páginas Protegidas ---
import Dashboard from './pages/dashboard';
import Empleados from './pages/empleados';
import Departamentos from './pages/departamentos';
import Tickets from './pages/tickets';
import VerTicket from './pages/VerTicket'; // Página de detalles del ticket

// Componente para manejar la ruta raíz (/)
const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  // Redirige al dashboard por defecto si está logueado
  return <Navigate to="/dashboard" />;
};

function App() {
  return (
    <Routes>
      {/* --- Rutas Públicas --- */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RootRedirect />} /> 

      {/* --- Rutas Protegidas (dentro del Layout) --- */}
      <Route 
        // Permitimos el acceso al MainLayout a cualquiera que esté logueado
        element={
          <ProtectedRoute allowedRoles={['Administrador', 'Agente', 'Empleado']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Rutas Hijas (se renderizan dentro del Sidebar/Layout) */}
        
        {/* Dashboard (Acceso General para todos) */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Tickets (Lista de tickets - Acceso General) */}
        <Route path="/tickets" element={<Tickets />} />

        {/* --- RUTA DE DETALLES DEL TICKET --- */}
        {/* Necesita el ID del ticket en la URL */}
        <Route path="/ticket/:id" element={<VerTicket />} />

        {/* Empleados (Solo Admin) */}
        <Route 
          path="/empleados" 
          element={
            <ProtectedRoute allowedRoles={['Administrador']}>
              <Empleados />
            </ProtectedRoute>
          } 
        />
        
        {/* Departamentos (Solo Admin) */}
        <Route 
          path="/departamentos" 
          element={
            <ProtectedRoute allowedRoles={['Administrador']}>
              <Departamentos />
            </ProtectedRoute>
          } 
        />
        
      </Route>
      
      {/* Ruta "catch-all" para cualquier URL desconocida */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
