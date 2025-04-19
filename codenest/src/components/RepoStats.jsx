import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import GitHubService from '../services/github';
import './RepoStats.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DF2', '#FF6B7A', '#4DC8E9', '#45D09E', '#DFBE56', '#F2A58D'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{`${payload[0].name}`}</p>
        <p className="tooltip-value">{`${payload[0].value.toLocaleString()} bytes`}</p>
        <p className="tooltip-value">{`${payload[0].payload.percentage.toFixed(2)}%`}</p>
      </div>
    );
  }
  return null;
};

const CommitTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{`Week: ${label}`}</p>
        <p className="tooltip-value">{`Commits: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const RepoStats = forwardRef(({ repository }, ref) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    languages: null,
    contributors: null,
    commitActivity: null,
    repoData: null
  });

  const fetchStats = async () => {
    if (!repository) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [owner, repo] = repository.full_name.split('/');
      const repoStats = await GitHubService.getRepositoryStats(owner, repo);
      
      setStats(repoStats);
    } catch (err) {
      console.error('Error fetching repository statistics:', err);
      setError('Failed to load repository statistics');
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: fetchStats
  }));

  useEffect(() => {
    fetchStats();
  }, [repository]);

  const prepareLanguageData = () => {
    if (!stats.languages) return [];
    
    const totalBytes = Object.values(stats.languages).reduce((sum, bytes) => sum + bytes, 0);
    
    return Object.entries(stats.languages).map(([name, bytes]) => ({
      name,
      value: bytes,
      percentage: (bytes / totalBytes) * 100
    })).sort((a, b) => b.value - a.value);
  };

  const prepareCommitActivityData = () => {
    if (!stats.commitActivity) return [];
    
    return stats.commitActivity.slice(-12).map((week, index) => {
      const date = new Date(week.week * 1000);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        name: `${monthNames[date.getMonth()]} ${date.getDate()}`,
        commits: week.total
      };
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (!repository) {
    return (
      <div className="repo-stats empty-state">
        <p>Select a repository to view statistics</p>
      </div>
    );
  }

  return (
    <div className="repo-stats">
      <h2>Repository Statistics</h2>
      
      {loading ? (
        <div className="loading-indicator">Loading statistics...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stats-card">
              <h3>Repository Info</h3>
              <div className="stats-item">
                <div className="stats-value">{stats.repoData?.stargazers_count.toLocaleString()}</div>
                <div className="stats-label">Stars</div>
              </div>
              <div className="stats-item">
                <div className="stats-value">{stats.repoData?.forks_count.toLocaleString()}</div>
                <div className="stats-label">Forks</div>
              </div>
              <div className="stats-item">
                <div className="stats-value">{stats.repoData?.watchers_count.toLocaleString()}</div>
                <div className="stats-label">Watchers</div>
              </div>
              <div className="stats-item">
                <div className="stats-label">Created: {formatDate(stats.repoData?.created_at)}</div>
                <div className="stats-label">Last Updated: {formatDate(stats.repoData?.updated_at)}</div>
              </div>
            </div>
            
            {stats.languages && Object.keys(stats.languages).length > 0 && (
              <div className="stats-card">
                <h3>Top Languages</h3>
                <div style={{ height: '220px', display: 'flex', flexDirection: 'column' }}>
                  {prepareLanguageData().slice(0, 5).map((language, index) => (
                    <div key={language.name} className="contributor-item" style={{ borderBottom: index < 4 ? '1px solid #333' : 'none' }}>
                      <div className="contributor-info">
                        <div className="contributor-name">
                          <span className="color-indicator" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          {language.name}
                        </div>
                        <div className="commit-count">{language.value.toLocaleString()} bytes ({language.percentage.toFixed(1)}%)</div>
                        <div className="contributor-percentage" style={{ 
                          width: `${language.percentage}%`, 
                          backgroundColor: COLORS[index % COLORS.length]
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {stats.languages && Object.keys(stats.languages).length > 0 && (
            <div className="chart-container">
              <h3>Language Distribution</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareLanguageData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareLanguageData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          {stats.commitActivity && stats.commitActivity.length > 0 && (
            <div className="chart-container">
              <h3>Commit Activity (Last 12 Weeks)</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareCommitActivityData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    className="commits-chart"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CommitTooltip />} />
                    <Bar dataKey="commits" fill="#58a6ff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          {stats.contributors && stats.contributors.length > 0 && (
            <div className="chart-container">
              <h3>Top Contributors</h3>
              <ul className="contributors-list">
                {stats.contributors
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 5)
                  .map((contributor, index) => {
                    const percentage = stats.contributors.reduce((total, c) => total + c.total, 0);
                    const contributorPercentage = (contributor.total / percentage) * 100;
                    
                    return (
                      <li key={contributor.author.id} className="contributor-item">
                        <img 
                          src={contributor.author.avatar_url} 
                          alt={contributor.author.login}
                          className="contributor-avatar"
                        />
                        <div className="contributor-info">
                          <div className="contributor-name">{contributor.author.login}</div>
                          <div className="commit-count">{contributor.total} commits</div>
                          <div 
                            className="contributor-percentage" 
                            style={{ width: `${contributorPercentage}%` }}
                          ></div>
                        </div>
                      </li>
                    );
                  })
                }
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default RepoStats;