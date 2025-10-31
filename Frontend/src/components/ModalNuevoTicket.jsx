import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';
import '../styles/Form.css';
import '../styles/Usuarios.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const ModalNuevoTicket = ({ onClose, onSuccess }) => {

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('Media');
  const [departamentoId, setDepartamentoId] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [departamentos, setDepartamentos] = useState([]);


  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        const response = await axios.get(`${API_URL}/departamentos`);
        setDepartamentos(response.data);

        if (response.data.length > 0) {
          setDepartamentoId(response.data[0].id);
        }
      } catch (err) {
        console.error("Error al cargar departamentos", err);
        setError("Error: No se pudieron cargar los departamentos.");
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepartamentos();
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!departamentoId) {
        throw new Error("Por favor, seleccione un departamento.");
      }

      const nuevoTicket = {
        titulo,
        descripcion,
        prioridad,
        departamento_id: parseInt(departamentoId, 10),
      };

      await axios.post(`${API_URL}/tickets`, nuevoTicket);


      onSuccess();

    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error al enviar el ticket.");
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
          <h2>Crear Nuevo Ticket</h2>
          <button onClick={onClose} className="modal-close-btn"><FaTimes /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {error && <p className="form-error">{error}</p>}

            <div className="form-group full-width">
              <label htmlFor="titulo">Asunto (Título breve)</label>
              <input
                type="text"
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Mi monitor no enciende"
                required
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="descripcion">Descripción del Problema</label>
              <textarea
                id="descripcion"
                rows="6"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Por favor, describe el problema con el mayor detalle posible..."
                required
              ></textarea>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="departamentoId">Necesita soporte de:</label>
                <select
                  id="departamentoId"
                  value={departamentoId}
                  onChange={(e) => setDepartamentoId(e.target.value)}
                  required
                  disabled={loadingDepts}
                >
                  {loadingDepts ? (
                    <option>Cargando...</option>
                  ) : (
                    departamentos.map(depto => (
                      <option key={depto.id} value={depto.id}>
                        {depto.nombre}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="prioridad">Prioridad</label>
                <select
                  id="prioridad"
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value)}
                  required
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalNuevoTicket;
