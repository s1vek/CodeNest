// src/components/FileUpload.jsx
import React, { useState, useEffect } from 'react';
import GitHubService from '../services/github';
import './FileUpload.css';


function FileUpload({ repository }) {
  // State pro informace o nahrávaném souboru, cesty a stavu
  const [currentPath, setCurrentPath] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [directories, setDirectories] = useState([]);
  const [currentBranch, setCurrentBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [uploadMode, setUploadMode] = useState('text'); // 'text' nebo 'file'
  const [selectedFile, setSelectedFile] = useState(null);

  // Načtení větví a adresářů při změně repozitáře
  useEffect(() => {
    if (!repository) return;

    async function fetchBranches() {
      try {
        setLoadingBranches(true);
        const [owner, repo] = repository.full_name.split('/');
        const branchesData = await GitHubService.getBranches(owner, repo);
        setBranches(branchesData);
        
        // Nastavení výchozí větve
        const defaultBranch = repository.default_branch || 'main';
        setCurrentBranch(defaultBranch);
      } catch (err) {
        console.error('Chyba při načítání větví:', err);
      } finally {
        setLoadingBranches(false);
      }
    }

    fetchBranches();
  }, [repository]);

  // Načtení adresářů při změně repozitáře nebo větve
  useEffect(() => {
    if (!repository || !currentBranch) return;

    async function fetchDirectories() {
      try {
        const [owner, repo] = repository.full_name.split('/');
        const rootContent = await GitHubService.getDirectoryContent(owner, repo, '', currentBranch);
        
        // Filtrujeme pouze adresáře
        const dirs = rootContent
          .filter(item => item.type === 'dir')
          .map(dir => ({ name: dir.name, path: dir.path }));
        
        // Přidáme kořenový adresář
        dirs.unshift({ name: '/ (kořenový adresář)', path: '' });
        
        setDirectories(dirs);
      } catch (err) {
        console.error('Chyba při načítání adresářů:', err);
      }
    }

    fetchDirectories();
  }, [repository, currentBranch]);

  // Zpracování změny větve
  const handleBranchChange = (e) => {
    setCurrentBranch(e.target.value);
  };

  // Zpracování změny adresáře
  const handleDirectoryChange = (e) => {
    setCurrentPath(e.target.value);
  };

  // Zpracování změny režimu nahrávání (text/soubor)
  const handleUploadModeChange = (mode) => {
    setUploadMode(mode);
    setFileContent('');
    setSelectedFile(null);
  };

  // Zpracování výběru souboru k nahrání
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);

    // Pokud je to textový soubor, načteme obsah pro zobrazení
    if (file.type.startsWith('text/') || 
        ['application/json', 'application/javascript', 'application/xml'].includes(file.type)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileContent(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  // Zpracování změny textového obsahu
  const handleContentChange = (e) => {
    setFileContent(e.target.value);
  };

  // Zpracování změny názvu souboru
  const handleFileNameChange = (e) => {
    setFileName(e.target.value);
  };

  // Zpracování změny commit message
  const handleCommitMessageChange = (e) => {
    setCommitMessage(e.target.value);
  };

  // Odeslání souboru a vytvoření commitu
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validace vstupních dat
    if (!fileName.trim()) {
      setError('Zadejte prosím název souboru');
      return;
    }

    if (uploadMode === 'text' && !fileContent.trim()) {
      setError('Zadejte prosím obsah souboru');
      return;
    }

    if (uploadMode === 'file' && !selectedFile) {
      setError('Vyberte prosím soubor k nahrání');
      return;
    }

    if (!commitMessage.trim()) {
      setError('Zadejte prosím commit message');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const [owner, repo] = repository.full_name.split('/');
      const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
      
      // Pro binární soubory použijeme FileReader pro načtení obsahu
      let content = fileContent;
      
      if (uploadMode === 'file' && selectedFile) {
        if (!selectedFile.type.startsWith('text/') && 
            !['application/json', 'application/javascript', 'application/xml'].includes(selectedFile.type)) {
          // Pro binární soubory načteme data jako base64
          content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              // Získáme base64 data (odstraníme prefix "data:...")
              const base64Content = reader.result.split(',')[1];
              resolve(base64Content);
            };
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });
          
          // Vytvoříme commit s binárním obsahem
          await GitHubService.createCommitWithBase64(
            owner,
            repo,
            filePath,
            commitMessage,
            content,
            currentBranch
          );
        } else {
          // Pro textové soubory použijeme obsah načtený jako text
          await GitHubService.createCommit(
            owner,
            repo,
            filePath,
            commitMessage,
            content,
            currentBranch
          );
        }
      } else {
        // Pro textový obsah zadaný přímo v editoru
        await GitHubService.createCommit(
          owner,
          repo,
          filePath,
          commitMessage,
          content,
          currentBranch
        );
      }
      
      // Reset formuláře po úspěšném odeslání
      setSuccess(`Soubor ${fileName} byl úspěšně nahrán`);
      setFileName('');
      setFileContent('');
      setCommitMessage('');
      setSelectedFile(null);
      
      // Reset file input elementu
      if (document.getElementById('file-upload-input')) {
        document.getElementById('file-upload-input').value = '';
      }
      
    } catch (err) {
      console.error('Chyba při nahrávání souboru:', err);
      setError(`Nepodařilo se nahrát soubor: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!repository) {
    return (
      <div className="file-upload empty-state">
        <p>Select a repository for uploading files</p>
      </div>
    );
  }

  return (
    <div className="file-upload">
      <h2>Upload new file</h2>
      
      {error && (
        <div className="upload-error">
          <span className="error-icon">⚠️</span> {error}
        </div>
      )}
      
      {success && (
        <div className="upload-success">
          <span className="success-icon">✓</span> {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-section">
          <h3>Vyberte umístění</h3>
          
          <div className="form-group">
            <label htmlFor="branch-select">Branch:</label>
            <select 
              id="branch-select"
              value={currentBranch}
              onChange={handleBranchChange}
              disabled={loadingBranches || loading}
              className="form-control"
            >
              {loadingBranches ? (
                <option>Loading branches...</option>
              ) : (
                branches.map(branch => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="directory-select">Directory:</label>
            <select 
              id="directory-select"
              value={currentPath}
              onChange={handleDirectoryChange}
              disabled={loading}
              className="form-control"
            >
              {directories.map((dir, index) => (
                <option key={index} value={dir.path}>
                  {dir.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-section">
          <h3>File info</h3>
          
          <div className="form-group">
            <label htmlFor="file-name">File name:</label>
            <input
              id="file-name"
              type="text"
              value={fileName}
              onChange={handleFileNameChange}
              placeholder="např. example.js"
              className="form-control"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="commit-message">Commit message:</label>
            <input
              id="commit-message"
              type="text"
              value={commitMessage}
              onChange={handleCommitMessageChange}
              placeholder="např. Add new file"
              className="form-control"
              disabled={loading}
            />
          </div>
        </div>
        
        <div className="form-section">
          <h3>File contents</h3>
          
          <div className="upload-mode-selector">
            <button 
              type="button" 
              className={`mode-button ${uploadMode === 'text' ? 'active' : ''}`}
              onClick={() => handleUploadModeChange('text')}
              disabled={loading}
            >
              Create a text file
            </button>
            <button 
              type="button" 
              className={`mode-button ${uploadMode === 'file' ? 'active' : ''}`}
              onClick={() => handleUploadModeChange('file')}
              disabled={loading}
            >
              Upload a file
            </button>
          </div>
          
          {uploadMode === 'text' ? (
            <div className="form-group">
              <textarea
                value={fileContent}
                onChange={handleContentChange}
                placeholder="Obsah souboru..."
                className="file-content-input"
                disabled={loading}
                rows={12}
              ></textarea>
            </div>
          ) : (
            <div className="form-group file-input-group">
              <label htmlFor="file-upload-input" className="file-input-label">
                {selectedFile ? selectedFile.name : 'Vyberte soubor'}
              </label>
              <input
                id="file-upload-input"
                type="file"
                onChange={handleFileSelect}
                className="file-input"
                disabled={loading}
              />
              {selectedFile && selectedFile.type.startsWith('text/') && (
                <div className="preview-section">
                  <h4>Content preview:</h4>
                  <pre className="file-preview">
                    {fileContent.length > 1000 
                      ? fileContent.substring(0, 1000) + '...' 
                      : fileContent}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="upload-button"
            disabled={loading}
          >
            {loading ? 'Nahrávám...' : 'Nahrát soubor'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FileUpload;