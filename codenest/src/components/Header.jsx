import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

function Header({ selectedRepo, activeTab, onTabChange, onBack, onRefresh }) {
  const { user, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    
    if (onRefresh) {
      onRefresh(activeTab);
      
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1500);
    } else {
      window.location.reload();
    }
  };

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="logo">
          <h1>CodeNest</h1>
        </div>
        
        {user && (
          <div className="user-info">
            <img src={user.avatar_url} alt={user.login} className="user-avatar" />
            <span className="username">{user.login}</span>
            <button onClick={logout} className="logout-button">
              <svg viewBox="0 0 16 16" width="16" height="16">
                <path fillRule="evenodd" d="M2 2.75C2 1.784 2.784 1 3.75 1h2.5a.75.75 0 010 1.5h-2.5a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h2.5a.75.75 0 010 1.5h-2.5A1.75 1.75 0 012 13.25V2.75zm10.44 4.5H6.75a.75.75 0 000 1.5h5.69l-1.97 1.97a.75.75 0 101.06 1.06l3.25-3.25a.75.75 0 000-1.06l-3.25-3.25a.75.75 0 10-1.06 1.06l1.97 1.97z"></path>
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>
      
      {selectedRepo && (
        <div className="repo-nav">
          <div className="repo-nav-left">
            <button className="back-button" onClick={onBack}>
              <svg viewBox="0 0 16 16" width="16" height="16">
                <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z"></path>
              </svg>
              Back to selection
            </button>
            
            <button 
              className="refresh-button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh current view"
            >
              {isRefreshing ? (
                <svg className="rotating" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6"></path>
                  <path d="M1 20v-6h6"></path>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10"></path>
                  <path d="M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6"></path>
                  <path d="M1 20v-6h6"></path>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10"></path>
                  <path d="M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
                </svg>
              )}
            </button>
          </div>
          
          <div className="repo-info">
            <h2 className="repo-name">
              <svg viewBox="0 0 16 16" width="16" height="16">
                <path fillRule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9.5h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"></path>
              </svg>
              {selectedRepo.name}
            </h2>
            {selectedRepo.description && (
              <p className="repo-description">{selectedRepo.description}</p>
            )}
          </div>
          
          <div className="tabs">
            <button 
              className={`tab-button ${activeTab === 'commits' ? 'active' : ''}`}
              onClick={() => onTabChange('commits')}
            >
              <svg viewBox="0 0 16 16" width="16" height="16">
                <path fillRule="evenodd" d="M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.001 4.001 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z"></path>
              </svg>
              Commit History
            </button>
            <button 
              className={`tab-button ${activeTab === 'files' ? 'active' : ''}`}
              onClick={() => onTabChange('files')}
            >
              <svg viewBox="0 0 16 16" width="16" height="16">
                <path fillRule="evenodd" d="M3.75 1.5a.25.25 0 00-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V6H9.75A1.75 1.75 0 018 4.25V1.5H3.75zm5.75.56v2.19c0 .138.112.25.25.25h2.19L9.5 2.06zM2 1.75C2 .784 2.784 0 3.75 0h5.086c.464 0 .909.184 1.237.513l3.414 3.414c.329.328.513.773.513 1.237v8.086A1.75 1.75 0 0112.25 15h-8.5A1.75 1.75 0 012 13.25V1.75z"></path>
              </svg>
              Files
            </button>
            <button 
              className={`tab-button ${activeTab === 'branches' ? 'active' : ''}`}
              onClick={() => onTabChange('branches')}
            >
              <svg viewBox="0 0 16 16" width="16" height="16">
                <path fillRule="evenodd" d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110.5 8.5H1.75a.75.75 0 100 1.5h8.75A1 1 0 0111.5 11v-.128a2.25 2.25 0 112.5 0V12a1 1 0 01-1 1h-8.75a.75.75 0 100 1.5h8.75A2.5 2.5 0 0014 12v-1.028a2.25 2.25 0 01-2.25-3.72V6A2.5 2.5 0 0010.5 3.5h-1.25a.75.75 0 100-1.5h1.25a4 4 0 013.5 5.9 2.999 2.999 0 00-1.34-.392 4.003 4.003 0 00-3.66-5.008V2.75zm1.75 4.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-7 6a.75.75 0 100 1.5.75.75 0 000-1.5z"></path>
              </svg>
              Branches
            </button>
            <button 
              className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => onTabChange('upload')}
            >
              <svg viewBox="0 0 16 16" width="16" height="16">
                <path fillRule="evenodd" d="M8.53 1.22a.75.75 0 00-1.06 0L3.72 4.97a.75.75 0 001.06 1.06l2.47-2.47v6.69a.75.75 0 001.5 0V3.56l2.47 2.47a.75.75 0 101.06-1.06L8.53 1.22zM3.75 13a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5z"></path>
              </svg>
              Upload
            </button>
            <button 
              className={`tab-button ${activeTab === 'pulls' ? 'active' : ''}`}
              onClick={() => onTabChange('pulls')}
            >
              <svg viewBox="0 0 16 16" width="16" height="16">
                <path fillRule="evenodd" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"></path>
              </svg>
              Pull Requests
            </button>
            <button 
              className={`tab-button ${activeTab === 'issues' ? 'active' : ''}`}
              onClick={() => onTabChange('issues')}
            >
              <svg viewBox="0 0 16 16" width="16" height="16">
                <path fillRule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z"></path>
              </svg>
              Issues
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;