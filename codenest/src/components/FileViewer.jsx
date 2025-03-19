// src/components/FileViewer.jsx
import React, { useState, useEffect } from 'react';
import GitHubService from '../services/github';
import './FileViewer.css';

/**
 * Komponenta pro prohlížení a procházení souborů v repozitáři
 * @param {Object} props - Props komponenty
 * @param {Object} props.repository - Data vybraného repozitáře
 * @returns {JSX.Element} FileViewer komponenta
 */
function FileViewer({ repository }) {
  // State pro aktuální cestu, soubory, načítání a chyby
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // Načtení obsahu adresáře při změně repozitáře nebo cesty
  useEffect(() => {
    if (!repository) return;

    async function fetchDirectoryContent() {
      try {
        setLoading(true);
        const [owner, repo] = repository.full_name.split('/');
        console.log(`Načítám obsah adresáře: ${owner}/${repo}/${currentPath}`);
        
        const content = await GitHubService.getDirectoryContent(owner, repo, currentPath);
        
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
  }, [repository, currentPath]);

  // Kontrola, zda je soubor PDF
  const isPdfFile = (fileName) => {
    return fileName.toLowerCase().endsWith('.pdf');
  };

  // Zpracování kliknutí na soubor/složku
  const handleFileClick = async (file) => {
    try {
      if (file.type === 'dir') {
        // Pokud je to složka, změníme aktuální cestu
        setCurrentPath(file.path);
        setSelectedFile(null);
        setFileContent(null);
      } else {
        // Pokud je to soubor, načteme jeho obsah
        setSelectedFile(file);
        setLoadingContent(true);
        
        const [owner, repo] = repository.full_name.split('/');
        console.log(`Načítám soubor: ${owner}/${repo}/${file.path}`);
        
        // Pro PDF soubory nemusíme načítat obsah, jen uložíme URL
        if (isPdfFile(file.name)) {
          setFileContent({
            isPdf: true,
            pdfUrl: file.download_url
          });
        } else {
          // Pro ostatní soubory načteme obsah
          try {
            const response = await fetch(file.download_url);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Získání textového obsahu
            const text = await response.text();
            setFileContent({ content: text });
          } catch (err) {
            console.error('Chyba při přímém načtení souboru:', err);
            
            // Záložní metoda přes GitHubService
            try {
              const content = await GitHubService.getFileContent(owner, repo, file.path);
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

  // Navigace zpět o úroveň výše
  const navigateUp = () => {
    // Rozdělení cesty podle lomítek a odebrání poslední části
    const pathParts = currentPath.split('/').filter(part => part.length > 0);
    pathParts.pop();
    const newPath = pathParts.join('/');
    setCurrentPath(newPath);
    setSelectedFile(null);
    setFileContent(null);
  };

  // Získání ikony podle typu souboru
  const getFileIcon = (file) => {
    if (file.type === 'dir') {
      return (
        <svg viewBox="0 0 16 16" width="16" height="16" className="file-icon folder-icon">
          <path fillRule="evenodd" d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3h-6.5a.25.25 0 01-.2-.1l-.9-1.2c-.33-.44-.85-.7-1.4-.7h-3.5z"></path>
        </svg>
      );
    }
    
    // Ikona podle přípony souboru
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
      default:
        return (
          <svg viewBox="0 0 16 16" width="16" height="16" className="file-icon default-icon">
            <path fillRule="evenodd" d="M3.75 1.5a.25.25 0 00-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V6H9.75A1.75 1.75 0 018 4.25V1.5H3.75zm5.75.56v2.19c0 .138.112.25.25.25h2.19L9.5 2.06zM2 1.75C2 .784 2.784 0 3.75 0h5.086c.464 0 .909.184 1.237.513l3.414 3.414c.329.328.513.773.513 1.237v8.086A1.75 1.75 0 0112.25 15h-8.5A1.75 1.75 0 012 13.25V1.75z"></path>
          </svg>
        );
    }
  };

  // Formátování kódu podle přípony souboru
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

  // Zobrazení "drobečkové navigace"
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

  // Vykreslení obsahu souboru
  const renderFileContent = () => {
    if (!fileContent) return null;

    // Pokud je to PDF, použijeme <iframe> pro zobrazení
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
              Otevřít PDF v novém okně
            </a>
          </div>
        </div>
      );
    }
    
    // Pro ostatní soubory zobrazíme obsah jako text
    return (
      <pre className={`code-content ${selectedFile ? getLanguageClass(selectedFile.name) : ''}`}>
        {fileContent.content}
      </pre>
    );
  };

  if (!repository) {
    return (
      <div className="file-viewer empty-state">
        <p>Vyberte repozitář pro zobrazení souborů</p>
      </div>
    );
  }

  return (
    <div className="file-viewer">
      <h2>File Explorer</h2>
      
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
            <div className="loading-indicator">Načítání souborů...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : files.length === 0 ? (
            <div className="empty-directory">Složka je prázdná</div>
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
            loadingContent ? (
              <div className="loading-content">Načítání obsahu souboru...</div>
            ) : fileContent ? (
              <>
                <div className="file-header">
                  <h3>{selectedFile.name}</h3>
                </div>
                {renderFileContent()}
              </>
            ) : null
          ) : (
            <div className="no-file-selected">
              <p>Vyberte soubor pro zobrazení obsahu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileViewer;