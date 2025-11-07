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
        <div className="login-grid">
          <aside className="login-hero" aria-hidden>
            <div className="login-hero-inner">
              <div className="login-hero-brand">SAVINCO</div>
              <h1 className="login-hero-title">Hola, Bienvenido !</h1>
              <p className="login-hero-copy">Sistema de gestión interna — soporte y tickets.</p>
            </div>
          </aside>

          <section className="login-panel">
            <div className="login-card">
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
          </section>
        </div>
      </main>

      <footer className="login-footer">
        <span>Versión 1.0</span>
        <span>Copyright © 2025 Todos los derechos reservados</span>
      </footer>
    </div>
  );
};

export default Login;