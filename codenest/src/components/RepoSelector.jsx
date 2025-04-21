import React, { useState, useEffect } from 'react';
import GitHubService from '../services/github';
import './RepoSelector.css';

function RepoSelector({ onSelectRepo }) {
  const [repositories, setRepositories] = useState([]);
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  
  // States for repository creation
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [autoInit, setAutoInit] = useState(true);
  const [creatingRepo, setCreatingRepo] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const repos = await GitHubService.getRepositories();
      setRepositories(repos);
      setFilteredRepos(repos);
    } catch (err) {
      console.error("Error fetching repositories:", err);
      setError('Failed to load repositories. Check your connection or token.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRepos(repositories);
    } else {
      const filtered = repositories.filter(repo => 
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRepos(filtered);
    }
  }, [searchTerm, repositories]);
  
  useEffect(() => {
    if (createSuccess) {
      const timer = setTimeout(() => {
        setCreateSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [createSuccess]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Updated today';
    } else if (diffDays === 1) {
      return 'Updated yesterday';
    } else if (diffDays < 7) {
      return `Updated ${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Updated ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return `Updated on ${date.toLocaleDateString()}`;
    }
  };

  const getLanguageColor = (language) => {
    if (!language) return '#8f8f8f';
    
    const colors = {
      JavaScript: '#f1e05a',
      TypeScript: '#2b7489',
      HTML: '#e34c26',
      CSS: '#563d7c',
      Python: '#3572A5',
      Java: '#b07219',
      PHP: '#4F5D95',
      Ruby: '#701516',
      Go: '#00ADD8',
      C: '#555555',
      'C++': '#f34b7d',
      'C#': '#178600',
      Swift: '#ffac45',
      Kotlin: '#F18E33',
      Rust: '#dea584',
      Scala: '#c22d40',
      Dart: '#00B4AB',
      Elixir: '#6e4a7e',
    };
    
    return colors[language] || '#8f8f8f';
  };
  
  const toggleCreateForm = () => {
    setIsCreatingRepo(!isCreatingRepo);
    setCreateError(null);
    
    if (!isCreatingRepo) {
      setNewRepoName('');
      setNewRepoDesc('');
      setIsPrivate(false);
      setAutoInit(true);
    }
  };
  
  const handleCreateRepo = async (e) => {
    e.preventDefault();
    
    if (!newRepoName.trim()) {
      setCreateError('Repository name is required');
      return;
    }
    
    const namePattern = /^[a-zA-Z0-9._-]+$/;
    if (!namePattern.test(newRepoName)) {
      setCreateError('Repository name can only contain letters, numbers, dots, hyphens and underscores');
      return;
    }
    
    try {
      setCreatingRepo(true);
      setCreateError(null);
      
      const newRepo = await GitHubService.createRepository(
        newRepoName.trim(),
        newRepoDesc,
        isPrivate,
        autoInit
      );
      
      setRepositories([newRepo, ...repositories]);
      
      setCreateSuccess(`Repository "${newRepo.name}" was successfully created`);
      setNewRepoName('');
      setNewRepoDesc('');
      setIsPrivate(false);
      setAutoInit(true);
      setIsCreatingRepo(false);
      
    } catch (err) {
      console.error("Error creating repository:", err);
      setCreateError(`Failed to create repository: ${err.message}`);
    } finally {
      setCreatingRepo(false);
    }
  };

  return (
    <div className="repo-selector">
      <h2>Select the repository you want to work with</h2>
      
      {createSuccess && (
        <div className="success-message">
          <span className="success-icon">✓</span> {createSuccess}
        </div>
      )}
      
      <div className="repo-selector-controls">
        {!isCreatingRepo ? (
          <>
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button 
              className="create-repo-button"
              onClick={toggleCreateForm}
            >
              <svg viewBox="0 0 16 16" width="16" height="16" className="plus-icon">
                <path fillRule="evenodd" d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 110 1.5H8.5v4.25a.75.75 0 11-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z"></path>
              </svg>
              New Repository
            </button>
          </>
        ) : (
          <button 
            className="back-button"
            onClick={toggleCreateForm}
          >
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z"></path>
            </svg>
            Back to list
          </button>
        )}
      </div>

      {isCreatingRepo ? (
        <div className="create-repo-form">
          <h3>Create New Repository</h3>
          
          {createError && (
            <div className="error-message">
              <span className="error-icon">⚠</span> {createError}
            </div>
          )}
          
          <form onSubmit={handleCreateRepo}>
            <div className="form-group">
              <label htmlFor="repo-name">Repository Name:</label>
              <input
                id="repo-name"
                type="text"
                value={newRepoName}
                onChange={(e) => setNewRepoName(e.target.value)}
                placeholder="e.g., my-project"
                className="form-control"
                disabled={creatingRepo}
                required
              />
              <small className="form-hint">
                Use only letters, numbers, hyphens and underscores
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="repo-description">Description (optional):</label>
              <textarea
                id="repo-description"
                value={newRepoDesc}
                onChange={(e) => setNewRepoDesc(e.target.value)}
                placeholder="Brief description of your project..."
                className="form-control"
                rows={3}
                disabled={creatingRepo}
              ></textarea>
            </div>
            
            <div className="form-group visibility-group">
              <div className="visibility-label">Visibility:</div>
              <div className="visibility-options">
                <label className="visibility-option">
                  <input
                    type="radio"
                    name="visibility"
                    checked={!isPrivate}
                    onChange={() => setIsPrivate(false)}
                    disabled={creatingRepo}
                  />
                  <div className="option-content">
                    <div className="option-title">Public</div>
                    <div className="option-description">
                      Anyone can see this repository. You choose who can commit.
                    </div>
                  </div>
                </label>
                
                <label className="visibility-option">
                  <input
                    type="radio"
                    name="visibility"
                    checked={isPrivate}
                    onChange={() => setIsPrivate(true)}
                    disabled={creatingRepo}
                  />
                  <div className="option-content">
                    <div className="option-title">Private</div>
                    <div className="option-description">
                      You choose who can see and commit to this repository.
                    </div>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={autoInit}
                  onChange={(e) => setAutoInit(e.target.checked)}
                  disabled={creatingRepo}
                />
                <div className="option-content">
                  <div className="option-title">Initialize this repository with a README</div>
                  <div className="option-description">
                    This will let you immediately clone the repository to your computer.
                  </div>
                </div>
              </label>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button"
                onClick={toggleCreateForm}
                disabled={creatingRepo}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={creatingRepo}
              >
                {creatingRepo ? 'Creating...' : 'Create Repository'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="loading-indicator">
              <div className="loading-spinner"></div>
              <p>Loading repositories...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <span className="error-icon">⚠</span> {error}
            </div>
          ) : (
            <div className="repositories-list">
              {filteredRepos.length === 0 ? (
                <div className="no-repos">
                  {searchTerm ? (
                    <p>No repositories matching your search.</p>
                  ) : (
                    <>
                      <p>You don't have any repositories yet.</p>
                      <button 
                        className="create-first-repo-button"
                        onClick={toggleCreateForm}
                      >
                        <svg viewBox="0 0 16 16" width="16" height="16" className="plus-icon">
                          <path fillRule="evenodd" d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 110 1.5H8.5v4.25a.75.75 0 11-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z"></path>
                        </svg>
                        Create your first repository
                      </button>
                    </>
                  )}
                </div>
              ) : (
                filteredRepos.map(repo => (
                  <div 
                    key={repo.id} 
                    className="repo-item" 
                    onClick={() => onSelectRepo(repo)}
                  >
                    <div className="repo-header">
                      <div className="repo-name">
                        <svg viewBox="0 0 16 16" width="16" height="16" className="repo-icon">
                          <path fillRule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9.5h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"></path>
                        </svg>
                        {repo.name}
                      </div>
                      {repo.private && (
                        <div className="repo-visibility">
                          <svg viewBox="0 0 16 16" width="16" height="16">
                            <path fillRule="evenodd" d="M4 4v2h-.25A1.75 1.75 0 002 7.75v5.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 13.25v-5.5A1.75 1.75 0 0012.25 6H12V4a4 4 0 10-8 0zm6.5 2V4a2.5 2.5 0 00-5 0v2h5zM12 7.5h.25a.25.25 0 01.25.25v5.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-5.5a.25.25 0 01.25-.25H12z"></path>
                          </svg>
                          Private
                        </div>
                      )}
                    </div>
                    
                    {repo.description && (
                      <div className="repo-description">{repo.description}</div>
                    )}
                    
                    <div className="repo-details">
                      {repo.language && (
                        <span className="repo-language">
                          <span 
                            className="language-color" 
                            style={{ backgroundColor: getLanguageColor(repo.language) }}
                          ></span>
                          {repo.language}
                        </span>
                      )}
                      
                      <span className="repo-stars">
                        <svg viewBox="0 0 16 16" width="16" height="16">
                          <path fillRule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"></path>
                        </svg>
                        {repo.stargazers_count}
                      </span>
                      
                      <span className="repo-updated">
                        {formatDate(repo.updated_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default RepoSelector;