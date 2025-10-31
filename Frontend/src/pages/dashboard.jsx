import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaUsers, FaBuilding, FaTicketAlt, FaCheckCircle, FaPauseCircle, FaSpinner, FaFolderOpen } from 'react-icons/fa';

import StatCard from '../components/StatCard.jsx';
import '../styles/Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// --- Vista para Admin/Agente (Estadísticas) ---
const AdminAgenteDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/dashboard-stats`);
        setStats(response.data);
      } catch (err) {
        setError("Error al cargar las estadísticas. Asegúrate de que el backend esté funcionando.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // --- ¡CORRECCIÓN AQUÍ! ---
  // Forzamos los valores a ser numéricos con Number()
  // Si el valor es null o undefined, Number() lo convierte a 0 (o NaN que el || 0 arregla)
  const chartData = [
    { name: 'Abiertos', value: Number(stats?.ticketsAbiertos) || 0 },
    { name: 'En Progreso', value: Number(stats?.ticketsEnProgreso) || 0 },
    { name: 'Pendientes', value: Number(stats?.ticketsPendientes) || 0 },
    { name: 'Cerrados', value: Number(stats?.ticketsCerrados) || 0 },
  ];
  // --- FIN DE LA CORRECCIÓN ---

  const COLORS = ['#DC3545', '#FFC107', '#6C757D', '#28A745']; // Rojo, Amarillo, Gris, Verde

  if (loading) {
    return <div className="dashboard-layout">Cargando estadísticas... <FaSpinner className="spinner" /></div>;
  }
  
  if (error) {
    return <div className="dashboard-layout"><p className="form-error">{error}</p></div>;
  }

  if (!stats) {
    return <div className="dashboard-layout">No se pudieron cargar las estadísticas.</div>;
  }

  return (
    <div className="dashboard-layout">
      <h1>Dashboard de Administración</h1>
      
      {/* --- Fila 1: Estadísticas Generales --- */}
      <div className="stats-grid">
        <StatCard 
          titulo="Total Empleados" 
          valor={stats.totalEmpleados}
          icono={<FaUsers />}
          color="blue"
        />
        <StatCard 
          titulo="Total Departamentos" 
          valor={stats.totalDepartamentos}
          icono={<FaBuilding />}
          color="green"
        />
        <StatCard 
          titulo="Total Tickets" 
          valor={stats.totalTickets}
          icono={<FaTicketAlt />}
          color="purple"
        />
      </div>
      
      <h2 className="stats-subtitle">Progreso de Tickets</h2>
      <div className="stats-grid">
        <StatCard 
          titulo="Tickets Abiertos" 
          valor={stats.ticketsAbiertos}
          icono={<FaFolderOpen />}
          color="red"
        />
        <StatCard 
          titulo="Tickets En Progreso" 
          valor={stats.ticketsEnProgreso}
          icono={<FaSpinner />}
          color="yellow"
        />
        <StatCard 
          titulo="Tickets Pendientes" 
          valor={stats.ticketsPendientes}
          icono={<FaPauseCircle />}
          color="grey"
        />
        <StatCard 
          titulo="Tickets Cerrados" 
          valor={stats.ticketsCerrados}
          icono={<FaCheckCircle />}
          color="green-dark"
        />
      </div>

      <div className="chart-container">
        <h3>Resumen de Estados de Tickets</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Tooltip />
            <Legend />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={140}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const EmpleadoBienvenida = () => {
  const { user } = useAuth();
  return (
    <div className="dashboard-layout">
  
      <div className="welcome-section">
        <h1>¡Bienvenido, {user.name}!</h1>
        <p>Puedes reportar un problema o crear una nueva solicitud de soporte desde la sección <strong>"Tickets"</strong> en el menú.</p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  if (user.role === 'Administrador' || user.role === 'Agente') {
    return <AdminAgenteDashboard />;
  } else {
    return <EmpleadoBienvenida />;
  }
};

export default Dashboard;

