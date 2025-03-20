// src/App.js
import React, { useState, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Header from './components/Header';
import RepoSelector from './components/RepoSelector';
import CommitHistory from './components/CommitHistory';
import FileViewer from './components/FileViewer';
import PullRequest from './components/PullRequest';
import FileUpload from './components/FileUpload';
import BranchManager from './components/BranchManager';
import './App.css';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [activeTab, setActiveTab] = useState('commits');
  const [currentBranch, setCurrentBranch] = useState('');
  
  // Reference na komponenty pro vyvolání obnovení
  const commitsRef = useRef();
  const branchesRef = useRef();
  const filesRef = useRef();
  const pullsRef = useRef();

  const handleSelectRepo = (repo) => {
    setSelectedRepo(repo);
    setActiveTab('commits');
    // Resetujeme vybranou větev při změně repozitáře
    setCurrentBranch(repo.default_branch || '');
  };

  const handleBackToSelector = () => {
    setSelectedRepo(null);
  };

  // Callback pro výběr větve
  const handleBranchSelect = (branch) => {
    setCurrentBranch(branch);
  };

  // Funkce pro obnovení aktuální komponenty s vylepšeným debugováním
  const handleRefresh = useCallback((tab) => {
    const currentTab = tab || activeTab;
    console.log(`🔄 Refreshing ${currentTab} tab...`);
    
    // Funkce pro vyvolání fallback - pokud bude problém s referencemi
    const fallbackRefresh = () => {
      console.log("⚠️ Using fallback refresh (reload)");
      // Jako záloha použijeme úplné obnovení stránky
      window.location.reload();
    };
    
    // Zkusíme forceUpdate - mělo by vynutit překreslení komponenty
    try {
      switch (currentTab) {
        case 'commits':
          if (commitsRef.current && commitsRef.current.refresh) {
            commitsRef.current.refresh();
            console.log('✅ Commits refresh called');
          } else {
            console.warn('⚠️ CommitsRef or refresh method not available');
            fallbackRefresh();
          }
          break;
        case 'branches':
          if (branchesRef.current && branchesRef.current.refresh) {
            branchesRef.current.refresh();
            console.log('✅ Branches refresh called');
          } else {
            console.warn('⚠️ BranchesRef or refresh method not available');
            fallbackRefresh();
          }
          break;
        case 'files':
          if (filesRef.current && filesRef.current.refresh) {
            filesRef.current.refresh();
            console.log('✅ Files refresh called');
          } else {
            console.warn('⚠️ FilesRef or refresh method not available');
            fallbackRefresh();
          }
          break;
        case 'pulls':
          if (pullsRef.current && pullsRef.current.refresh) {
            pullsRef.current.refresh();
            console.log('✅ Pulls refresh called');
          } else {
            console.warn('⚠️ PullsRef or refresh method not available');
            fallbackRefresh();
          }
          break;
        default:
          // Pro ostatní záložky prostě obnovíme stránku
          console.log(`ℹ️ Refresh not implemented for tab: ${currentTab}`);
          fallbackRefresh();
          break;
      }
    } catch (error) {
      console.error("Error during refresh:", error);
      fallbackRefresh();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading app...</p>
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
        onRefresh={handleRefresh}
      />
      
      <main className="app-content">
        {!isAuthenticated ? (
          <Login />
        ) : !selectedRepo ? (
          <RepoSelector onSelectRepo={handleSelectRepo} />
        ) : (
          <div className="repo-content">
            {activeTab === 'commits' && (
              <CommitHistory 
                repository={selectedRepo} 
                ref={commitsRef}
              />
            )}
            
            {activeTab === 'files' && (
              <FileViewer 
                repository={selectedRepo}
                currentBranch={currentBranch}
                ref={filesRef}
              />
            )}
            
            {activeTab === 'branches' && (
              <BranchManager 
                repository={selectedRepo}
                onBranchSelect={handleBranchSelect}
                currentBranch={currentBranch}
                ref={branchesRef}
              />
            )}
            
            {activeTab === 'upload' && (
              <FileUpload 
                repository={selectedRepo}
                currentBranch={currentBranch}
              />
            )}
            
            {activeTab === 'pulls' && (
              <PullRequest 
                repository={selectedRepo} 
                ref={pullsRef}
              />
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