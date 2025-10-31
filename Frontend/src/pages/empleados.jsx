import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx'; 
import { FaPlus, FaSearch, FaEdit, FaTrashAlt, FaToggleOn, FaToggleOff, FaChevronDown, FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';

import ModalNuevoUsuario from '../components/ModalNuevoUsuario.jsx';
import ModalEditarUsuario from '../components/ModalEditarUsuario.jsx';
import ModalConfirmacion from '../components/ModalConfirmacion.jsx';

import '../styles/Usuarios.css'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const Empleados = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Estados de Modales ---
  const [isNuevoModalOpen, setIsNuevoModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [accionConfirmar, setAccionConfirmar] = useState(null); 

  // --- Estados de UI ---
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [usuariosPorPagina] = useState(10);
  
  // --- ¡NUEVO ESTADO PARA EL MENÚ DE ACCIÓN! ---
  const [menuAbiertoId, setMenuAbiertoId] = useState(null); // Guarda el ID del menú abierto

  // --- Función para Cargar Usuarios ---
  const fetchUsuarios = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await axios.get(`${API_URL}/usuarios`);
      setUsuarios(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar usuarios.");
    } finally {
      setLoading(false);
    }
  };

  // --- Efecto de Carga Inicial ---
  useEffect(() => {
    if (user.role === 'Administrador') {
      fetchUsuarios();
    } else {
      setError("No tienes permiso para ver esta sección.");
      setLoading(false);
    }
  }, [user.role]);

  // --- Lógica de Búsqueda y Paginación ---
  const usuariosFiltrados = usuarios.filter(u => 
    u.nombres.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    u.apellidos.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    u.dni.toLowerCase().includes(filtroBusqueda.toLowerCase())
  );

  const indiceUltimoUsuario = paginaActual * usuariosPorPagina;
  const indicePrimerUsuario = indiceUltimoUsuario - usuariosPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(indicePrimerUsuario, indiceUltimoUsuario);
  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  // --- Función Genérica para Peticiones ---
  const handleAxiosRequest = async (method, url, data) => {
    try {
      setError(null);
      setLoading(true);
      
      let response;
      switch (method) {
        case 'delete':
          response = await axios.delete(url);
          break;
        case 'patch':
          response = await axios.patch(url, data);
          break;
        default:
          throw new Error('Método no soportado');
      }
      
      console.log(response.data.message);
      fetchUsuarios(); // Recargar la tabla
      
    } catch (err) {
      console.error("Error en la acción:", err);
      setError(err.response?.data?.message || "Ocurrió un error.");
    } finally {
      setLoading(false);
      setIsConfirmModalOpen(false);
    }
  };

  // --- Manejadores de Acciones ---

  // --- ¡NUEVA FUNCIÓN DE TOGGLE PARA EL MENÚ! ---
  const toggleMenuAccion = (usuarioId) => {
    // Si ya está abierto, ciérralo. Si no, ábrelo.
    setMenuAbiertoId(menuAbiertoId === usuarioId ? null : usuarioId);
  };

  const handleEditar = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setIsEditarModalOpen(true);
    setMenuAbiertoId(null); // Cierra el menú al editar
  };

  const handleEliminar = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setAccionConfirmar({
      accion: 'eliminar',
      title: '¿Eliminar Usuario?',
      message: `¿Estás seguro de que deseas eliminar a ${usuario.nombres} ${usuario.apellidos}? Esta acción no se puede deshacer.`
    });
    setIsConfirmModalOpen(true);
    setMenuAbiertoId(null); // Cierra el menú
  };

  const handleToggleEstado = (usuario) => {
    const nuevoEstado = !usuario.is_active;
    setUsuarioSeleccionado(usuario);
    setAccionConfirmar({
      accion: 'estado',
      title: `¿${nuevoEstado ? 'Activar' : 'Desactivar'} Usuario?`,
      message: `¿Estás seguro de que deseas ${nuevoEstado ? 'activar' : 'desactivar'} a ${usuario.nombres}?`,
      datos: { is_active: nuevoEstado }
    });
    setIsConfirmModalOpen(true);
    setMenuAbiertoId(null); // Cierra el menú
  };

  const onConfirmarAccion = () => {
    if (!accionConfirmar || !usuarioSeleccionado) return;
    const { accion, datos } = accionConfirmar;
    
    if (accion === 'eliminar') {
      handleAxiosRequest('delete', `${API_URL}/usuarios/${usuarioSeleccionado.id}`);
    } else if (accion === 'estado') {
      handleAxiosRequest('patch', `${API_URL}/usuarios/${usuarioSeleccionado.id}/estado`, datos);
    }
  };

  // --- Renderizado ---
  if (user.role !== 'Administrador') {
    return (
      <div className="page-container">
        <h1>Gestión de Usuarios</h1>
        <p className="form-error">No tienes permiso para ver esta sección.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Gestión de Usuarios</h1>

      <div className="usuarios-header">
        <button className="btn btn-primary" onClick={() => setIsNuevoModalOpen(true)}>
          <FaPlus /> Agregar Nuevo
        </button>
        <div className="search-bar">
          <FaSearch />
          <input 
            type="text" 
            placeholder="Buscar usuario" 
            value={filtroBusqueda}
            onChange={(e) => {
              setFiltroBusqueda(e.target.value);
              setPaginaActual(1);
            }}
          />
        </div>
      </div>

      {loading && <p>Cargando usuarios...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && usuariosFiltrados.length === 0 && (
        <p>No se encontraron usuarios.</p>
      )}

      {!loading && !error && usuariosFiltrados.length > 0 && (
        <>
          <div className="table-container">
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>N.°</th>
                  <th>Nombre Completo</th>
                  <th>DNI</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Área</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {usuariosPaginados.map((usuario, index) => (
                  <tr key={usuario.id}>
                    <td>{indicePrimerUsuario + index + 1}</td>
                    <td>{usuario.nombres} {usuario.apellidos}</td>
                    <td>{usuario.dni}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.rol}</td>
                    <td>{usuario.area}</td>
                    <td>
                      <span 
                        className={`badge ${usuario.is_active ? 'badge-success' : 'badge-danger'}`}
                        onClick={() => handleToggleEstado(usuario)}
                        title={`Clic para ${usuario.is_active ? 'Desactivar' : 'Activar'}`}
                      >
                        {usuario.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      {/* --- ¡SECCIÓN ACTUALIZADA! --- */}
                      <div className="action-menu-container">
                        <button 
                          className="btn-action" 
                          onClick={() => toggleMenuAccion(usuario.id)}
                        >
                          Acción <FaChevronDown className="action-caret" />
                        </button>
                        <div 
                          className={`action-dropdown ${menuAbiertoId === usuario.id ? 'show' : ''}`}
                        >
                          <button onClick={() => handleEditar(usuario)}>
                            <FaEdit /> Editar
                          </button>
                          <button onClick={() => handleEliminar(usuario)}>
                            <FaTrashAlt /> Eliminar
                          </button>
                        </div>
                      </div>
                      {/* --- FIN DE LA SECCIÓN ACTUALIZADA --- */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="pagination">
              <button onClick={() => cambiarPagina(1)} disabled={paginaActual === 1}>
                <FaAngleDoubleLeft />
              </button>
              <button onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual === 1}>
                <FaChevronLeft />
              </button>
              <span>
                Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong>
              </span>
              <button onClick={() => cambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas}>
                <FaChevronRight />
              </button>
              <button onClick={() => cambiarPagina(totalPaginas)} disabled={paginaActual === totalPaginas}>
                <FaAngleDoubleRight />
              </button>
            </div>
          )}
        </>
      )}

      {isNuevoModalOpen && (
        <ModalNuevoUsuario 
          onClose={() => setIsNuevoModalOpen(false)}
          onSuccess={() => {
            fetchUsuarios();
            setIsNuevoModalOpen(false);
          }}
        />
      )}

      {isEditarModalOpen && usuarioSeleccionado && (
        <ModalEditarUsuario 
          usuario={usuarioSeleccionado}
          onClose={() => setIsEditarModalOpen(false)}
          onSuccess={() => {
            fetchUsuarios();
            setIsEditarModalOpen(false);
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

export default Empleados;
