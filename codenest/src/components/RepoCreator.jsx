import React, { useState } from 'react';
import GitHubService from '../services/github';
import './RepoCreator.css';

function RepoCreator({ onRepoCreated, onCancel }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [autoInit, setAutoInit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Repository name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const repo = await GitHubService.createRepository(
        name.trim(),
        description,
        isPrivate,
        autoInit
      );
      
      if (onRepoCreated) {
        onRepoCreated(repo);
      }
    } catch (err) {
      console.error('Error creating repository:', err);
      setError(`Failed to create repository: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="repo-creator">
      <h2>Create New Repository</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form className="repo-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="repo-name">Repository Name:</label>
          <input
            id="repo-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., my-awesome-project"
            className="repo-name-input"
            disabled={loading}
            required
          />
          <span className="form-hint">
            Use only letters, numbers, hyphens, and underscores
          </span>
        </div>
        
        <div className="form-group">
          <label htmlFor="repo-description">Description (optional):</label>
          <textarea
            id="repo-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of your project..."
            className="repo-description-input"
            rows={3}
            disabled={loading}
          ></textarea>
        </div>
        
        <div className="form-group visibility-options">
          <span className="visibility-label">Visibility:</span>
          <div className="radio-options">
            <label className="radio-label">
              <input
                type="radio"
                name="visibility"
                checked={!isPrivate}
                onChange={() => setIsPrivate(false)}
                disabled={loading}
              />
              Public
              <span className="radio-description">
                Anyone can see this repository. You choose who can commit.
              </span>
            </label>
            
            <label className="radio-label">
              <input
                type="radio"
                name="visibility"
                checked={isPrivate}
                onChange={() => setIsPrivate(true)}
                disabled={loading}
              />
              Private
              <span className="radio-description">
                You choose who can see and commit to this repository.
              </span>
            </label>
          </div>
        </div>
        
        <div className="form-group checkbox-option">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoInit}
              onChange={(e) => setAutoInit(e.target.checked)}
              disabled={loading}
            />
            Initialize this repository with a README
            <span className="checkbox-description">
              This will let you immediately clone the repository to your computer.
            </span>
          </label>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="create-button"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Repository'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RepoCreator;