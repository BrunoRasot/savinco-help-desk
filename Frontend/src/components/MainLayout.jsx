import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../styles/Layout.css';

const MainLayout = () => {
  const location = useLocation();
  const hideFooterOn = ['/login'];
  const showFooter = !hideFooterOn.includes(location.pathname);

  return (
    <div className="layout-container">
      <Sidebar />
      <main className="layout-content">
        <Outlet />
        {showFooter && (
          <footer className="app-footer">
            Copyright © 2025 SAVINCO Todos los derechos reservados
          </footer>
        )}
      </main>
    </div>
  );
};

export default MainLayout;