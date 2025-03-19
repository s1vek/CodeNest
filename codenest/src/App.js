// src/App.js (ne App.jsx)
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Header from './components/Header';
import RepoSelector from './components/RepoSelector';
import CommitHistory from './components/CommitHistory';
import FileViewer from './components/FileViewer';
import PullRequest from './components/PullRequest';
import './App.css';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [activeTab, setActiveTab] = useState('commits');

  const handleSelectRepo = (repo) => {
    setSelectedRepo(repo);
    setActiveTab('commits');
  };

  const handleBackToSelector = () => {
    setSelectedRepo(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Načítání aplikace...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header 
        selectedRepo={selectedRepo}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={handleBackToSelector}
      />
      
      <main className="app-content">
        {!isAuthenticated ? (
          <Login />
        ) : !selectedRepo ? (
          <RepoSelector onSelectRepo={handleSelectRepo} />
        ) : (
          <div className="repo-content">
            {activeTab === 'commits' && (
              <CommitHistory repository={selectedRepo} />
            )}
            
            {activeTab === 'files' && (
              <FileViewer repository={selectedRepo} />
            )}
            
            {activeTab === 'pulls' && (
              <PullRequest repository={selectedRepo} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;