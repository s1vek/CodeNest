    document.addEventListener('DOMContentLoaded', () => {
    // Inicializace hlavních objektů
    const auth = new Auth();
    const repoManager = new RepositoryManager(auth);
    const commitManager = new CommitManager(auth, repoManager);
    
    // Kontrola, zda je uživatel přihlášený
    const token = localStorage.getItem('github_token');
    const username = localStorage.getItem('github_username');
    
    if (token && username) {
        // Automatické přihlášení
        auth.login(username, token).then(success => {
            if (success) {
                document.getElementById('loginSection').classList.add('hidden');
                document.getElementById('mainSection').classList.remove('hidden');
                loadRepositories();
            } else {
                // Token není platný, vymažeme ho
                auth.logout();
            }
        });
    }

    // Načtení repozitářů
    async function loadRepositories() {
        try {
            console.log('Načítám repozitáře...');
            const repos = await repoManager.fetchUserRepos();
            const select = document.getElementById('repoSelect');
            
            if (!select) {
                throw new Error('Element repoSelect nebyl nalezen');
            }

            select.innerHTML = repos.map(repo => 
                `<option value="${repo.name}">${repo.name}</option>`
            ).join('');
            
            // Načtení větví pro první repozitář
            if (repos.length > 0) {
                repoManager.setCurrentRepo(repos[0]);
                loadBranches(repos[0].name);
            } else {
                select.innerHTML = '<option value="">Žádné repozitáře</option>';
            }
        } catch (error) {
            console.error('Chyba při načítání repozitářů:', error);
            alert('Nepodařilo se načíst repozitáře: ' + error.message);
        }
    }

    // Načtení větví
    async function loadBranches(repoName) {
        try {
            const branches = await repoManager.fetchBranches(repoName);
            const select = document.getElementById('branchSelect');
            select.innerHTML = branches.map(branch => 
                `<option value="${branch.name}">${branch.name}</option>`
            ).join('');
            
            // Načtení historie commitů
            loadCommitHistory(repoName, branches[0].name);
        } catch (error) {
            console.error('Error loading branches:', error);
            alert('Nepodařilo se načíst větve.');
        }
    }

    // Načtení historie commitů
    async function loadCommitHistory(repoName, branch) {
        try {
            // Přidáno logování pro debugging
            console.log('Načítám historii commitů pro:', { repoName, branch });
    
            // Kontrola vstupních parametrů
            if (!repoName) {
                throw new Error('Není specifikován repozitář');
            }
            if (!branch) {
                branch = 'main'; // Výchozí větev pokud není specifikována
            }
    
            // Sestavení URL pro GitHub API
            const url = `https://api.github.com/repos/${repoName}/commits?sha=${branch}&per_page=10`;
            console.log('Požadavek na URL:', url);
    
            const response = await fetch(url, {
                headers: auth.getHeaders()  // Použijeme headers z auth instance
            });
    
            if (!response.ok) {
                throw new Error(`GitHub API vrátilo chybu: ${response.status} ${response.statusText}`);
            }
    
            const commits = await response.json();
            console.log('Načtené commity:', commits);
    
            // Aktualizace UI
            const commitList = document.getElementById('commitList');
            if (!commitList) {
                throw new Error('Element commitList nebyl nalezen');
            }
    
            if (commits.length === 0) {
                commitList.innerHTML = '<p>Žádné commity k zobrazení</p>';
                return;
            }
    
            // Vykreslení commitů
            commitList.innerHTML = commits.map(commit => `
                <div class="commit">
                    <h3>${escapeHtml(commit.commit.message)}</h3>
                    <p>Autor: ${escapeHtml(commit.commit.author.name)}</p>
                    <p>Datum: ${new Date(commit.commit.author.date).toLocaleString()}</p>
                    <p>SHA: ${commit.sha.substring(0, 7)}</p>
                </div>
            `).join('');
    
        } catch (error) {
            console.error('Chyba při načítání historie commitů:', error);
            // Zobrazení chyby uživateli
            const commitList = document.getElementById('commitList');
            if (commitList) {
                commitList.innerHTML = `<div class="error">Nepodařilo se načíst historii commitů: ${error.message}</div>`;
            }
            // Případně můžeme použít alert
            alert('Nepodařilo se načíst historii commitů. ' + error.message);
        }
    }   

        
    // Pomocná funkce pro escape HTML
    function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }


    // Event listener pro změnu repozitáře
    document.getElementById('repoSelect').addEventListener('change', (e) => {
        const repoName = e.target.value;
        repoManager.setCurrentRepo({ name: repoName });
        loadBranches(repoName);
    });

    // Event listener pro nahrání souborů
    document.getElementById('fileUploadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const files = document.getElementById('fileInput').files;
        if (files.length === 0) {
            alert('Vyberte prosím nějaké soubory.');
            return;
        }
        
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = Array.from(files).map(file => `
            <div class="file-item">
                <span>${file.name}</span>
                <span>${(file.size / 1024).toFixed(2)} KB</span>
            </div>
        `).join('');
    });

    // Event listener pro vytvoření commitu
    document.getElementById('commitForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const files = document.getElementById('fileInput').files;
            const message = document.getElementById('commitMessage').value;
            const branch = document.getElementById('branchSelect').value;
    
            if (files.length === 0) {
                alert('Prosím vyberte soubory k nahrání');
                return;
            }
    
            if (!message) {
                alert('Prosím zadejte commit message');
                return;
            }
    
            // Zobrazíme informaci o průběhu
            const submitButton = e.target.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Nahrávání...';
    
            // Vytvoříme commit
            await commitManager.createCommit(Array.from(files), message, branch);
    
            // Obnovíme historii commitů
            const repoName = document.getElementById('repoSelect').value;
            await loadCommitHistory(repoName, branch);
    
            // Vyčistíme formuláře
            document.getElementById('fileUploadForm').reset();
            document.getElementById('commitForm').reset();
            document.getElementById('fileList').innerHTML = '';
    
            alert('Soubory byly úspěšně nahrány!');
    
        } catch (error) {
            console.error('Chyba při vytváření commitu:', error);
            alert(`Chyba při nahrávání: ${error.message}`);
        } finally {
            // Obnovíme tlačítko
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
});