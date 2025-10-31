import React from 'react';
import '../styles/Dashboard.css';

/**
 @param {object} props
 * @param {string} props.titulo
 * @param {string|number} props.valor
 * @param {React.ReactNode} props.icono
 * @param {string} props.color
 */
const StatCard = ({ titulo, valor, icono, color }) => {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon-wrapper">
        {icono}
      </div>
      <div className="stat-info">
        <span className="stat-title">{titulo}</span>
        <span className="stat-value">{valor}</span>
      </div>
    </div>
  );
};

export default StatCard;
