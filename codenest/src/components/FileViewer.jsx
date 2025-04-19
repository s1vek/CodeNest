import React, { useState, useEffect } from 'react';
import GitHubService from '../services/github';
import FileEditor from './FileEditor';
import './FileViewer.css';

function FileViewer({ repository }) {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState('');
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!repository) return;

    async function fetchBranches() {
      try {
        setLoadingBranches(true);
        const [owner, repo] = repository.full_name.split('/');
        const branchesData = await GitHubService.getBranches(owner, repo);
        setBranches(branchesData);
        
        // Nastavení výchozí větve (obvykle main nebo master)
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

  // Načtení obsahu adresáře při změně repozitáře, cesty nebo větve
  useEffect(() => {
    if (!repository || !currentBranch) return;

    async function fetchDirectoryContent() {
      try {
        setLoading(true);
        const [owner, repo] = repository.full_name.split('/');
        console.log(`Načítám obsah adresáře: ${owner}/${repo}/${currentPath} (větev: ${currentBranch})`);
        
        const content = await GitHubService.getDirectoryContent(owner, repo, currentPath, currentBranch);
        
        // Seřazení souborů - nejprve složky, pak soubory
        const sortedContent = content.sort((a, b) => {
          if (a.type === 'dir' && b.type !== 'dir') return -1;
          if (a.type !== 'dir' && b.type === 'dir') return 1;
          return a.name.localeCompare(b.name);
        });
        
        setFiles(sortedContent);
      } catch (err) {
        console.error('Chyba při načítání obsahu adresáře:', err);
        setError('Nepodařilo se načíst obsah adresáře: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDirectoryContent();
  }, [repository, currentPath, currentBranch]);

  const handleBranchChange = (e) => {
    const newBranch = e.target.value;
    setCurrentBranch(newBranch);
    setSelectedFile(null);
    setFileContent(null);
    setIsEditing(false);
  };

  const isPdfFile = (fileName) => {
    return fileName.toLowerCase().endsWith('.pdf');
  };

  const isImageFile = (fileName) => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'];
    const lowerCaseName = fileName.toLowerCase();
    return imageExtensions.some(ext => lowerCaseName.endsWith(ext));
  };

  const handleFileClick = async (file) => {
    try {
      if (file.type === 'dir') {
        setCurrentPath(file.path);
        setSelectedFile(null);
        setFileContent(null);
        setIsEditing(false);
      } else {
        setSelectedFile(file);
        setLoadingContent(true);
        setIsEditing(false);
        
        const [owner, repo] = repository.full_name.split('/');
        console.log(`Načítám soubor: ${owner}/${repo}/${file.path} (větev: ${currentBranch})`);
        
        if (isPdfFile(file.name)) {
          setFileContent({
            isPdf: true,
            pdfUrl: file.download_url
          });
        } 
        else if (isImageFile(file.name)) {
          setFileContent({
            isImage: true,
            imageUrl: file.download_url,
            fileName: file.name
          });
        }
        else {
          try {
            const response = await fetch(file.download_url);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            setFileContent({ content: text });
          } catch (err) {
            console.error('Chyba při přímém načtení souboru:', err);
            
            try {
              const content = await GitHubService.getFileContent(owner, repo, file.path, currentBranch);
              setFileContent(content);
            } catch (serviceErr) {
              console.error('Chyba při načítání souboru pomocí služby:', serviceErr);
              setFileContent({ content: 'Nepodařilo se načíst obsah souboru' });
            }
          }
        }
      }
    } catch (err) {
      console.error('Obecná chyba při práci se souborem:', err);
      setFileContent({ content: `Chyba: ${err.message}` });
    } finally {
      setLoadingContent(false);
    }
  };

  const handleDownloadFile = () => {
    if (!selectedFile || !selectedFile.download_url) return;
    
    const downloadLink = document.createElement('a');
    downloadLink.href = selectedFile.download_url;
    downloadLink.download = selectedFile.name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleDownloadRepo = () => {
    if (!repository) return;
    
    const [owner, repo] = repository.full_name.split('/');
    const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${currentBranch}.zip`;
    
    window.open(zipUrl, '_blank');
  };

  const handleEditFile = () => {
    if (!selectedFile || isPdfFile(selectedFile.name) || isImageFile(selectedFile.name)) return;
    setIsEditing(true);
  };

  const handleEditorClose = () => {
    setIsEditing(false);
  };

  const handleFileSaved = async () => {
    setIsEditing(false);
    
    if (selectedFile) {
      setLoadingContent(true);
      try {
        const [owner, repo] = repository.full_name.split('/');
        const content = await GitHubService.getFileContent(owner, repo, selectedFile.path, currentBranch);
        setFileContent(content);
      } catch (err) {
        console.error('Error loading file:', err);
      } finally {
        setLoadingContent(false);
      }
    }
  };

  const navigateUp = () => {
    const pathParts = currentPath.split('/').filter(part => part.length > 0);
    pathParts.pop();
    const newPath = pathParts.join('/');
    setCurrentPath(newPath);
    setSelectedFile(null);
    setFileContent(null);
    setIsEditing(false);
  };

  const getFileIcon = (file) => {
    if (file.type === 'dir') {
      return (
        <svg viewBox="0 0 16 16" width="16" height="16" className="file-icon folder-icon">
          <path fillRule="evenodd" d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3h-6.5a.25.25 0 01-.2-.1l-.9-1.2c-.33-.44-.85-.7-1.4-.7h-3.5z"></path>
        </svg>
      );
    }
    
    const extension = file.name.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return (
          <svg viewBox="0 0 16 16" width="16" height="16" className="file-icon js-icon">
            <path fillRule="evenodd" d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-10.5A1.75 1.75 0 0014.25 1H1.75zM8 13a2 2 0 100-4 2 2 0 000 4z"></path>
          </svg>
        );
      case 'html':
      case 'htm':
        return (
          <svg viewBox="0 0 16 16" width="16" height="16" className="file-icon html-icon">
            <path fillRule="evenodd" d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-10.5A1.75 1.75 0 0014.25 1H1.75zM5 6.25a.75.75 0 01.75-.75h4.5a.75.75 0 110 1.5h-4.5A.75.75 0 015 6.25z"></path>
          </svg>
        );
      case 'css':
      case 'scss':
      case 'sass':
        return (
          <svg viewBox="0 0 16 16" width="16" height="16" className="file-icon css-icon">
            <path fillRule="evenodd" d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-10.5A1.75 1.75 0 0014.25 1H1.75zM5 6.25a.75.75 0 01.75-.75h4.5a.75.75 0 110 1.5h-4.5A.75.75 0 015 6.25z"></path>
          </svg>
        );
      case 'pdf':
        return (
          <svg viewBox="0 0 16 16" width="16" height="16" className="file-icon pdf-icon">
            <path fillRule="evenodd" d="M5 1H3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V3a2 2 0 00-2-2h-3v2h3a1 1 0 110 2H9.5v1H12a1 1 0 110 2H9.5v1H12a1 1 0 110 2H9.5v1h3a1 1 0 01.99.84l.01.16v.54l-.05.3A1 1 0 0113 13H3a1 1 0 01-.99-.84L2 12V3a1 1 0 01.99-.84L3 2h2V1z"></path>
          </svg>
        );
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return (
          <svg viewBox="0 0 16 16" width="16" height="16" className="file-icon image-icon">
            <path fillRule="evenodd" d="M1.75 2.5a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25V2.75a.25.25 0 00-.25-.25H1.75zM0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0114.25 15H1.75A1.75 1.75 0 010 13.25V2.75zm10.75 10.95L2.22 7.21a.75.75 0 01.03-1.06L2.22 7.21l8.5 6.5a.75.75 0 101.06-1.02l-.03-.03zM5 7a1 1 0 100-2 1 1 0 000 2z"></path>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 16 16" width="16" height="16" className="file-icon default-icon">
            <path fillRule="evenodd" d="M3.75 1.5a.25.25 0 00-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V6H9.75A1.75 1.75 0 018 4.25V1.5H3.75zm5.75.56v2.19c0 .138.112.25.25.25h2.19L9.5 2.06zM2 1.75C2 .784 2.784 0 3.75 0h5.086c.464 0 .909.184 1.237.513l3.414 3.414c.329.328.513.773.513 1.237v8.086A1.75 1.75 0 0112.25 15h-8.5A1.75 1.75 0 012 13.25V1.75z"></path>
          </svg>
        );
    }
  };

  const getLanguageClass = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
        return 'language-javascript';
      case 'ts':
      case 'tsx':
        return 'language-typescript';
      case 'html':
      case 'htm':
        return 'language-html';
      case 'css':
        return 'language-css';
      case 'json':
        return 'language-json';
      case 'md':
        return 'language-markdown';
      default:
        return 'language-plaintext';
    }
  };

  const renderBreadcrumbs = () => {
    const pathParts = ['root', ...currentPath.split('/').filter(part => part.length > 0)];
    
    return (
      <div className="breadcrumb">
        {pathParts.map((part, index) => (
          <span key={index}>
            {index > 0 && <span className="breadcrumb-separator">/</span>}
            <span className="breadcrumb-part">{part}</span>
          </span>
        ))}
      </div>
    );
  };

  const isFileEditable = () => {
    if (!selectedFile) return false;
    return !isPdfFile(selectedFile.name) && !isImageFile(selectedFile.name);
  };

  const renderFileContent = () => {
    if (!fileContent) return null;

    if (fileContent.isPdf && fileContent.pdfUrl) {
      return (
        <div className="pdf-container">
          <iframe 
            src={fileContent.pdfUrl}
            title={selectedFile.name}
            className="pdf-viewer"
            width="100%"
            height="100%"
          ></iframe>
          <div className="pdf-actions">
            <a 
              href={fileContent.pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="pdf-download-link"
            >
              Open PDF in a new window
            </a>
          </div>
        </div>
      );
    }
    
    if (fileContent.isImage && fileContent.imageUrl) {
      return (
        <div className="image-container">
          <img 
            src={fileContent.imageUrl} 
            alt={fileContent.fileName}
            className="image-viewer"
          />
        </div>
      );
    }
    
    return (
      <pre className={`code-content ${selectedFile ? getLanguageClass(selectedFile.name) : ''}`}>
        {fileContent.content}
      </pre>
    );
  };

  if (!repository) {
    return (
      <div className="file-viewer empty-state">
        <p> Select a repository to view files</p>
      </div>
    );
  }

  return (
    <div className="file-viewer">
      <h2>File Explorer</h2>
      
      <div className="file-controls">
        <div className="branch-selector">
          <label htmlFor="branch-select">Branch:</label>
          <select 
            id="branch-select"
            value={currentBranch}
            onChange={handleBranchChange}
            disabled={loadingBranches}
            className="branch-select"
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
        
        <div className="download-options">
          <button 
            className="download-repo-button"
            onClick={handleDownloadRepo}
          >
            Download repository
          </button>
          
          {selectedFile && (
            <>
              <button 
                className="download-file-button"
                onClick={handleDownloadFile}
                disabled={!selectedFile.download_url}
              >
                Download a file
              </button>
              
              {isFileEditable() && !isEditing && (
                <button 
                  className="edit-file-button"
                  onClick={handleEditFile}
                  disabled={loading || loadingContent}
                >
                  Edit a file
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      {renderBreadcrumbs()}
      
      <div className="file-explorer-container">
        <div className="files-list">
          {currentPath && (
            <div className="file-item navigate-up" onClick={navigateUp}>
              <svg viewBox="0 0 16 16" width="16" height="16" className="file-icon up-icon">
                <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z"></path>
              </svg>
              <span>../</span>
            </div>
          )}

          {loading ? (
            <div className="loading-indicator">Loading files...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : files.length === 0 ? (
            <div className="empty-directory"> Folder is empty</div>
          ) : (
            files.map(file => (
              <div 
                key={file.sha} 
                className={`file-item ${selectedFile && selectedFile.sha === file.sha ? 'selected' : ''}`}
                onClick={() => handleFileClick(file)}
              >
                {getFileIcon(file)}
                <span className="file-name">{file.name}</span>
              </div>
            ))
          )}
        </div>
        
        <div className="file-content">
          {selectedFile ? (
            isEditing ? (
              <FileEditor 
                file={selectedFile}
                branch={currentBranch}
                repositoryName={repository.full_name}
                onClose={handleEditorClose}
                onSave={handleFileSaved}
              />
            ) : loadingContent ? (
              <div className="loading-content">Loading the contents of a file...</div>
            ) : fileContent ? (
              <>
                <div className="file-header">
                  <h3>{selectedFile.name}</h3>
                  {isFileEditable() && (
                    <button 
                      className="file-edit-button"
                      onClick={handleEditFile}
                      title="Upravit soubor"
                    >
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path fillRule="evenodd" d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"></path>
                      </svg>
                    </button>
                  )}
                </div>
                {renderFileContent()}
              </>
            ) : null
          ) : (
            <div className="no-file-selected">
              <p>Select a file to view the contents</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileViewer;