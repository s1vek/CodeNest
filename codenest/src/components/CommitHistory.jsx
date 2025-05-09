import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import GitHubService from '../services/github';
import './CommitHistory.css';


const CommitHistory = forwardRef(({ repository }, ref) => {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [expandedCommit, setExpandedCommit] = useState(null);
  const [commitDetails, setCommitDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchCommits = useCallback(async () => {
    if (!repository) return;
    
    try {
      setLoading(true);
      const [owner, repo] = repository.full_name.split('/');
      const commitsData = await GitHubService.getCommits(owner, repo, page);
      setCommits(commitsData);
      setHasNextPage(commitsData.length === 10); 
    } catch (err) {
      setError('Nepodařilo se načíst commity');
    } finally {
      setLoading(false);
    }
  }, [repository, page]);

  useImperativeHandle(ref, () => ({
    refresh: () => {
      setExpandedCommit(null);
      setCommitDetails(null);
      fetchCommits();
    }
  }));

  useEffect(() => {
    if (!repository) return;
    fetchCommits();
  }, [repository, page, fetchCommits]);

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

  const getFileStatusClass = (status) => {
    switch (status) {
      case 'added': return 'file-added';
      case 'removed': return 'file-removed';
      case 'modified': return 'file-modified';
      case 'renamed': return 'file-renamed';
      default: return '';
    }
  };

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
        <div className="loading-indicator">Loading commits...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <div className="commits-list">
            {commits.length === 0 ? (
              <div className="no-commits">There are no commits in this repository</div>
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
                        <div className="loading-details">Loading commits...</div>
                      ) : commitDetails ? (
                        <>
                          <div className="commit-stats">
                            <div className="stats-item added">
                              <span className="stats-label">Added:</span>
                              <span className="stats-value">+{commitDetails.stats.additions}</span>
                            </div>
                            <div className="stats-item removed">
                              <span className="stats-label">Removed:</span>
                              <span className="stats-value">-{commitDetails.stats.deletions}</span>
                            </div>
                            <div className="stats-item total">
                              <span className="stats-label">Total files:</span>
                              <span className="stats-value">{commitDetails.files.length}</span>
                            </div>
                          </div>
                          
                          <div className="changed-files">
                            <h4>Changed files:</h4>
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
                        <div className="detail-error">Failed to load commit details</div>
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
              Previous
            </button>
            <span className="page-indicator">Page {page}</span>
            <button 
              className="pagination-button next"
              onClick={() => handlePageChange(page + 1)}
              disabled={!hasNextPage}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
});

export default CommitHistory;