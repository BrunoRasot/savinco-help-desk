import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';

// Reutilizamos los estilos del formulario de usuarios
import '../styles/Usuarios.css'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const ModalEditarDepartamento = ({ departamento, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cuando el componente se carga, rellena el formulario con los datos del depto.
  useEffect(() => {
    if (departamento) {
      setFormData({
        nombre: departamento.nombre,
        descripcion: departamento.descripcion || '', // Maneja descripciones nulas
      });
    }
  }, [departamento]); // Se ejecuta cada vez que el 'departamento' (prop) cambia

  // Maneja los cambios en los inputs
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

    try {
      // Llama a la ruta PUT para actualizar
      await axios.put(`${API_URL}/departamentos/${departamento.id}`, formData);
      onSuccess(); // Llama a la función onSuccess (recarga la tabla y cierra el modal)
    } catch (err) {
      setError(err.response?.data?.message || "Error al actualizar el departamento.");
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
          <h2>Editar Departamento</h2>
          <button onClick={onClose} className="modal-close-btn"><FaTimes /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Muestra un error si lo hay */}
            {error && <p className="form-error">{error}</p>}
            
            <div className="form-grid">
              
              <div className="form-group full-width">
                <label htmlFor="nombre">Nombre del Departamento</label>
                <input 
                  type="text" 
                  id="nombre" 
                  name="nombre" 
                  value={formData.nombre} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="descripcion">Descripción (Opcional)</label>
                <textarea 
                  id="descripcion" 
                  name="descripcion" 
                  rows="4"
                  value={formData.descripcion} 
                  onChange={handleChange}
                  // Añadimos estilos en línea simples para el textarea
                  style={{
                    resize: 'vertical', 
                    width: '100%', 
                    padding: '0.65rem 0.75rem', 
                    border: '1px solid #ccc', 
                    borderRadius: '6px', 
                    fontSize: '0.9rem', 
                    fontFamily: 'inherit'
                  }}
                />
              </div>

            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Actualizando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEditarDepartamento;