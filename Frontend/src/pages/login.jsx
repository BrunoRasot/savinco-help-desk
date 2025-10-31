// src/pages/login.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/login.css'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password); 
      if (!success) {
        setError('Email o contraseña incorrectos.');
      }
    } catch (err) {
      setError('Ocurrió un error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <header className="login-header">
      </header>

      <main className="login-main">
        <div className="login-card">
          
          {/* --- AQUÍ ESTÁ EL CAMBIO --- */}
          <h2 className="login-card-title">SAVINCO</h2>
          {/* --- FIN DEL CAMBIO --- */}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Usuario</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            {error && <p className="login-error">{error}</p>}
            
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? '...' : 'LOG IN'}
            </button>
          </form>
        </div>
      </main>

      <footer className="login-footer">
        <span>Versión 1.0</span>
        <span><strong>Copyright © 2025</strong></span>
        <span>Todos los derechos reservados</span>
      </footer>
    </div>
  );
};

export default Login;