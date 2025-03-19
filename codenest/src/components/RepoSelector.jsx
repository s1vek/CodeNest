// src/components/RepoSelector.jsx
import React, { useState, useEffect } from 'react';
import GitHubService from '../services/github';
import './RepoSelector.css';

/**
 * Komponenta pro výběr repozitáře ze seznamu
 * @param {Object} props - Props komponenty
 * @param {Function} props.onSelectRepo - Callback funkce volaná při výběru repozitáře
 * @returns {JSX.Element} RepoSelector komponenta
 */
function RepoSelector({ onSelectRepo }) {
  // State pro seznam repozitářů, filtrování a načítání
  const [repositories, setRepositories] = useState([]);
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Načtení seznamu repozitářů při prvním renderu
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

  // Filtrování repozitářů podle vyhledávacího dotazu
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
        <div className="loading-indicator">Načítání repozitářů...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="repositories-list">
          {filteredRepos.length === 0 ? (
            <div className="no-repos">Nenalezeny žádné repozitáře</div>
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
                  
                  <span className="repo-forks">
                    <svg viewBox="0 0 16 16" width="16" height="16">
                      <path fillRule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"></path>
                    </svg>
                    {repo.forks_count}
                  </span>
                  
                  <span className="repo-updated">
                    Aktualizováno: {formatDate(repo.updated_at)}
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

/**
 * Pomocná funkce pro získání barvy programovacího jazyka
 * @param {string} language - Název jazyka
 * @returns {string} Barva pro daný jazyk
 */
function getLanguageColor(language) {
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
}

/**
 * Formátování data
 * @param {string} dateString - ISO formát data
 * @returns {string} Formátované datum
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'dnes';
  } else if (diffDays === 1) {
    return 'včera';
  } else if (diffDays < 7) {
    return `před ${diffDays} dny`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `před ${weeks} ${weeks === 1 ? 'týdnem' : 'týdny'}`;
  } else {
    return date.toLocaleDateString('cs-CZ');
  }
}

export default RepoSelector;