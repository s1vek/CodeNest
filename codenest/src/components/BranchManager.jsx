
import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import GitHubService from '../services/github';
import './BranchManager.css';

const BranchManager = forwardRef(({ repository, onBranchSelect, currentBranch }, ref) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [baseBranch, setBaseBranch] = useState('');
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(null);
  const [deletingBranch, setDeletingBranch] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const fetchBranches = useCallback(async () => {
    if (!repository) return;
    
    try {
      setLoading(true);
      const [owner, repo] = repository.full_name.split('/');
      const branchesData = await GitHubService.getBranches(owner, repo);
      setBranches(branchesData);
      
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
  }, [repository, currentBranch, onBranchSelect]);

  useImperativeHandle(ref, () => ({
    refresh: () => {
      setDeleteError(null);
      setShowDeleteConfirm(null);
      fetchBranches();
    }
  }));


  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);


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
      
      await fetchBranches();
      
      setSuccess(`Branch "${newBranchName}" created successfully`);
      setNewBranchName('');
      setIsCreatingBranch(false);

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

  const handleDeleteBranch = async (branchName) => {
    try {
      setDeletingBranch(branchName);
      setDeleteError(null);
      
      const [owner, repo] = repository.full_name.split('/');
      
      if (branchName === repository.default_branch) {
        setDeleteError('Cannot delete the default branch');
        return;
      }
      

      try {
        const isProtected = await GitHubService.isBranchProtected(owner, repo, branchName);
        if (isProtected) {
          setDeleteError('Cannot delete a protected branch');
          return;
        }
      } catch (err) {
        console.log('Protection check error, continuing with delete attempt');
      }
      
      await GitHubService.deleteBranch(owner, repo, branchName);
      
      await fetchBranches();
      
      if (currentBranch === branchName && onBranchSelect) {
        onBranchSelect(repository.default_branch);
      }
      
      setSuccess(`Branch "${branchName}" was deleted successfully`);
      setShowDeleteConfirm(null);
      
    } catch (err) {
      console.error('Error deleting branch:', err);
      setDeleteError(`Failed to delete branch: ${err.message}`);
    } finally {
      setDeletingBranch(null);
    }
  };

  const confirmDeleteBranch = (branchName, e) => {
    e.stopPropagation();
    setDeleteError(null);
    setShowDeleteConfirm(branchName);
  };

  const cancelDeleteBranch = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(null);
    setDeleteError(null);
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
      
      {deleteError && (
        <div className="branch-error">
          {deleteError}
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
                
                <div className="branch-actions">
                  {branch.name === repository.default_branch && (
                    <span className="default-badge">default</span>
                  )}
                  
                  {branch.name !== repository.default_branch && (
                    showDeleteConfirm === branch.name ? (
                      <div className="delete-confirmation">
                        <span>Confirm delete?</span>
                        <button 
                          className="confirm-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBranch(branch.name);
                          }}
                          disabled={deletingBranch === branch.name}
                        >
                          {deletingBranch === branch.name ? 'Deleting...' : 'Yes'}
                        </button>
                        <button 
                          className="cancel-delete"
                          onClick={cancelDeleteBranch}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="delete-branch-button"
                        onClick={(e) => confirmDeleteBranch(branch.name, e)}
                        title="Delete branch"
                      >
                        <svg viewBox="0 0 16 16" width="12" height="12">
                          <path fillRule="evenodd" d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19c.9 0 1.652-.681 1.741-1.576l.66-6.6a.75.75 0 00-1.492-.149l-.66 6.6a.25.25 0 01-.249.225h-5.19a.25.25 0 01-.249-.225l-.66-6.6z"></path>
                        </svg>
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default BranchManager;