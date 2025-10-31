import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaEdit, FaTrashAlt, FaEye, FaChevronDown, FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';

import ModalNuevoTicket from '../components/ModalNuevoTicket.jsx';
import ModalEditarTicket from '../components/ModalEditarTicket.jsx';
import ModalConfirmacion from '../components/ModalConfirmacion.jsx';

import '../styles/Usuarios.css'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const Tickets = () => {
  const { user } = useAuth(); // Obtenemos el usuario logueado
  const navigate = useNavigate();
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [ticketsPorPagina] = useState(10);
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [isNuevoModalOpen, setIsNuevoModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  const [accionConfirmar, setAccionConfirmar] = useState(null);

  // --- Cargar Tickets ---
  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/tickets`);
      setTickets(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar los tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // --- Lógica de Búsqueda y Paginación ---
  const ticketsFiltrados = tickets.filter(t => 
    t.titulo.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    (t.creador_nombre + ' ' + t.creador_apellido).toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    (t.departamento_nombre || '').toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    t.estado.toLowerCase().includes(filtroBusqueda.toLowerCase())
  );

  const indiceUltimoTicket = paginaActual * ticketsPorPagina;
  const indicePrimerTicket = indiceUltimoTicket - ticketsPorPagina;
  const ticketsPaginados = ticketsFiltrados.slice(indicePrimerTicket, indiceUltimoTicket);
  const totalPaginas = Math.ceil(ticketsFiltrados.length / ticketsPorPagina);

  const cambiarPagina = (numeroPagina) => setPaginaActual(numeroPagina);

  // --- Manejadores de Acciones ---
  
  const toggleMenuAccion = (ticketId) => {
    setMenuAbiertoId(menuAbiertoId === ticketId ? null : ticketId);
  };

  const handleVerTicket = (id) => {
    navigate(`/ticket/${id}`);
    setMenuAbiertoId(null);
  };

  const handleEditar = (ticket) => {
    setTicketSeleccionado(ticket);
    if (user.role === 'Empleado') {
      setIsEditarModalOpen(true);
    } else {
      navigate(`/ticket/${ticket.id}`);
    }
    setMenuAbiertoId(null);
  };

  const handleEliminar = (ticket) => {
    setTicketSeleccionado(ticket);
    setAccionConfirmar({
      accion: 'eliminar-ticket',
      title: '¿Eliminar Ticket?',
      message: `¿Estás seguro de eliminar el ticket "${ticket.titulo}"? Esta acción no se puede deshacer.`
    });
    setIsConfirmModalOpen(true);
    setMenuAbiertoId(null);
  };

  const onConfirmarAccion = async () => {
    if (!accionConfirmar || !ticketSeleccionado) return;
    
    try {
      if (accionConfirmar.accion === 'eliminar-ticket') {
        await axios.delete(`${API_URL}/tickets/${ticketSeleccionado.id}`);
        setSuccessMessage('Ticket eliminado exitosamente.');
        fetchTickets();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Ocurrió un error al eliminar.");
    } finally {
      setIsConfirmModalOpen(false);
      setTicketSeleccionado(null);
      setAccionConfirmar(null);
    }
  };

  // --- Renderizado ---
  return (
    <div className="page-container">
      <h1>Lista de Tickets</h1>

      {successMessage && <p className="form-success">{successMessage}</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="usuarios-header">
        
        {/* --- ¡AQUÍ ESTÁ LA CORRECCIÓN! --- */}
        {/* Solo el Empleado ve el botón de "Agregar Nuevo" */}
        {user.role === 'Empleado' ? (
          <button className="btn btn-primary" onClick={() => { setIsNuevoModalOpen(true); setSuccessMessage(''); }}>
            <FaPlus /> Agregar Nuevo
          </button>
        ) : (
          /* Un div vacío para que el buscador se quede a la derecha */
          <div></div> 
        )}
        {/* --- FIN DE LA CORRECCIÓN --- */}

        <div className="search-bar">
          <FaSearch />
          <input 
            type="text" 
            placeholder="Buscar por asunto, usuario, estado..." 
            value={filtroBusqueda}
            onChange={(e) => {
              setFiltroBusqueda(e.target.value);
              setPaginaActual(1);
            }}
          />
        </div>
      </div>

      {loading ? (
        <p>Cargando tickets...</p>
      ) : ticketsFiltrados.length === 0 ? (
        <p>No se encontraron tickets.</p>
      ) : (
        <>
          <div className="table-container">
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>N.°</th>
                  <th>Fecha Creación</th>
                  <th>Ticket Usuario</th>
                  <th>Departamento</th>
                  <th>Asunto</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ticketsPaginados.map((ticket, index) => {
                  const esAdminOAgente = ['Administrador', 'Agente'].includes(user.role);
                  const esCreador = user.id === ticket.creado_por_id;
                  const estaAbierto = ticket.estado === 'Abierto';

                  const canView = true;
                  const canEdit = esAdminOAgente || (esCreador && estaAbierto);
                  const canDelete = esAdminOAgente || (esCreador && estaAbierto);

                  return (
                    <tr key={ticket.id}>
                      <td>{ticket.id}</td>
                      <td>{new Date(ticket.fecha_creacion).toLocaleString()}</td>
                      <td>{ticket.creador_nombre} {ticket.creador_apellido}</td>
                      <td>{ticket.departamento_nombre || 'N/A'}</td>
                      <td>{ticket.titulo}</td>
                      <td>
                        <span className={`badge ${
                          ticket.estado === 'Abierto' ? 'badge-danger' : 
                          ticket.estado === 'Cerrado' ? 'badge-success' : 'badge-warning'
                        }`}>
                          {ticket.estado}
                        </span>
                      </td>
                      <td>
                        <div className="action-menu-container">
                          <button 
                            className={`btn-action ${esAdminOAgente ? 'btn-primary' : 'btn-danger'}`}
                            onClick={() => toggleMenuAccion(ticket.id)}
                            aria-expanded={menuAbiertoId === ticket.id}
                            aria-controls={`menu-${ticket.id}`}
                          >
                            Acción <FaChevronDown className="action-caret" />
                          </button>
                          <div 
                            className={`action-dropdown ${menuAbiertoId === ticket.id ? 'show' : ''}`}
                            id={`menu-${ticket.id}`}
                          >
                            {canView && (
                              <button onClick={() => handleVerTicket(ticket.id)}>
                                <FaEye /> {esAdminOAgente ? 'Gestionar' : 'Ver Detalles'}
                              </button>
                            )}
                            {canEdit && (
                              <button onClick={() => handleEditar(ticket)}>
                                <FaEdit /> Editar
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => handleEliminar(ticket)}>
                                <FaTrashAlt /> Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="pagination">
              <button onClick={() => cambiarPagina(1)} disabled={paginaActual === 1}><FaAngleDoubleLeft /></button>
              <button onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual === 1}><FaChevronLeft /></button>
              <span> Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong> </span>
              <button onClick={() => cambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas}><FaChevronRight /></button>
              <button onClick={() => cambiarPagina(totalPaginas)} disabled={paginaActual === totalPaginas}><FaAngleDoubleRight /></button>
            </div>
          )}
        </>
      )}

      {/* --- Modales --- */}
      {isNuevoModalOpen && (
        <ModalNuevoTicket 
          onClose={() => setIsNuevoModalOpen(false)}
          onSuccess={() => {
            fetchTickets();
            setIsNuevoModalOpen(false);
            setSuccessMessage('¡Ticket creado exitosamente!');
          }}
        />
      )}

      {isEditarModalOpen && ticketSeleccionado && (
        <ModalEditarTicket
          ticket={ticketSeleccionado}
          onClose={() => setIsEditarModalOpen(false)}
          onSuccess={() => {
            fetchTickets();
            setIsEditarModalOpen(false);
            setSuccessMessage('Ticket actualizado exitosamente.');
          }}
        />
      )}

      {isConfirmModalOpen && accionConfirmar && (
        <ModalConfirmacion
          title={accionConfirmar.title}
          message={accionConfirmar.message}
          onConfirm={onConfirmarAccion}
          onCancel={() => setIsConfirmModalOpen(false)}
        />
      )}

    </div>
  );
};

export default Tickets;

