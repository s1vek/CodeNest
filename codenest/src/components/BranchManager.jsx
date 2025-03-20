// src/components/BranchManager.jsx
import React, { useState, useEffect } from 'react';
import GitHubService from '../services/github';
import './BranchManager.css';

/**
 * Komponenta pro správu větví repozitáře
 * @param {Object} props - Props komponenty
 * @param {Object} props.repository - Data vybraného repozitáře
 * @param {Function} props.onBranchSelect - Callback při výběru větve
 * @param {String} props.currentBranch - Aktuálně vybraná větev
 * @returns {JSX.Element} BranchManager komponenta
 */
function BranchManager({ repository, onBranchSelect, currentBranch }) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [baseBranch, setBaseBranch] = useState('');
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(null);

  // Načtení větví při změně repozitáře
  useEffect(() => {
    if (!repository) return;

    async function fetchBranches() {
      try {
        setLoading(true);
        const [owner, repo] = repository.full_name.split('/');
        const branchesData = await GitHubService.getBranches(owner, repo);
        setBranches(branchesData);
        
        // Pokud není vybraná větev, nastavíme výchozí
        if (!currentBranch && branchesData.length > 0) {
          const defaultBranch = branchesData.find(branch => branch.name === repository.default_branch) 
            || branchesData[0];
          if (onBranchSelect) {
            onBranchSelect(defaultBranch.name);
          }
          setBaseBranch(defaultBranch.name);
        } else if (branchesData.length > 0) {
          setBaseBranch(repository.default_branch || branchesData[0].name);
        }
      } catch (err) {
        console.error('Error loading branches:', err);
        setError('Failed to load branches');
      } finally {
        setLoading(false);
      }
    }

    fetchBranches();
  }, [repository, currentBranch, onBranchSelect]);

  // Zpracování vytvoření nové větve
  const handleCreateBranch = async (e) => {
    e.preventDefault();
    
    if (!newBranchName.trim()) {
      setError('Branch name is required');
      return;
    }

    if (!baseBranch) {
      setError('Base branch is required');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      setSuccess(null);
      
      const [owner, repo] = repository.full_name.split('/');
      
      await GitHubService.createBranch(
        owner,
        repo,
        newBranchName.trim(),
        baseBranch
      );
      
      // Refresh branch list
      const branchesData = await GitHubService.getBranches(owner, repo);
      setBranches(branchesData);
      
      setSuccess(`Branch "${newBranchName}" created successfully`);
      setNewBranchName('');
      setIsCreatingBranch(false);
      
      // Automatically select the new branch
      if (onBranchSelect) {
        onBranchSelect(newBranchName.trim());
      }
      
    } catch (err) {
      console.error('Error creating branch:', err);
      setError(`Failed to create branch: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="branch-manager">
      <div className="branch-manager-header">
        <h3>Branch Manager</h3>
        <button 
          className="create-branch-button"
          onClick={() => setIsCreatingBranch(!isCreatingBranch)}
        >
          {isCreatingBranch ? 'Cancel' : 'Create New Branch'}
        </button>
      </div>
      
      {error && (
        <div className="branch-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="branch-success">
          {success}
        </div>
      )}
      
      {isCreatingBranch && (
        <div className="create-branch-form">
          <form onSubmit={handleCreateBranch}>
            <div className="form-group">
              <label htmlFor="new-branch-name">New Branch Name:</label>
              <input
                id="new-branch-name"
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="feature/new-feature"
                className="branch-name-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="base-branch">Base Branch:</label>
              <select
                id="base-branch"
                value={baseBranch}
                onChange={(e) => setBaseBranch(e.target.value)}
                className="branch-select"
                required
              >
                <option value="">Select base branch</option>
                {branches.map(branch => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-button"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Branch'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="branch-list-container">
        <h4>Available Branches</h4>
        
        {loading ? (
          <div className="loading-indicator">Loading branches...</div>
        ) : branches.length === 0 ? (
          <div className="no-branches">No branches found</div>
        ) : (
          <div className="branch-list">
            {branches.map(branch => (
              <div 
                key={branch.name} 
                className={`branch-item ${currentBranch === branch.name ? 'selected' : ''}`}
                onClick={() => onBranchSelect && onBranchSelect(branch.name)}
              >
                <div className="branch-icon">
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fillRule="evenodd" d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110.5 8.5H1.75a.75.75 0 100 1.5h8.75A1 1 0 0111.5 11v-.128a2.25 2.25 0 112.5 0V12a1 1 0 01-1 1h-8.75a.75.75 0 100 1.5h8.75A2.5 2.5 0 0014 12v-1.028a2.25 2.25 0 01-2.25-3.72V6A2.5 2.5 0 0010.5 3.5h-1.25a.75.75 0 100-1.5h1.25a4 4 0 013.5 5.9 2.999 2.999 0 00-1.34-.392 4.003 4.003 0 00-3.66-5.008V2.75zm1.75 4.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-7 6a.75.75 0 100 1.5.75.75 0 000-1.5z"></path>
                  </svg>
                </div>
                <span className="branch-name">{branch.name}</span>
                {branch.name === repository.default_branch && (
                  <span className="default-badge">default</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BranchManager;