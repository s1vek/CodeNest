// src/components/FileEditor.jsx
import React, { useState, useEffect } from 'react';
import GitHubService from '../services/github';
import './FileEditor.css';

/**
 * Komponenta pro editaci souborů a vytváření commitů
 * @param {Object} props - Props komponenty
 * @param {Object} props.file - Data vybraného souboru
 * @param {string} props.branch - Aktuální větev
 * @param {string} props.repositoryName - Jméno repozitáře (owner/repo)
 * @param {Function} props.onClose - Callback při zavření editoru
 * @param {Function} props.onSave - Callback po úspěšném uložení (commitu)
 * @returns {JSX.Element} FileEditor komponenta
 */
function FileEditor({ file, branch, repositoryName, onClose, onSave }) {
  // State pro obsah souboru, commit message a stav editace
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isContentChanged, setIsContentChanged] = useState(false);

  // Konstanty pro zjištění typu souboru
  const isBinaryFile = (fileName) => {
    const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.exe', '.dll', '.jar'];
    const lowerCaseName = fileName.toLowerCase();
    return binaryExtensions.some(ext => lowerCaseName.endsWith(ext));
  };

  // Načtení obsahu souboru při změně vybraného souboru
  useEffect(() => {
    if (!file) return;

    async function loadFileContent() {
      try {
        // Pro binární soubory zobrazíme pouze informaci, že nejdou editovat
        if (isBinaryFile(file.name)) {
          setContent('Binární soubor nelze editovat v prohlížeči.');
          setOriginalContent('Binární soubor nelze editovat v prohlížeči.');
          return;
        }

        // Pro ostatní soubory načteme jejich obsah
        const [owner, repo] = repositoryName.split('/');
        const response = await GitHubService.getFileContent(owner, repo, file.path, branch);
        
        setContent(response.content);
        setOriginalContent(response.content);
        setCommitMessage(`Update ${file.name}`);  // Výchozí commit message
      } catch (err) {
        console.error('Chyba při načítání obsahu souboru:', err);
        setError(`Nepodařilo se načíst obsah souboru: ${err.message}`);
      }
    }

    loadFileContent();
  }, [file, branch, repositoryName]);

  // Kontrola změn obsahu
  useEffect(() => {
    setIsContentChanged(content !== originalContent);
  }, [content, originalContent]);

  // Zpracování změn v textovém editoru
  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  // Zpracování změny commit message
  const handleCommitMessageChange = (e) => {
    setCommitMessage(e.target.value);
  };

  // Vytvoření commitu s aktuálními změnami
  const handleCreateCommit = async () => {
    if (!isContentChanged) {
      return; // Pokud obsah nebyl změněn, není co ukládat
    }

    if (!commitMessage.trim()) {
      setError('Commit message je povinná.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const [owner, repo] = repositoryName.split('/');
      await GitHubService.createCommit(
        owner,
        repo,
        file.path,
        commitMessage,
        content,
        branch,
        file.sha
      );

      // Informujeme rodičovskou komponentu o úspěšném uložení
      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Chyba při vytváření commitu:', err);
      setError(`Nepodařilo se vytvořit commit: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Zpracování zrušení editace
  const handleCancel = () => {
    if (onClose) {
      onClose();
    }
  };

  // Získání typu souboru podle přípony pro správné zvýraznění
  const getFileLanguageClass = () => {
    if (!file || !file.name) return '';
    
    const extension = file.name.split('.').pop().toLowerCase();
    
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
        return '';
    }
  };

  // Zjištění, zda jde o binární soubor, který nelze editovat
  const isFileEditable = () => {
    return file && !isBinaryFile(file.name);
  };

  if (!file) {
    return null;
  }

  return (
    <div className="file-editor">
      <div className="editor-header">
        <h3>Edit: {file.name}</h3>
        <div className="editor-actions">
          <button 
            className="cancel-button" 
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            className="save-button" 
            onClick={handleCreateCommit}
            disabled={!isContentChanged || saving || !isFileEditable()}
          >
            {saving ? 'Ukládám...' : 'Commit změn'}
          </button>
        </div>
      </div>

      {error && (
        <div className="editor-error">
          {error}
        </div>
      )}

      <div className={`commit-form ${!isFileEditable() ? 'disabled' : ''}`}>
        <div className="form-group">
          <label htmlFor="commit-message">Commit Message:</label>
          <input
            id="commit-message"
            type="text"
            value={commitMessage}
            onChange={handleCommitMessageChange}
            className="commit-message-input"
            placeholder="Popis provedených změn"
            disabled={!isFileEditable() || saving}
          />
        </div>
      </div>

      <div className="editor-content">
        {isFileEditable() ? (
          <textarea
            className={`code-editor ${getFileLanguageClass()}`}
            value={content}
            onChange={handleContentChange}
            disabled={saving}
            spellCheck={false}
          ></textarea>
        ) : (
          <div className="binary-file-notice">
            <p>This file type cannot be edited via the web interface.</p>
            <p>Only text files are supported.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileEditor;