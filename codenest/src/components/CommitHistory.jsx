// src/components/CommitHistory.jsx
import React, { useState, useEffect } from 'react';
import GitHubService from '../services/github';
import './CommitHistory.css';

/**
 * Komponenta pro zobrazení historie commitů
 * @param {Object} props - Props komponenty
 * @param {Object} props.repository - Data vybraného repozitáře
 * @returns {JSX.Element} CommitHistory komponenta
 */
function CommitHistory({ repository }) {
  // State pro commity, načítání, chyby a stránkování
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [expandedCommit, setExpandedCommit] = useState(null);
  const [commitDetails, setCommitDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Načtení commitů při změně repozitáře nebo stránky
  useEffect(() => {
    if (!repository) return;

    async function fetchCommits() {
      try {
        setLoading(true);
        const [owner, repo] = repository.full_name.split('/');
        const commitsData = await GitHubService.getCommits(owner, repo, page);
        setCommits(commitsData);
        setHasNextPage(commitsData.length === 10); // Pokud je 10 commitů, předpokládáme, že existuje další stránka
      } catch (err) {
        setError('Nepodařilo se načíst commity');
      } finally {
        setLoading(false);
      }
    }

    fetchCommits();
  }, [repository, page]);

  // Změna stránky
  const handlePageChange = (newPage) => {
    setPage(newPage);
    setExpandedCommit(null);
    setCommitDetails(null);
  };

  // Zobrazení detailů commitu
  const handleCommitClick = async (commitSha) => {
    if (expandedCommit === commitSha) {
      setExpandedCommit(null);
      setCommitDetails(null);
      return;
    }

    setExpandedCommit(commitSha);
    setLoadingDetails(true);

    try {
      const [owner, repo] = repository.full_name.split('/');
      const details = await GitHubService.getCommitDetails(owner, repo, commitSha);
      setCommitDetails(details);
    } catch (err) {
      console.error('Chyba při načítání detailů commitu:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Formátování data
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('cs-CZ', options);
  };

  // Získání třídy CSS podle typu změny souboru
  const getFileStatusClass = (status) => {
    switch (status) {
      case 'added': return 'file-added';
      case 'removed': return 'file-removed';
      case 'modified': return 'file-modified';
      case 'renamed': return 'file-renamed';
      default: return '';
    }
  };

  // Zkrácení SHA commitu
  const shortenSha = (sha) => sha.substring(0, 7);

  if (!repository) {
    return (
      <div className="commit-history empty-state">
        <p>Vyberte repozitář pro zobrazení historie commitů</p>
      </div>
    );
  }

  return (
    <div className="commit-history">
      <h2>Commit History</h2>
      
      {loading ? (
        <div className="loading-indicator">Načítání commitů...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <div className="commits-list">
            {commits.length === 0 ? (
              <div className="no-commits">Tento repozitář nemá žádné commity</div>
            ) : (
              commits.map((commit) => (
                <div 
                  key={commit.sha} 
                  className={`commit-item ${expandedCommit === commit.sha ? 'expanded' : ''}`}
                  onClick={() => handleCommitClick(commit.sha)}
                >
                  <div className="commit-header">
                    <div className="commit-title">{commit.commit.message}</div>
                    <div className="commit-meta">
                      <span className="commit-sha">{shortenSha(commit.sha)}</span>
                      <span className="commit-date">{formatDate(commit.commit.author.date)}</span>
                    </div>
                  </div>
                  
                  <div className="commit-author">
                    <img 
                      src={commit.author?.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'} 
                      alt={commit.commit.author.name} 
                      className="author-avatar" 
                    />
                    <span className="author-name">{commit.commit.author.name}</span>
                  </div>
                  
                  {expandedCommit === commit.sha && (
                    <div className="commit-details">
                      {loadingDetails ? (
                        <div className="loading-details">Načítání detailů commitu...</div>
                      ) : commitDetails ? (
                        <>
                          <div className="commit-stats">
                            <div className="stats-item added">
                              <span className="stats-label">Přidáno:</span>
                              <span className="stats-value">+{commitDetails.stats.additions}</span>
                            </div>
                            <div className="stats-item removed">
                              <span className="stats-label">Odebráno:</span>
                              <span className="stats-value">-{commitDetails.stats.deletions}</span>
                            </div>
                            <div className="stats-item total">
                              <span className="stats-label">Celkem souborů:</span>
                              <span className="stats-value">{commitDetails.files.length}</span>
                            </div>
                          </div>
                          
                          <div className="changed-files">
                            <h4>Změněné soubory:</h4>
                            <ul className="files-list">
                              {commitDetails.files.map((file, index) => (
                                <li key={index} className={`file-item ${getFileStatusClass(file.status)}`}>
                                  <span className="file-status-icon">
                                    {file.status === 'added' && '+'}
                                    {file.status === 'removed' && '-'}
                                    {file.status === 'modified' && '•'}
                                    {file.status === 'renamed' && '↺'}
                                  </span>
                                  <span className="file-name">{file.filename}</span>
                                  <span className="file-changes">
                                    {file.additions > 0 && <span className="additions">+{file.additions}</span>}
                                    {file.deletions > 0 && <span className="deletions">-{file.deletions}</span>}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <div className="detail-error">Nepodařilo se načíst detaily commitu</div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="pagination">
            <button 
              className="pagination-button prev"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              Předchozí
            </button>
            <span className="page-indicator">Stránka {page}</span>
            <button 
              className="pagination-button next"
              onClick={() => handlePageChange(page + 1)}
              disabled={!hasNextPage}
            >
              Další
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CommitHistory;