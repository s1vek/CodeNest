// src/components/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

/**
 * Komponenta pro přihlášení přes GitHub token
 * @returns {JSX.Element} Login komponenta
 */
function Login() {
  // State pro vstupní pole a chyby
  const [username, setUsername] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Přístup k autentizačnímu kontextu
  const { login, error: authError } = useAuth();

  /**
   * Zpracování přihlášení
   * @param {Event} e - Submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!tokenInput.trim()) {
      setLoginError('Zadejte prosím GitHub token');
      return;
    }

    try {
      login(tokenInput);
    } catch (err) {
      setLoginError('Přihlášení selhalo');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>GitHub Login</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">GitHub username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Vaše GitHub uživatelské jméno"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="token">GitHub personal Access Token</label>
            <input
              id="token"
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Váš GitHub token"
            />
          </div>
          
          <button type="submit" className="login-button">Login</button>
        </form>
        
        {(loginError || authError) && (
          <div className="error-message">
            {loginError || authError}
          </div>
        )}
        
        <a
          href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token"
          target="_blank"
          rel="noopener noreferrer"
          className="help-link"
        >
          Where to find github token?
        </a>
      </div>
    </div>
  );
}

export default Login;