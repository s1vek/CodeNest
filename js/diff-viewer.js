class DiffViewer {
    constructor(auth) {
        this.auth = auth;
    }

    async getFileContent(repoName, filePath, branch) {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${repoName}/contents/${filePath}?ref=${branch}`,
                { headers: this.auth.getHeaders() }
            );
            
            if (!response.ok) {
                throw new Error('Soubor nebyl nalezen');
            }

            const data = await response.json();
            return atob(data.content);
        } catch (error) {
            console.error('Chyba při načítání souboru:', error);
            throw error;
        }
    }

    generateDiff(oldText, newText) {
        const diffArr = [];
        const oldLines = oldText.split('\n');
        const newLines = newText.split('\n');
        
        let i = 0, j = 0;
        
        while (i < oldLines.length || j < newLines.length) {
            if (i >= oldLines.length) {
                diffArr.push({
                    type: 'added',
                    content: newLines[j],
                    lineOld: null,
                    lineNew: j + 1
                });
                j++;
            } else if (j >= newLines.length) {
                diffArr.push({
                    type: 'removed',
                    content: oldLines[i],
                    lineOld: i + 1,
                    lineNew: null
                });
                i++;
            } else if (oldLines[i] === newLines[j]) {
                diffArr.push({
                    type: 'unchanged',
                    content: oldLines[i],
                    lineOld: i + 1,
                    lineNew: j + 1
                });
                i++;
                j++;
            } else {
                diffArr.push({
                    type: 'removed',
                    content: oldLines[i],
                    lineOld: i + 1,
                    lineNew: null
                });
                diffArr.push({
                    type: 'added',
                    content: newLines[j],
                    lineOld: null,
                    lineNew: j + 1
                });
                i++;
                j++;
            }
        }
        
        return diffArr;
    }

    renderDiffResults(diffArr, container) {
        const diffContent = container.querySelector('#diffContent');
        diffContent.innerHTML = diffArr.map(line => `
            <div class="diff-line ${line.type}">
                <span class="diff-line-number">${line.lineOld || ''}</span>
                <span class="diff-line-number">${line.lineNew || ''}</span>
                <span class="diff-content">${this.escapeHtml(line.content)}</span>
            </div>
        `).join('');
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    initEventListeners() {
        const compareButton = document.getElementById('compareBranches');
        if (compareButton) {
            compareButton.addEventListener('click', this.handleCompare.bind(this));
        }
    }

    async handleCompare() {
        const fileInput = document.getElementById('fileSelect');
        const sourceBranch = document.getElementById('sourceBranch').value;
        const targetBranch = document.getElementById('targetBranch').value;
        const repoSelect = document.getElementById('repoSelect');
        const repoName = repoSelect.value;

        if (!fileInput.files[0]) {
            alert('Prosím vyberte soubor k porovnání');
            return;
        }

        try {
            const file = fileInput.files[0];
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const newContent = e.target.result;
                    const oldContent = await this.getFileContent(repoName, file.name, sourceBranch);
                    
                    const diff = this.generateDiff(oldContent, newContent);
                    this.renderDiffResults(diff, document.querySelector('.diff-viewer'));
                } catch (error) {
                    alert('Chyba při porovnávání souborů: ' + error.message);
                }
            };

            reader.readAsText(file);
        } catch (error) {
            console.error('Chyba při porovnávání:', error);
            alert('Nepodařilo se porovnat soubory');
        }
    }
}