import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx'; 
import { FaPlus, FaSearch, FaEdit, FaTrashAlt, FaChevronDown, FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';

import ModalNuevoDepartamento from '../components/ModalNuevoDepartamento.jsx';
import ModalEditarDepartamento from '../components/ModalEditarDepartamento.jsx';
import ModalConfirmacion from '../components/ModalConfirmacion.jsx';

import '../styles/departamentos.css'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const Departamentos = () => {
  const { user } = useAuth();
  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNuevoModalOpen, setIsNuevoModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deptoSeleccionado, setDeptoSeleccionado] = useState(null);
  const [accionConfirmar, setAccionConfirmar] = useState(null); 
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10); 
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);
  const fetchDepartamentos = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await axios.get(`${API_URL}/departamentos`);
      setDepartamentos(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar departamentos.");
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al iniciar
  useEffect(() => {
    fetchDepartamentos();
  }, []); 

  // --- Lógica de Búsqueda y Paginación ---
  const deptosFiltrados = departamentos.filter(d => 
    d.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    (d.descripcion && d.descripcion.toLowerCase().includes(filtroBusqueda.toLowerCase()))
  );

  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const deptosPaginados = deptosFiltrados.slice(indicePrimerItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(deptosFiltrados.length / itemsPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  // --- Petición Genérica para Acciones ---
  const handleAxiosRequest = async (method, url) => {
    try {
      setError(null);
      setLoading(true);
      
      let response;
      if (method === 'delete') {
        response = await axios.delete(url);
      } else {
        throw new Error('Método no soportado');
      }
      
      console.log(response.data.message);
      fetchDepartamentos(); // Recargar la tabla
      
    } catch (err) {
      console.error("Error en la acción:", err);
      setError(err.response?.data?.message || "Ocurrió un error.");
    } finally {
      setLoading(false);
      setIsConfirmModalOpen(false);
    }
  };

  // --- Manejadores de Acciones ---
  const toggleMenuAccion = (deptoId) => {
    setMenuAbiertoId(menuAbiertoId === deptoId ? null : deptoId);
  };

  const handleEditar = (depto) => {
    setDeptoSeleccionado(depto);
    setIsEditarModalOpen(true);
    setMenuAbiertoId(null); 
  };

  const handleEliminar = (depto) => {
    setDeptoSeleccionado(depto);
    setAccionConfirmar({
      title: '¿Eliminar Departamento?',
      message: `¿Estás seguro de que deseas eliminar "${depto.nombre}"? Si hay usuarios en este departamento, podrían verse afectados.`
    });
    setIsConfirmModalOpen(true);
    setMenuAbiertoId(null);
  };

  const onConfirmarAccion = () => {
    if (!deptoSeleccionado) return;
    handleAxiosRequest('delete', `${API_URL}/departamentos/${deptoSeleccionado.id}`);
  };
  
  // Solo el Admin puede "Agregar", "Editar" o "Eliminar"
  const puedeGestionar = user.role === 'Administrador';

  return (
    <div className="page-container">
      <h1>Lista de Departamentos</h1>

      <div className="usuarios-header">
        {puedeGestionar ? (
          <button className="btn btn-primary" onClick={() => setIsNuevoModalOpen(true)}>
            <FaPlus /> Agregar Nuevo
          </button>
        ) : (
          <div /> // Espaciador para mantener la búsqueda a la derecha
        )}
        <div className="search-bar">
          <FaSearch />
          <input 
            type="text" 
            placeholder="Buscar Departamento..." 
            value={filtroBusqueda}
            onChange={(e) => {
              setFiltroBusqueda(e.target.value);
              setPaginaActual(1);
            }}
          />
        </div>
      </div>

      {loading && <p>Cargando departamentos...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && deptosFiltrados.length === 0 && (
        <p>No se encontraron departamentos.</p>
      )}

      {!loading && !error && deptosFiltrados.length > 0 && (
        <>
          <div className="table-container">
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>N.°</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  {puedeGestionar && <th>Acción</th>}
                </tr>
              </thead>
              <tbody>
                {deptosPaginados.map((depto, index) => (
                  <tr key={depto.id}>
                    <td>{indicePrimerItem + index + 1}</td>
                    <td>{depto.nombre}</td>
                    <td>{depto.descripcion || 'N/A'}</td>
                    
                    {/* Solo muestra la columna Acción si es Admin */}
                    {puedeGestionar && (
                      <td>
                        <div className="action-menu-container">
                          <button 
                            className="btn-action" 
                            onClick={() => toggleMenuAccion(depto.id)}
                            aria-expanded={menuAbiertoId === depto.id}
                          >
                            Acción <FaChevronDown className="action-caret" />
                          </button>
                          <div 
                            className={`action-dropdown ${menuAbiertoId === depto.id ? 'show' : ''}`}
                          >
                            <button onClick={() => handleEditar(depto)}>
                              <FaEdit /> Editar
                            </button>
                            <button onClick={() => handleEliminar(depto)}>
                              <FaTrashAlt /> Eliminar
                            </button>
                          </div>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
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

      {/* --- Modales --- */}
      {/* (Estos se renderizan aquí pero están ocultos por CSS) */}
      
      {isNuevoModalOpen && (
        <ModalNuevoDepartamento 
          onClose={() => setIsNuevoModalOpen(false)}
          onSuccess={() => {
            fetchDepartamentos(); 
            setIsNuevoModalOpen(false); 
          }}
        />
      )}

      {isEditarModalOpen && deptoSeleccionado && (
        <ModalEditarDepartamento 
          departamento={deptoSeleccionado}
          onClose={() => setIsEditarModalOpen(false)}
          onSuccess={() => {
            fetchDepartamentos();
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

export default Departamentos;