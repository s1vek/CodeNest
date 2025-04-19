import React, { useState, useEffect } from 'react';
import GitHubService from '../services/github';
import BranchManager from './BranchManager';
import './PullRequestCreator.css';

function PullRequestCreator({ repository, onPullRequestCreated }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [headBranch, setHeadBranch] = useState('');
  const [baseBranch, setBaseBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [branches, setBranches] = useState([]);
  const [createdPR, setCreatedPR] = useState(null);

  useEffect(() => {
    if (!repository) return;

    async function fetchBranches() {
      try {
        const [owner, repo] = repository.full_name.split('/');
        const branchesData = await GitHubService.getBranches(owner, repo);
        setBranches(branchesData);
        
        if (branchesData.length > 0) {
          const defaultBranch = repository.default_branch || branchesData[0].name;
          setBaseBranch(defaultBranch);
        }
      } catch (err) {
        console.error('Error loading branches:', err);
        setError('Failed to load branches');
      }
    }

    fetchBranches();
  }, [repository]);

  const handleBranchSelect = (branch) => {
    setHeadBranch(branch);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!headBranch) {
      setError('You must select a source branch');
      return;
    }

    if (!baseBranch) {
      setError('You must select a target branch');
      return;
    }

    if (headBranch === baseBranch) {
      setError('Source and target branches must be different');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const [owner, repo] = repository.full_name.split('/');
      
      const pullRequest = await GitHubService.createPullRequest(
        owner,
        repo,
        title,
        body,
        headBranch,
        baseBranch
      );
      
      setSuccess(`Pull Request #${pullRequest.number} created successfully!`);
      setCreatedPR(pullRequest);
      
      setTitle('');
      setBody('');
      
      if (onPullRequestCreated) {
        onPullRequestCreated(pullRequest);
      }
      
    } catch (err) {
      console.error('Error creating pull request:', err);
      setError(`Failed to create pull request: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pr-creator">
      <h2>Create Pull Request</h2>
      
      {error && (
        <div className="pr-error">
          {error}
        </div>
      )}
      
      {success && !createdPR && (
        <div className="pr-success">
          {success}
        </div>
      )}
      
      {createdPR && (
        <div className="pr-created">
          <div className="pr-created-header">
            <h3>Pull Request Created!</h3>
            <span className="pr-number">#{createdPR.number}</span>
          </div>
          <div className="pr-created-title">{createdPR.title}</div>
          <div className="pr-created-info">
            <span>From <strong>{createdPR.head.ref}</strong> to <strong>{createdPR.base.ref}</strong></span>
          </div>
          <div className="pr-created-actions">
            <a 
              href={createdPR.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="view-pr-link"
            >
              View on GitHub 
              <svg viewBox="0 0 16 16" width="12" height="12">
                <path fillRule="evenodd" d="M10.604 1h4.146a.25.25 0 01.25.25v4.146a.25.25 0 01-.427.177L13.03 4.03 9.28 7.78a.75.75 0 01-1.06-1.06l3.75-3.75-1.543-1.543A.25.25 0 0110.604 1zM3.75 2A1.75 1.75 0 002 3.75v8.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 12.25v-3.5a.75.75 0 00-1.5 0v3.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-8.5a.25.25 0 01.25-.25h3.5a.75.75 0 000-1.5h-3.5z"></path>
              </svg>
            </a>
            <button 
              className="create-new-pr-button" 
              onClick={() => setCreatedPR(null)}
            >
              Create Another Pull Request
            </button>
          </div>
        </div>
      )}
      
      {!createdPR && (
        <>
          <BranchManager 
            repository={repository} 
            onBranchSelect={handleBranchSelect}
            currentBranch={headBranch}
          />
          
          <form className="pr-form" onSubmit={handleSubmit}>
            <div className="branches-selection">
              <div className="form-group">
                <label htmlFor="head-branch">Source Branch (with your changes):</label>
                <select
                  id="head-branch"
                  value={headBranch}
                  onChange={(e) => setHeadBranch(e.target.value)}
                  className="branch-select"
                  disabled={loading}
                  required
                >
                  <option value="">Select source branch</option>
                  {branches.map(branch => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="arrow-icon">
                <svg viewBox="0 0 16 16" width="16" height="16">
                  <path fillRule="evenodd" d="M8.22 2.97a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06l2.97-2.97H3.75a.75.75 0 010-1.5h7.44L8.22 4.03a.75.75 0 010-1.06z"></path>
                </svg>
              </div>
              
              <div className="form-group">
                <label htmlFor="base-branch">Target Branch (where to merge):</label>
                <select
                  id="base-branch"
                  value={baseBranch}
                  onChange={(e) => setBaseBranch(e.target.value)}
                  className="branch-select"
                  disabled={loading}
                  required
                >
                  <option value="">Select target branch</option>
                  {branches.map(branch => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name} {branch.name === repository.default_branch ? '(default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="pr-title">Pull Request Title:</label>
              <input
                id="pr-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Add new feature"
                className="pr-title-input"
                disabled={loading}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="pr-body">Description (Markdown supported):</label>
              <textarea
                id="pr-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe your changes and why they should be merged..."
                className="pr-body-input"
                rows={8}
                disabled={loading}
              ></textarea>
            </div>
            
            <div className="markdown-tips">
              <p>Formatting tips:</p>
              <ul>
                <li><code>**bold**</code> for <strong>bold text</strong></li>
                <li><code>*italic*</code> for <em>italic text</em></li>
                <li><code>- item</code> for bullet lists</li>
                <li><code>1. item</code> for numbered lists</li>
                <li><code>```code```</code> for code blocks</li>
              </ul>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="create-pr-button"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Pull Request'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export default PullRequestCreator;