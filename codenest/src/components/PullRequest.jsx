import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import GitHubService from '../services/github';
import PullRequestCreator from './PullRequestCreator';
import './PullRequest.css';


const PullRequest = forwardRef(({ repository }, ref) => {
  const [pullRequests, setPullRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPR, setExpandedPR] = useState(null);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchPullRequests = useCallback(async () => {
    if (!repository) return;
    
    try {
      setLoading(true);
      const [owner, repo] = repository.full_name.split('/');
      const prs = await GitHubService.getPullRequests(owner, repo);
      setPullRequests(prs);
    } catch (err) {
      console.error('Error loading pull requests:', err);
      setError('Failed to load pull requests');
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useImperativeHandle(ref, () => ({
    refresh: () => {
      setExpandedPR(null);
      setError(null);
      fetchPullRequests();
    }
  }));

  useEffect(() => {
    fetchPullRequests();
  }, [fetchPullRequests]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const togglePRDetails = (prNumber) => {
    if (expandedPR === prNumber) {
      setExpandedPR(null);
    } else {
      setExpandedPR(prNumber);
    }
  };

  const toggleCreatePR = () => {
    setIsCreatingPR(!isCreatingPR);
    setExpandedPR(null);
  };

  const handlePullRequestCreated = (newPR) => {
    setPullRequests([newPR, ...pullRequests]);
  };

  const handleClosePullRequest = async (pr) => {
    if (!window.confirm(`Opravdu chcete zavřít pull request #${pr.number}?`)) {
      return;
    }
    
    try {
      setActionLoading(pr.number);
      setError(null);
      
      const [owner, repo] = repository.full_name.split('/');
      
      const closedPR = await GitHubService.closePullRequest(
        owner,
        repo,
        pr.number
      );
      
      setPullRequests(
        pullRequests.map(existingPR => 
          existingPR.number === pr.number ? closedPR : existingPR
        )
      );
      
      setSuccessMessage(`Pull request #${pr.number} byl úspěšně uzavřen`);
    } catch (err) {
      console.error('Error closing pull request:', err);
      setError(`Nepodařilo se zavřít pull request: ${err.message}`);
    } finally {
      setActionLoading(null);
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
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getPRStatusClass = (state, merged) => {
    if (merged) return 'status-merged';
    switch (state) {
      case 'open': return 'status-open';
      case 'closed': return 'status-closed';
      default: return '';
    }
  };

  const getPRStatusIcon = (state, merged) => {
    if (merged) {
      return (
        <svg viewBox="0 0 16 16" width="16" height="16" className="pr-icon merged-icon">
          <path fillRule="evenodd" d="M5 3.254V3.25v.005a.75.75 0 110-.005v.004zm.45 1.9a2.25 2.25 0 10-1.95.218v5.256a2.25 2.25 0 101.5 0V7.123A5.735 5.735 0 009.25 9h1.378a2.251 2.251 0 100-1.5H9.25a4.25 4.25 0 01-3.8-2.346zM12.75 9a.75.75 0 100-1.5.75.75 0 000 1.5zm-8.5 4.5a.75.75 0 100-1.5.75.75 0 000 1.5zm0-11.5a.75.75 0 100 1.5.75.75 0 000-1.5z"></path>
        </svg>
      );
    } else if (state === 'open') {
      return (
        <svg viewBox="0 0 16 16" width="16" height="16" className="pr-icon open-icon">
          <path fillRule="evenodd" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"></path>
        </svg>
      );
    } else {
      return (
        <svg viewBox="0 0 16 16" width="16" height="16" className="pr-icon closed-icon">
          <path fillRule="evenodd" d="M10.72 1.227a.75.75 0 00-1.06 0L.5 10.386a.75.75 0 001.06 1.061l9.16-9.159a.75.75 0 000-1.061zM12.75 3.75a.75.75 0 00-1.5 0v3.75a.75.75 0 001.5 0V3.75zm-8.5 4.5a.75.75 0 00-1.5 0v3.75a.75.75 0 001.5 0V8.25z"></path>
        </svg>
      );
    }
  };

  const getPRStatusText = (state, merged) => {
    if (merged) return 'Merged';
    return state.charAt(0).toUpperCase() + state.slice(1);
  };

  if (!repository) {
    return (
      <div className="pull-request empty-state">
        <p>Select a repository to view pull requests</p>
      </div>
    );
  }

  return (
    <div className="pull-request">
      <h2>Pull Requests</h2>
      
      <div className="pr-controls">
        <button 
          className="create-pr-toggle-button"
          onClick={toggleCreatePR}
        >
          {isCreatingPR ? 'View Pull Requests' : 'Create Pull Request'}
        </button>
      </div>
      
      {successMessage && (
        <div className="pr-success-message">
          <span className="success-icon">✓</span> {successMessage}
        </div>
      )}
      
      {isCreatingPR ? (
        <PullRequestCreator 
          repository={repository} 
          onPullRequestCreated={handlePullRequestCreated}
        />
      ) : (
        <>
          {loading ? (
            <div className="loading-indicator">Loading pull requests...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="pr-list">
              {pullRequests.length === 0 ? (
                <div className="no-prs">
                  This repository doesn't have any pull requests
                  <button 
                    className="create-first-pr-button"
                    onClick={toggleCreatePR}
                  >
                    Create your first Pull Request
                  </button>
                </div>
              ) : (
                pullRequests.map(pr => (
                  <div 
                    key={pr.id} 
                    className={`pr-item ${expandedPR === pr.number ? 'expanded' : ''}`}
                  >
                    <div className="pr-header" onClick={() => togglePRDetails(pr.number)}>
                      <div className="pr-title-container">
                        {getPRStatusIcon(pr.state, pr.merged)}
                        <span className="pr-title">{pr.title}</span>
                      </div>
                      
                      <div className="pr-meta">
                        <span className={`pr-status ${getPRStatusClass(pr.state, pr.merged)}`}>
                          {getPRStatusText(pr.state, pr.merged)}
                        </span>
                        <span className="pr-number">#{pr.number}</span>
                      </div>
                    </div>
                    
                    <div className="pr-info">
                      <div className="pr-author">
                        <img 
                          src={pr.user?.avatar_url} 
                          alt={pr.user?.login} 
                          className="author-avatar"
                        />
                        <span>{pr.user?.login}</span> opened this pull request on {formatDate(pr.created_at)}
                      </div>
                    </div>
                    
                    {expandedPR === pr.number && (
                      <div className="pr-details">
                        <div className="pr-description">
                          {pr.body ? (
                            <p>{pr.body}</p>
                          ) : (
                            <p className="no-description">No description provided</p>
                          )}
                        </div>
                        
                        <div className="pr-branch-info">
                          <div className="branch-details">
                            <span className="from-branch">{pr.head.ref}</span>
                            <span className="arrow-icon">→</span>
                            <span className="to-branch">{pr.base.ref}</span>
                          </div>
                        </div>
                        
                        <div className="pr-stats">
                          <div className="stats-item">
                            <svg viewBox="0 0 16 16" width="16" height="16">
                              <path fillRule="evenodd" d="M1.5 2.75a.25.25 0 01.25-.25h12.5a.25.25 0 01.25.25v10.5a.25.25 0 01-.25.25H1.75a.25.25 0 01-.25-.25V2.75zM1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25V2.75A1.75 1.75 0 0014.25 1H1.75z"></path><path fillRule="evenodd" d="M3.5 5.75c0-.69.56-1.25 1.25-1.25h6.5a1.25 1.25 0 110 2.5h-6.5A1.25 1.25 0 013.5 5.75zM3.5 9.25c0-.69.56-1.25 1.25-1.25h6.5a1.25 1.25 0 110 2.5h-6.5A1.25 1.25 0 013.5 9.25z"></path>
                            </svg>
                            <span className="stats-label">Commits:</span>
                            <span className="stats-value">{pr.commits}</span>
                          </div>
                          <div className="stats-item">
                            <svg viewBox="0 0 16 16" width="16" height="16">
                              <path fillRule="evenodd" d="M3.75 1.5a.25.25 0 00-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V6H9.75A1.75 1.75 0 018 4.25V1.5H3.75zm5.75.56v2.19c0 .138.112.25.25.25h2.19L9.5 2.06zM2 1.75C2 .784 2.784 0 3.75 0h5.086c.464 0 .909.184 1.237.513l3.414 3.414c.329.328.513.773.513 1.237v8.086A1.75 1.75 0 0112.25 15h-8.5A1.75 1.75 0 012 13.25V1.75z"></path>
                            </svg>
                            <span className="stats-label">Files:</span>
                            <span className="stats-value">{pr.changed_files}</span>
                          </div>
                          <div className="stats-item additions">
                            <svg viewBox="0 0 16 16" width="16" height="16">
                              <path fillRule="evenodd" d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 110 1.5H8.5v4.25a.75.75 0 11-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z"></path>
                            </svg>
                            <span className="stats-label">Additions:</span>
                            <span className="stats-value">+{pr.additions}</span>
                          </div>
                          <div className="stats-item deletions">
                            <svg viewBox="0 0 16 16" width="16" height="16">
                              <path fillRule="evenodd" d="M2.75 7.5a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H2.75z"></path>
                            </svg>
                            <span className="stats-label">Deletions:</span>
                            <span className="stats-value">-{pr.deletions}</span>
                          </div>
                        </div>

                        <div className="pr-actions">
                          {pr.state === 'open' && (
                            <button 
                              className="close-pr-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClosePullRequest(pr);
                              }}
                              disabled={actionLoading === pr.number}
                            >
                              {actionLoading === pr.number ? 'Closing...' : 'Close Pull Request'}
                            </button>
                          )}
                          
                          {pr.html_url && (
                            <a 
                              href={pr.html_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="view-on-github"
                            >
                              View on GitHub
                              <svg viewBox="0 0 16 16" width="12" height="12">
                                <path fillRule="evenodd" d="M10.604 1h4.146a.25.25 0 01.25.25v4.146a.25.25 0 01-.427.177L13.03 4.03 9.28 7.78a.75.75 0 01-1.06-1.06l3.75-3.75-1.543-1.543A.25.25 0 0110.604 1zM3.75 2A1.75 1.75 0 002 3.75v8.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 12.25v-3.5a.75.75 0 00-1.5 0v3.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-8.5a.25.25 0 01.25-.25h3.5a.75.75 0 000-1.5h-3.5z"></path>
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default PullRequest;