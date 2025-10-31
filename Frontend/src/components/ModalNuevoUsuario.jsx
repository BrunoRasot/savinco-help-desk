import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';
import '../styles/Usuarios.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const ModalNuevoUsuario = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    email: '',
    password: '',
    area: '',
    rol: 'Empleado',
  });
  const [departamentos, setDepartamentos] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        const response = await axios.get(`${API_URL}/departamentos`);
        setDepartamentos(response.data);

        if (response.data.length > 0) {
          setFormData(prevState => ({
            ...prevState,
            area: response.data[0].nombre
          }));
        }
      } catch (err) {
        console.error("Error al cargar departamentos", err);
        setError("Error: No se pudieron cargar las áreas/departamentos.");
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchDepartamentos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

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
      await axios.post(`${API_URL}/register`, formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear el usuario.");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.id === 'modal-overlay') {
      onClose();
    }
  };

  return (
    <div id="modal-overlay" className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Agregar Nuevo Usuario</h2>
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
                <label htmlFor="password">Contraseña temporal</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Contraseña temporal"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="area">Área</label>
                <select
                  id="area"
                  name="area"
                  value={formData.area}
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
                  value={formData.rol}
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
              {loading ? 'Guardando...' : 'Guardar Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalNuevoUsuario;