import React, { useState, useEffect } from 'react';
import GitHubService from '../services/github';
import './RepoSelector.css';


function RepoSelector({ onSelectRepo }) {
  const [repositories, setRepositories] = useState([]);
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRepositories() {
      try {
        setLoading(true);
        const repos = await GitHubService.getRepositories();
        setRepositories(repos);
        setFilteredRepos(repos);
      } catch (err) {
        setError('Nepodařilo se načíst repozitáře');
      } finally {
        setLoading(false);
      }
    }

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Aktualizováno: dnes';
    } else if (diffDays === 1) {
      return 'Aktualizováno: včera';
    } else if (diffDays < 7) {
      return `Aktualizováno: před ${diffDays} dny`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Aktualizováno: před ${weeks} ${weeks === 1 ? 'týdnem' : 'týdny'}`;
    } else {
      return `Aktualizováno: ${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
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

  return (
    <div className="repo-selector">
      <h2>Select the repository you want to work with</h2>
      
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="list repozitářů toho uživatele..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-indicator">Loading repositories...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="repositories-list">
          {filteredRepos.length === 0 ? (
            <div className="no-repos">No repositories found</div>
          ) : (
            filteredRepos.map(repo => (
              <div 
                key={repo.id} 
                className="repo-item" 
                onClick={() => onSelectRepo(repo)}
              >
                <div className="repo-name">{repo.name}</div>
                {repo.description && (
                  <div className="repo-description">{repo.description}</div>
                )}
                <div className="repo-details">
                  <span className="repo-language">
                    {repo.language && (
                      <>
                        <span 
                          className="language-color" 
                          style={{ backgroundColor: getLanguageColor(repo.language) }}
                        ></span>
                        {repo.language}
                      </>
                    )}
                  </span>
                  
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
    </div>
  );
}

export default RepoSelector;