import React from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const ModalConfirmacion = ({ title, message, onConfirm, onCancel }) => {
  const handleOverlayClick = (e) => {
    if (e.target.id === 'modal-overlay-confirm') {
      onCancel();
    }
  };

  return (
    <div id="modal-overlay-confirm" className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content modal-confirm">
        <div className="modal-confirm-icon">
          <FaExclamationTriangle />
        </div>

        <h2>{title}</h2>
        <p>{message}</p>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Confirmar
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalConfirmacion;
