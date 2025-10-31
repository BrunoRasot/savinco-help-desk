import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';

// Reutilizamos los estilos
import '../styles/Usuarios.css'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const ModalEditarUsuario = ({ usuario, onClose, onSuccess }) => {
  // Estado para los datos del formulario, inicializado con el usuario a editar
  const [formData, setFormData] = useState({
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    dni: usuario.dni,
    email: usuario.email,
    area: usuario.area,
    rol: usuario.rol,
  });

  // Estado para la lista de departamentos
  const [departamentos, setDepartamentos] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  // Estado para el envío del formulario
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Cargar Departamentos al Abrir el Modal ---
  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        const response = await axios.get(`${API_URL}/departamentos`);
        setDepartamentos(response.data);
      } catch (err) {
        console.error("Error al cargar departamentos", err);
        setError("Error: No se pudieron cargar las áreas/departamentos.");
      } finally {
        setLoadingDepts(false);
      }
    };
    
    fetchDepartamentos();
  }, []); // El array vacío [] asegura que se ejecute solo una vez

  // Maneja los cambios en cualquier input o select
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Maneja el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.area) {
      setError("Por favor, seleccione un área.");
      setLoading(false);
      return;
    }

    try {
      // Llama a la ruta PUT para actualizar (usa el ID del usuario)
      await axios.put(`${API_URL}/usuarios/${usuario.id}`, formData);
      onSuccess(); // Llama a la función onSuccess (recarga la tabla y cierra el modal)
    } catch (err) {
      setError(err.response?.data?.message || "Error al actualizar el usuario.");
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
          <h2>Editar Usuario</h2>
          <button onClick={onClose} className="modal-close-btn"><FaTimes /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {error && <p className="form-error">{error}</p>}
            
            <div className="form-grid">
              
              <div className="form-group">
                <label htmlFor="nombres">Nombres</label>
                <input 
                  type="text" 
                  id="nombres" 
                  name="nombres" 
                  value={formData.nombres} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="apellidos">Apellidos</label>
                <input 
                  type="text" 
                  id="apellidos" 
                  name="apellidos" 
                  value={formData.apellidos} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="dni">DNI</label>
                <input 
                  type="text" 
                  id="dni" 
                  name="dni" 
                  value={formData.dni} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="password">Contraseña (Opcional)</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  onChange={handleChange} 
                  placeholder="Dejar en blanco para no cambiar" 
                />
                 {/* Nota: Tu backend (ruta PUT) debe estar preparado para ignorar el campo 'password' si llega vacío */}
              </div>

              {/* --- CAMPO DE ÁREA ACTUALIZADO --- */}
              <div className="form-group">
                <label htmlFor="area">Área</label>
                <select 
                  id="area" 
                  name="area" 
                  value={formData.area} // El valor se toma del estado
                  onChange={handleChange} 
                  required 
                  disabled={loadingDepts}
                >
                  {loadingDepts ? (
                    <option>Cargando áreas...</option>
                  ) : (
                    departamentos.map(depto => (
                      <option key={depto.id} value={depto.nombre}>
                        {depto.nombre}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="rol">Rol</label>
                <select 
                  id="rol" 
                  name="rol" 
                  value={formData.rol} // El valor se toma del estado
                  onChange={handleChange} 
                  required
                >
                  <option value="Empleado">Empleado</option>
                  <option value="Agente">Agente</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>

            </div>
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

export default ModalEditarUsuario;

