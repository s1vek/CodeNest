import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import GitHubService from '../services/github';
import IssueCreator from './IssueCreator';
import './Issues.css';

const Issues = forwardRef(({ repository }, ref) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [issueDetails, setIssueDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filter, setFilter] = useState('open');
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchIssues = useCallback(async () => {
    if (!repository) return;
    
    try {
      setLoading(true);
      const [owner, repo] = repository.full_name.split('/');
      const issuesData = await GitHubService.getIssues(owner, repo, filter);
      setIssues(issuesData);
    } catch (err) {
      console.error('Error loading issues:', err);
      setError('Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [repository, filter]);

  useImperativeHandle(ref, () => ({
    refresh: () => {
      setExpandedIssue(null);
      setIssueDetails(null);
      fetchIssues();
    }
  }));

  useEffect(() => {
    if (!repository) return;
    fetchIssues();
  }, [repository, filter, fetchIssues]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const toggleIssueDetails = async (issueNumber) => {
    if (expandedIssue === issueNumber) {
      setExpandedIssue(null);
      setIssueDetails(null);
      return;
    }

    setExpandedIssue(issueNumber);
    setLoadingDetails(true);

    try {
      const [owner, repo] = repository.full_name.split('/');
      const details = await GitHubService.getIssueDetails(owner, repo, issueNumber);
      
      const comments = await GitHubService.getIssueComments(owner, repo, issueNumber);
      
      setIssueDetails({ ...details, comments });
    } catch (err) {
      console.error('Error loading issue details:', err);
      setError(`Failed to load details for issue #${issueNumber}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleCreateIssue = () => {
    setIsCreatingIssue(!isCreatingIssue);
    setExpandedIssue(null);
    setIssueDetails(null);
  };

  const handleIssueCreated = (newIssue) => {
    if (filter === 'open' || filter === 'all') {
      setIssues([newIssue, ...issues]);
    }
    setSuccessMessage(`Issue #${newIssue.number} created successfully`);
  };

  const handleCloseIssue = async (issue) => {
    if (!window.confirm(`Are you sure you want to close issue #${issue.number}?`)) {
      return;
    }
    
    try {
      setActionLoading(issue.number);
      
      const [owner, repo] = repository.full_name.split('/');
      const updatedIssue = await GitHubService.updateIssueState(
        owner,
        repo,
        issue.number,
        'closed'
      );
      
      if (filter === 'all') {
        setIssues(
          issues.map(existingIssue => 
            existingIssue.number === issue.number ? updatedIssue : existingIssue
          )
        );
      } else {
        setIssues(
          issues.filter(existingIssue => existingIssue.number !== issue.number)
        );
      }
      
      if (expandedIssue === issue.number) {
        setIssueDetails(updatedIssue);
      }
      
      setSuccessMessage(`Issue #${issue.number} closed successfully`);
    } catch (err) {
      console.error('Error closing issue:', err);
      setError(`Failed to close issue: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReopenIssue = async (issue) => {
    try {
      setActionLoading(issue.number);
      
      const [owner, repo] = repository.full_name.split('/');
      const updatedIssue = await GitHubService.updateIssueState(
        owner,
        repo,
        issue.number,
        'open'
      );
      
      if (filter === 'all') {
        setIssues(
          issues.map(existingIssue => 
            existingIssue.number === issue.number ? updatedIssue : existingIssue
          )
        );
      } else if (filter === 'closed') {
        setIssues(
          issues.filter(existingIssue => existingIssue.number !== issue.number)
        );
      }
      
      if (expandedIssue === issue.number) {
        setIssueDetails(updatedIssue);
      }
      
      setSuccessMessage(`Issue #${issue.number} reopened successfully`);
    } catch (err) {
      console.error('Error reopening issue:', err);
      setError(`Failed to reopen issue: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim() || !issueDetails) {
      return;
    }
    
    try {
      setSubmittingComment(true);
      
      const [owner, repo] = repository.full_name.split('/');
      const newComment = await GitHubService.addIssueComment(
        owner,
        repo,
        issueDetails.number,
        commentText
      );
      
      setIssueDetails({
        ...issueDetails,
        comments: [...issueDetails.comments, newComment]
      });
      
      setCommentText('');
      
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(`Failed to add comment: ${err.message}`);
    } finally {
      setSubmittingComment(false);
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

  const getLabelStyle = (color) => {
    return {
      backgroundColor: `#${color}`,
      color: getBrightness(color) > 128 ? '#000' : '#fff'
    };
  };

  const getBrightness = (hexColor) => {
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  };

  const getIssueStatusIcon = (state) => {
    if (state === 'open') {
      return (
        <svg viewBox="0 0 16 16" width="16" height="16" className="issue-icon open-icon">
          <path fillRule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z"></path>
        </svg>
      );
    } else {
      return (
        <svg viewBox="0 0 16 16" width="16" height="16" className="issue-icon closed-icon">
          <path fillRule="evenodd" d="M1.5 8a6.5 6.5 0 0110.65-5.003.75.75 0 00.959-1.153 8 8 0 102.592 8.33.75.75 0 10-1.444-.407A6.5 6.5 0 011.5 8zM8 12a1 1 0 100-2 1 1 0 000 2zm0-8a.75.75 0 01.75.75v3.5a.75.75 0 11-1.5 0v-3.5A.75.75 0 018 4zm4.78 4.28l3-3a.75.75 0 00-1.06-1.06l-2.47 2.47-.97-.97a.749.749 0 10-1.06 1.06l1.5 1.5a.75.75 0 001.06 0z"></path>
        </svg>
      );
    }
  };

  if (!repository) {
    return (
      <div className="issues empty-state">
        <p>Select a repository to view issues</p>
      </div>
    );
  }

  if (isCreatingIssue) {
    return (
      <div className="issues">
        <h2>Create New Issue</h2>
        
        <div className="issues-controls">
          <button 
            className="create-issue-button"
            onClick={toggleCreateIssue}
          >
            Back to Issues List
          </button>
        </div>
        
        <IssueCreator 
          repository={repository} 
          onIssueCreated={handleIssueCreated}
        />
      </div>
    );
  }

  return (
    <div className="issues">
      <h2>Issues</h2>
      
      <div className="issues-controls">
        <div className="issues-filters">
          <button 
            className={`filter-button ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            Open
          </button>
          <button 
            className={`filter-button ${filter === 'closed' ? 'active' : ''}`}
            onClick={() => setFilter('closed')}
          >
            Closed
          </button>
          <button 
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
        </div>
        
        <button 
          className="create-issue-button"
          onClick={toggleCreateIssue}
        >
          Create New Issue
        </button>
      </div>
      
      {successMessage && (
        <div className="issue-success-message">
          <span className="success-icon">✓</span> {successMessage}
        </div>
      )}
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      {loading ? (
        <div className="loading-indicator">Loading issues...</div>
      ) : (
        <div className="issue-list">
          {issues.length === 0 ? (
            <div className="no-issues">
              {filter === 'open' ? (
                <>
                  <p>This repository has no open issues</p>
                  <button 
                    className="create-first-issue-button"
                    onClick={toggleCreateIssue}
                  >
                    Create First Issue
                  </button>
                </>
              ) : filter === 'closed' ? (
                <p>This repository has no closed issues</p>
              ) : (
                <>
                  <p>This repository has no issues</p>
                  <button 
                    className="create-first-issue-button"
                    onClick={toggleCreateIssue}
                  >
                    Create First Issue
                  </button>
                </>
              )}
            </div>
          ) : (
            issues.map(issue => (
              <div 
                key={issue.id} 
                className={`issue-item ${expandedIssue === issue.number ? 'expanded' : ''}`}
              >
                <div className="issue-header" onClick={() => toggleIssueDetails(issue.number)}>
                  <div className="issue-title-container">
                    {getIssueStatusIcon(issue.state)}
                    <span className="issue-title">{issue.title}</span>
                  </div>
                  
                  <div className="issue-meta">
                    <span className={`issue-status status-${issue.state}`}>
                      {issue.state === 'open' ? 'Open' : 'Closed'}
                    </span>
                    <span className="issue-number">#{issue.number}</span>
                  </div>
                </div>
                
                <div className="issue-info">
                  <div className="issue-author">
                    <img 
                      src={issue.user?.avatar_url} 
                      alt={issue.user?.login} 
                      className="author-avatar"
                    />
                    <span>{issue.user?.login}</span> 
                    {issue.state === 'open' ? 'opened' : 'created'} 
                    {' '}this issue on {formatDate(issue.created_at)}
                  </div>
                  
                  {issue.labels && issue.labels.length > 0 && (
                    <div className="issue-labels">
                      {issue.labels.map(label => (
                        <span 
                          key={label.id} 
                          className="issue-label" 
                          style={getLabelStyle(label.color)}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {expandedIssue === issue.number && (
                  <div className="issue-details">
                    {loadingDetails ? (
                      <div className="loading-indicator">Loading details...</div>
                    ) : !issueDetails ? (
                      <div className="error-message">Failed to load details</div>
                    ) : (
                      <>
                        <div className="issue-description">
                          {issueDetails.body ? (
                            issueDetails.body
                          ) : (
                            <p className="no-description">No description provided</p>
                          )}
                        </div>
                        
                        <div className="issue-stats">
                          <div className="stats-item">
                            <svg viewBox="0 0 16 16" width="16" height="16">
                              <path fillRule="evenodd" d="M1.5 8a6.5 6.5 0 0110.65-5.003.75.75 0 00.959-1.153 8 8 0 102.592 8.33.75.75 0 10-1.444-.407A6.5 6.5 0 011.5 8zM8 12a1 1 0 100-2 1 1 0 000 2zm0-8a.75.75 0 01.75.75v3.5a.75.75 0 11-1.5 0v-3.5A.75.75 0 018 4z"></path>
                            </svg>
                            <span className="stats-label">Status:</span>
                            <span className="stats-value">
                              {issueDetails.state === 'open' ? 'Open' : 'Closed'}
                            </span>
                          </div>
                          
                          <div className="stats-item">
                            <svg viewBox="0 0 16 16" width="16" height="16">
                              <path fillRule="evenodd" d="M2.75 1a.75.75 0 01.75.75V5h9a.75.75 0 010 1.5h-9v3.75a.75.75 0 01-1.5 0v-9A.75.75 0 012.75 1zm4.5 5.5a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5a.75.75 0 01-.75-.75z"></path>
                            </svg>
                            <span className="stats-label">Comments:</span>
                            <span className="stats-value">{issueDetails.comments?.length || 0}</span>
                          </div>
                          
                          {issueDetails.closed_at && (
                            <div className="stats-item">
                              <svg viewBox="0 0 16 16" width="16" height="16">
                                <path fillRule="evenodd" d="M2.5 7.775V2.75a.25.25 0 01.25-.25h5.025a.25.25 0 01.177.073l6.25 6.25a.25.25 0 010 .354l-5.025 5.025a.25.25 0 01-.354 0l-6.25-6.25a.25.25 0 01-.073-.177zm-1.5 0V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 010 2.474l-5.026 5.026a1.75 1.75 0 01-2.474 0l-6.25-6.25A1.75 1.75 0 011 7.775zM6 5a1 1 0 100 2 1 1 0 000-2z"></path>
                              </svg>
                              <span className="stats-label">Closed on:</span>
                              <span className="stats-value">{formatDate(issueDetails.closed_at)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="issue-actions">
                          {issueDetails.state === 'open' ? (
                            <button 
                              className="close-issue-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCloseIssue(issueDetails);
                              }}
                              disabled={actionLoading === issueDetails.number}
                            >
                              {actionLoading === issueDetails.number ? 'Closing...' : 'Close Issue'}
                            </button>
                          ) : (
                            <button 
                              className="reopen-issue-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReopenIssue(issueDetails);
                              }}
                              disabled={actionLoading === issueDetails.number}
                            >
                              {actionLoading === issueDetails.number ? 'Reopening...' : 'Reopen Issue'}
                            </button>
                          )}
                          
                          {issueDetails.html_url && (
                            <a 
                              href={issueDetails.html_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="view-on-github"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View on GitHub
                              <svg viewBox="0 0 16 16" width="12" height="12">
                                <path fillRule="evenodd" d="M10.604 1h4.146a.25.25 0 01.25.25v4.146a.25.25 0 01-.427.177L13.03 4.03 9.28 7.78a.75.75 0 01-1.06-1.06l3.75-3.75-1.543-1.543A.25.25 0 0110.604 1zM3.75 2A1.75 1.75 0 002 3.75v8.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 12.25v-3.5a.75.75 0 00-1.5 0v3.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-8.5a.25.25 0 01.25-.25h3.5a.75.75 0 000-1.5h-3.5z"></path>
                              </svg>
                            </a>
                          )}
                        </div>
                        
                        {issueDetails.comments && issueDetails.comments.length > 0 && (
                          <div className="issue-comments">
                            <h4>Comments ({issueDetails.comments.length})</h4>
                            <div className="comment-list">
                              {issueDetails.comments.map(comment => (
                                <div key={comment.id} className="comment-item">
                                  <div className="comment-header">
                                    <div className="comment-author">
                                      <img 
                                        src={comment.user.avatar_url} 
                                        alt={comment.user.login}
                                        className="author-avatar" 
                                      />
                                      <span>{comment.user.login}</span>
                                    </div>
                                    <span className="comment-date">{formatDate(comment.created_at)}</span>
                                  </div>
                                  <div className="comment-body">{comment.body}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {issueDetails.state === 'open' && (
                          <form className="add-comment-form" onSubmit={handleAddComment}>
                            <textarea
                              className="comment-input"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Add a comment..."
                              disabled={submittingComment}
                              required
                            ></textarea>
                            <button 
                              type="submit" 
                              className="comment-submit"
                              disabled={submittingComment || !commentText.trim()}
                            >
                              {submittingComment ? 'Submitting...' : 'Add Comment'}
                            </button>
                            <div style={{ clear: 'both' }}></div>
                          </form>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});

export default Issues;