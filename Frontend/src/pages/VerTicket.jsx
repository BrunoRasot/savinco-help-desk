import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { FaPaperPlane, FaSpinner, FaChevronLeft } from 'react-icons/fa';

import '../styles/Tickets.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const VerTicket = () => {
  // --- ¡CORRECCIÓN AQUÍ! ---
  // El parámetro en App.jsx es :id, no :ticketId
  const { id } = useParams(); // Obtiene el 'id' de la URL
  // --- FIN DE LA CORRECCIÓN ---
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  
  const [agentes, setAgentes] = useState([]);
  const [agenteSeleccionadoId, setAgenteSeleccionadoId] = useState('');
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingAccion, setLoadingAccion] = useState(false);

  // --- Función para Cargar Todos los Datos ---
  const fetchTicketData = useCallback(async () => {
    
    // --- ¡CORRECCIÓN AQUÍ! ---
    // Comprobamos la variable 'id'
    if (!id) {
    // --- FIN DE LA CORRECCIÓN ---
      setLoading(false);
      setError("ID de ticket no válido o no encontrado.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // --- ¡CORRECCIÓN AQUÍ! ---
      // Usamos la variable 'id'
      const ticketRes = await axios.get(`${API_URL}/tickets/${id}`);
      setTicket(ticketRes.data);
      setEstadoSeleccionado(ticketRes.data.estado);
      setAgenteSeleccionadoId(ticketRes.data.agente_asignado_id || '');

      // Cargar comentarios
      const comentariosRes = await axios.get(`${API_URL}/tickets/${id}/comentarios`);
      // --- FIN DE LA CORRECCIÓN ---
      setComentarios(comentariosRes.data);

      // Si es Admin, cargar lista de Agentes
      if (user.role === 'Administrador') {
        const agentesRes = await axios.get(`${API_URL}/usuarios?rol=Agente`);
        setAgentes(agentesRes.data);
      }

    } catch (err) {
      console.error("Error al cargar datos del ticket:", err);
      setError(err.response?.data?.message || "Error al cargar los datos.");
    } finally {
      setLoading(false);
    }
  // --- ¡CORRECCIÓN AQUÍ! ---
  // La dependencia ahora es 'id'
  }, [id, user.role]); 
  // --- FIN DE LA CORRECCIÓN ---

  useEffect(() => {
    fetchTicketData();
  }, [fetchTicketData]);

  // --- Manejador para Guardar Cambios (Admin) ---
  const handleGestionarTicket = async (e) => {
    e.preventDefault();
    setLoadingAccion(true);
    try {
      // --- ¡CORRECCIÓN AQUÍ! ---
      await axios.put(`${API_URL}/tickets/${id}`, {
      // --- FIN DE LA CORRECCIÓN ---
        estado: estadoSeleccionado,
        agente_asignado_id: agenteSeleccionadoId || null
      });
      fetchTicketData();
    } catch (err) {
      console.error("Error al actualizar ticket:", err);
      setError("No se pudo actualizar el ticket.");
    } finally {
      setLoadingAccion(false);
    }
  };
  
  // --- Manejador para Cambiar Estado (Agente) ---
  const handleUpdateStatus = async (nuevoEstado) => {
    setLoadingAccion(true);
    try {
      // --- ¡CORRECCIÓN AQUÍ! ---
      await axios.put(`${API_URL}/tickets/${id}`, {
      // --- FIN DE LA CORRECCIÓN ---
        estado: nuevoEstado,
        agente_asignado_id: ticket.agente_asignado_id
      });
      fetchTicketData();
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      setError("No se pudo actualizar el estado.");
    } finally {
      setLoadingAccion(false);
    }
  };

  // --- Manejador para Enviar Comentario ---
  const handleSubmitComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    setLoadingAccion(true);
    try {
      // --- ¡CORRECCIÓN AQUÍ! ---
      await axios.post(`${API_URL}/tickets/${id}/comentarios`, {
      // --- FIN DE LA CORRECCIÓN ---
        comentario: nuevoComentario
      });
      setNuevoComentario('');
      fetchTicketData();
    } catch (err) {
      console.error("Error al enviar comentario:", err);
      setError("No se pudo enviar el comentario.");
    } finally {
      setLoadingAccion(false);
    }
  };

  // --- Renderizado ---
  if (loading) {
    return <div className="page-container"><FaSpinner className="spinner" /> Cargando...</div>;
  }

  if (error) {
    return <div className="page-container"><p className="form-error">{error}</p></div>;
  }

  if (!ticket) {
    return <div className="page-container"><p>Ticket no encontrado.</p></div>;
  }

  // Define los botones de estado (para el Agente)
  const renderBotonesEstadoAgente = () => {
    switch (ticket.estado) {
      case 'Abierto':
      case 'Pendiente':
        return (
          <button onClick={() => handleUpdateStatus('En Progreso')} className="btn-status-action">
            Poner "En Progreso"
          </button>
        );
      case 'En Progreso':
        return (
          <>
            <button onClick={() => handleUpdateStatus('Cerrado')} className="btn-status-action">
              Cerrar Ticket
            </button>
            <button onClick={() => handleUpdateStatus('Pendiente')} className="btn-status-action grey">
              Poner "Pendiente"
            </button>
          </>
        );
      case 'Cerrado':
        return (
          <button onClick={() => handleUpdateStatus('Abierto')} className="btn-status-action danger">
            Reabrir Ticket
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="ticket-detail-page">
      <div className="ticket-header">
        {/* --- ¡CORRECCIÓN AQUÍ! --- */}
        <h1>Detalles del Ticket #{id}</h1>
        {/* --- FIN DE LA CORRECCIÓN --- */}
        <button onClick={() => navigate(-1)} className="btn-volver">
          <FaChevronLeft /> Volver
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="ticket-content-card">
        {/* --- Sección de Detalles del Ticket --- */}
        <section className="ticket-info-section">
          <h2>{ticket.titulo}</h2>
          
          <div className="info-item">
            <span className="info-label">Descripción:</span>
            <p className="info-value description">{ticket.descripcion}</p>
          </div>
          
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Creado por:</span>
              <span className="info-value">{ticket.creador_nombre} {ticket.creador_apellido}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Departamento:</span>
              <span className="info-value">{ticket.departamento_nombre || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Prioridad:</span>
              <span className="info-value">{ticket.prioridad}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Fecha de Creación:</span>
              <span className="info-value">{new Date(ticket.fecha_creacion).toLocaleString()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Estado:</span>
              <span className="info-value">
                <span className={`status-badge ${ticket.estado.toLowerCase().replace(' ', '-')}`}>
                  {ticket.estado}
                </span>
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Agente Asignado:</span>
              <span className="info-value">
                {ticket.agente_nombre ? `${ticket.agente_nombre} ${ticket.agente_apellido}` : 'Sin asignar'}
              </span>
            </div>
          </div>
          
          {/* --- ¡SECCIÓN DE GESTIÓN (ADMIN)! --- */}
          {user.role === 'Administrador' && (
            <form className="management-form" onSubmit={handleGestionarTicket}>
              <h3 className="management-title">Gestionar Ticket</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="agente_asignado_id">Asignar Agente</label>
                  <select
                    id="agente_asignado_id"
                    value={agenteSeleccionadoId}
                    onChange={(e) => setAgenteSeleccionadoId(e.target.value)}
                  >
                    <option value="">-- Sin Asignar --</option>
                    {agentes.map(agente => (
                      <option key={agente.id} value={agente.id}>
                        {agente.nombres} {agente.apellidos}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="estado">Cambiar Estado</label>
                  <select
                    id="estado"
                    value={estadoSeleccionado}
                    onChange={(e) => setEstadoSeleccionado(e.target.value)}
                  >
                    <option value="Abierto">Abierto</option>
                    <option value="En Progreso">En Progreso</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Cerrado">Cerrado</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loadingAccion}>
                  {loadingAccion ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          )}

          {/* --- ¡SECCIÓN DE GESTIÓN (AGENTE)! --- */}
          {user.role === 'Agente' && (
             <div className="status-actions">
              <span className="info-label">Cambiar Estado:</span>
              <div className="status-buttons">
                {renderBotonesEstadoAgente()}
              </div>
            </div>
          )}

        </section>

        <hr className="divider" />

        {/* --- Sección de Comentarios --- */}
        <section className="comments-section">
          <h3>Comentarios</h3>
          
          <div className="comments-list">
            {comentarios.length === 0 ? (
              <p className="no-comments">No hay comentarios todavía.</p>
            ) : (
              comentarios.map(comment => (
                <div key={comment.id} className={`comment-item ${['Administrador', 'Agente'].includes(comment.rol) ? 'agent' : 'user'}`}>
                  <div className="comment-header">
                    <span className="comment-author">{comment.nombres} {comment.apellidos} ({comment.rol})</span>
                    <span className="comment-date">{new Date(comment.fecha_creacion).toLocaleString()}</span>
                  </div>
                  <p className="comment-body">{comment.comentario}</p>
                </div>
              ))
            )}
          </div>

          <form className="comment-form" onSubmit={handleSubmitComentario}>
            <label htmlFor="nuevoComentario" className="info-label">Agregar Comentario</label>
            <textarea
              id="nuevoComentario"
              rows="4"
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              placeholder="Escribe tu comentario o respuesta aquí..."
              required
            ></textarea>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loadingAccion}>
                {loadingAccion ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
                Enviar Comentario
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default VerTicket;

