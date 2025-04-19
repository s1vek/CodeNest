import React, { useState, useEffect } from 'react';
import GitHubService from '../services/github';

function IssueCreator({ repository, onIssueCreated }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdIssue, setCreatedIssue] = useState(null);
  const [availableLabels, setAvailableLabels] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [loadingLabels, setLoadingLabels] = useState(false);

  useEffect(() => {
    async function fetchLabels() {
      if (!repository) return;
      
      try {
        setLoadingLabels(true);
        const [owner, repo] = repository.full_name.split('/');
        const labels = await GitHubService.getLabels(owner, repo);
        setAvailableLabels(labels);
      } catch (err) {
        console.error('Error loading labels:', err);
      } finally {
        setLoadingLabels(false);
      }
    }

    fetchLabels();
  }, [repository]);

  const handleLabelChange = (label) => {
    if (selectedLabels.includes(label.name)) {
      setSelectedLabels(selectedLabels.filter(name => name !== label.name));
    } else {
      setSelectedLabels([...selectedLabels, label.name]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [owner, repo] = repository.full_name.split('/');
      
      const issue = await GitHubService.createIssue(
        owner,
        repo,
        title,
        body,
        selectedLabels
      );
      
      setCreatedIssue(issue);
      
      setTitle('');
      setBody('');
      setSelectedLabels([]);
      
      if (onIssueCreated) {
        onIssueCreated(issue);
      }
      
    } catch (err) {
      console.error('Error creating issue:', err);
      setError(`Failed to create issue: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewIssue = () => {
    setCreatedIssue(null);
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

  if (createdIssue) {
    return (
      <div className="issue-created">
        <div className="issue-created-header">
          <h3>Issue Created!</h3>
          <span className="issue-created-number">#{createdIssue.number}</span>
        </div>
        
        <div className="issue-created-title">{createdIssue.title}</div>
        
        {createdIssue.labels && createdIssue.labels.length > 0 && (
          <div className="issue-labels">
            {createdIssue.labels.map(label => (
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
        
        <div className="issue-created-actions">
          <a 
            href={createdIssue.html_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="view-issue-link"
          >
            View on GitHub 
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path fillRule="evenodd" d="M10.604 1h4.146a.25.25 0 01.25.25v4.146a.25.25 0 01-.427.177L13.03 4.03 9.28 7.78a.75.75 0 01-1.06-1.06l3.75-3.75-1.543-1.543A.25.25 0 0110.604 1zM3.75 2A1.75 1.75 0 002 3.75v8.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 12.25v-3.5a.75.75 0 00-1.5 0v3.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-8.5a.25.25 0 01.25-.25h3.5a.75.75 0 000-1.5h-3.5z"></path>
            </svg>
          </a>
          
          <button 
            className="create-new-issue-button" 
            onClick={handleCreateNewIssue}
          >
            Create Another Issue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="issue-creator">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form className="issue-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="issue-title">Issue Title:</label>
          <input
            id="issue-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short, descriptive title"
            className="issue-title-input"
            disabled={loading}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="issue-body">Description (Markdown supported):</label>
          <textarea
            id="issue-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Detailed description of the issue or feature request..."
            className="issue-body-input"
            rows={8}
            disabled={loading}
          ></textarea>
        </div>
        
        <div className="form-group">
          <label>Labels:</label>
          <div className="issue-label-selector">
            {loadingLabels ? (
              <span>Loading labels...</span>
            ) : availableLabels.length === 0 ? (
              <span>No labels available</span>
            ) : (
              availableLabels.map(label => (
                <label 
                  key={label.id} 
                  className="label-option" 
                  style={getLabelStyle(label.color)}
                >
                  <input
                    type="checkbox"
                    checked={selectedLabels.includes(label.name)}
                    onChange={() => handleLabelChange(label)}
                    disabled={loading}
                  />
                  {label.name}
                </label>
              ))
            )}
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading || !title.trim()}
          >
            {loading ? 'Creating...' : 'Create Issue'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default IssueCreator;