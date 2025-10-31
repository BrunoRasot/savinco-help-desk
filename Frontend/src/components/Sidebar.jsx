import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import '../styles/Sidebar.css';
import { FaBars, FaChartBar, FaUserFriends, FaBuilding, FaTicketAlt, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import logoSavinco from '../assets/logo.png';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed((c) => !c);
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const esAdmin = user.role === 'Administrador';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} aria-hidden={collapsed}>
      <div className="sidebar-header">
        <button
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Abrir menú' : 'Cerrar menú'}
          aria-expanded={!collapsed}
        >
          <FaBars />
        </button>
        <span className="sidebar-logo">SAVINCO</span>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/dashboard" title="Dashboard">
              <FaChartBar /> <span className="link-text">Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/tickets" title="Tickets">
              <FaTicketAlt /> <span className="link-text">Tickets</span>
            </NavLink>
          </li>

          {esAdmin && (
            <>
              <li>
                <NavLink to="/empleados" title="Usuarios">
                  <FaUserFriends /> <span className="link-text">Usuarios</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/departamentos" title="Departamentos">
                  <FaBuilding /> <span className="link-text">Departamentos</span>
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logout} title="Salir">
          <FaSignOutAlt /> <span className="link-text">Salir</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
