import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';

// Reutilizamos los estilos
import '../styles/Form.css';
import '../styles/Usuarios.css'; // Para el overlay y el modal

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const ModalEditarTicket = ({ ticket, onClose, onSuccess }) => {
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'Media',
    departamento_id: '',
  });
  
  // Estado para la lista de departamentos
  const [departamentos, setDepartamentos] = useState([]);
  
  // Estados de UI
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Un solo estado de carga

  // Cargar datos del Ticket Y la lista de Departamentos
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Hacemos ambas peticiones al mismo tiempo
        const [ticketRes, deptsRes] = await Promise.all([
          axios.get(`${API_URL}/tickets/${ticket.id}`), // 1. Detalles del ticket
          axios.get(`${API_URL}/departamentos`)          // 2. Lista de departamentos
        ]);

        const ticketData = ticketRes.data;
        
        // Rellenamos el formulario con los datos del ticket
        setFormData({
          titulo: ticketData.titulo,
          descripcion: ticketData.descripcion,
          prioridad: ticketData.prioridad,
          departamento_id: ticketData.departamento_id 
        });
        
        // Guardamos la lista de departamentos
        setDepartamentos(deptsRes.data);

      } catch (err) {
        console.error("Error al cargar datos para editar", err);
        setError("Error: No se pudieron cargar los datos del ticket.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [ticket.id]); // Se ejecuta si el ID del ticket cambia

  // Maneja los cambios en cualquier input o select
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const datosActualizados = {
        ...formData,
        departamento_id: parseInt(formData.departamento_id, 10),
      };

      // Llamamos a la ruta PUT del backend (la lógica de permisos está en el server)
      await axios.put(`${API_URL}/tickets/${ticket.id}`, datosActualizados);
      
      // ¡Éxito!
      onSuccess();

    } catch (err) {
      setError(err.response?.data?.message || "Error al actualizar el ticket.");
    } finally {
      setLoading(false);
    }
  };

  // Cierra el modal si se hace clic en el fondo oscuro
  const handleOverlayClick = (e) => {
    if (e.target.id === 'modal-overlay') {
      onClose();
    }
  };

  return (
    <div id="modal-overlay" className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Editar Ticket #{ticket.id}</h2>
          <button onClick={onClose} className="modal-close-btn"><FaTimes /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {error && <p className="form-error">{error}</p>}
            
            {loading ? (
              <p>Cargando datos del ticket...</p>
            ) : (
              <>
                <div className="form-group full-width">
                  <label htmlFor="titulo">Asunto (Título breve)</label>
                  <input 
                    type="text" 
                    id="titulo"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group full-width">
                  <label htmlFor="descripcion">Descripción del Problema</label>
                  <textarea 
                    id="descripcion" 
                    name="descripcion"
                    rows="6"
                    value={formData.descripcion}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="departamento_id">Necesita soporte de:</label>
                    <select 
                      id="departamento_id"
                      name="departamento_id"
                      value={formData.departamento_id}
                      onChange={handleChange}
                      required
                    >
                      {departamentos.map(depto => (
                        <option key={depto.id} value={depto.id}>
                          {depto.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="prioridad">Prioridad</label>
                    <select 
                      id="prioridad"
                      name="prioridad"
                      value={formData.prioridad}
                      onChange={handleChange}
                      required
                    >
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEditarTicket;
