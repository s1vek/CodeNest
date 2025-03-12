document.addEventListener('DOMContentLoaded', () => {
    // Globální instance pro použití v jiných skriptech
    window.auth = new Auth();
    
    // Kontrola, zda jsou ostatní třídy definovány
    const hasRepoManager = typeof RepositoryManager !== 'undefined';
    const hasCommitManager = typeof CommitManager !== 'undefined';
    const hasDiffViewer = typeof DiffViewer !== 'undefined';
    
    console.log('Dostupné komponenty:', { 
        hasRepoManager, 
        hasCommitManager, 
        hasDiffViewer
    });
    
    // Inicializace manageru repozitářů pouze pokud existuje
    let repoManager = null;
    let commitManager = null;
    
    if (hasRepoManager) {
        repoManager = new RepositoryManager(window.auth);
        window.repoManager = repoManager;
    }
    
    if (hasCommitManager && repoManager) {
        commitManager = new CommitManager(window.auth, repoManager);
        window.commitManager = commitManager;
    }
    
    // Inicializace diff vieweru, pouze pokud existuje
    if (hasDiffViewer) {
        window.diffViewer = new DiffViewer(window.auth);
        try {
            window.diffViewer.initEventListeners();
        } catch (error) {
            console.error('Chyba při inicializaci DiffViewer:', error);
        }
    }
    
    // Kontrola přihlášení a inicializace UI
    initUI();
    
    // Kontrola, zda je uživatel přihlášený
    function initUI() {
        const token = localStorage.getItem('github_token');
        const username = localStorage.getItem('github_username');
        
        console.log('Kontrola přihlášení:', { 
            hasToken: !!token, 
            hasUsername: !!username 
        });
        
        if (token && username) {
            // Automatické přihlášení
            window.auth.login(username, token).then(success => {
                if (success) {
                    showMainUI(username);
                    
                    // Načtení repozitářů, pokud je k dispozici repoManager
                    if (repoManager) {
                        loadRepositories();
                    }
                } else {
                    // Token není platný, vymažeme ho
                    window.auth.logout();
                    showLoginUI();
                }
            });
        } else {
            showLoginUI();
        }
    }
    
    // Funkce pro zobrazení login/main UI
    function showLoginUI() {
        const loginSection = document.getElementById('loginSection');
        const mainSection = document.getElementById('mainSection');
        const logoutBtn = document.getElementById('logoutBtn');
        const userInfo = document.getElementById('userInfo');
        
        if (loginSection) loginSection.classList.remove('hidden');
        if (mainSection) mainSection.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (userInfo) userInfo.classList.add('hidden');
    }
    
    function showMainUI(username) {
        const loginSection = document.getElementById('loginSection');
        const mainSection = document.getElementById('mainSection');
        const logoutBtn = document.getElementById('logoutBtn');
        const userInfo = document.getElementById('userInfo');
        
        if (loginSection) loginSection.classList.add('hidden');
        if (mainSection) mainSection.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        
        if (userInfo) {
            userInfo.classList.remove('hidden');
            const usernameElement = userInfo.querySelector('#username');
            if (usernameElement) {
                usernameElement.textContent = username;
            }
        }
    }
    
    // Definice funkcí, které budou používány z jiných skriptů
    window.loadRepositories = loadRepositories;
    window.showMainUI = showMainUI;
    window.showLoginUI = showLoginUI;
    
    // Načtení repozitářů
    async function loadRepositories() {
        if (!repoManager) {
            console.error('RepoManager není k dispozici');
            return;
        }
        
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
            const select = document.getElementById('repoSelect');
            if (select) {
                select.innerHTML = '<option value="">Chyba při načítání</option>';
            }
        }
    }
    
    // Definice dalších funkcí, ale jen pokud jsou potřebné komponenty
    if (repoManager) {
        // Přidání event listenerů pouze pokud jsou odpovídající elementy v DOM
        const repoSelect = document.getElementById('repoSelect');
        if (repoSelect) {
            repoSelect.addEventListener('change', (e) => {
                const repoName = e.target.value;
                repoManager.setCurrentRepo({ name: repoName });
                loadBranches(repoName);
            });
        }
        
        // Odhlášení
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.auth.logout();
                showLoginUI();
            });
        }
    }
    
    // Další funkce...
    async function loadBranches(repoName) {
        // Implementace...
    }
    
    // Pomocná funkce pro bezpečný HTML escape
    window.escapeHtml = function(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
    
    function showLoginUI() {
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('mainSection').classList.add('hidden');
        document.getElementById('logoutBtn').classList.add('hidden');
        document.getElementById('userInfo').classList.add('hidden');
    }
    
    function showMainUI(username) {
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('mainSection').classList.remove('hidden');
        document.getElementById('logoutBtn').classList.remove('hidden');
        
        const userInfoElement = document.getElementById('userInfo');
        userInfoElement.classList.remove('hidden');
        userInfoElement.querySelector('#username').textContent = username;
    }

    // Event listener pro formulář přihlášení
   // Oprava konkrétní části main.js, která způsobuje chybu s metodou trim()

// Event listener pro formulář přihlášení
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Bezpečné získání hodnot - ověření, že jsou elementy k dispozici
    const usernameInput = document.getElementById('username');
    const tokenInput = document.getElementById('token');
    
    if (!usernameInput || !tokenInput) {
        console.error('Formulářové prvky nenalezeny');
        alert('Chyba při získávání formulářových prvků');
        return;
    }
    
    // Bezpečné získání hodnot s výchozími prázdnými řetězci, pokud nejsou definovány
    const username = usernameInput.value ? usernameInput.value.trim() : '';
    const token = tokenInput.value ? tokenInput.value.trim() : '';
    
    console.log('Pokus o přihlášení:', { username: username ? 'zadáno' : 'prázdné' });
    
    if (!username || !token) {
        alert('Prosím vyplňte uživatelské jméno a token');
        return;
    }
    
    // Získejte tlačítko pro přihlášení
    const loginBtn = e.target.querySelector('button[type="submit"]');
    if (!loginBtn) {
        console.error('Přihlašovací tlačítko nenalezeno');
        return;
    }
    
    const originalText = loginBtn.textContent || 'Přihlásit se';
    loginBtn.disabled = true;
    loginBtn.textContent = 'Přihlašování...';
    
    try {
        const success = await auth.login(username, token);
        
        if (success) {
            showMainUI(username);
            loadRepositories();
        } else {
            alert('Přihlášení selhalo - neplatný token nebo uživatelské jméno');
        }
    } catch (error) {
        console.error('Chyba při přihlašování:', error);
        alert('Přihlášení selhalo: ' + (error.message || 'Neznámá chyba'));
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = originalText;
    }
});
    
    // Event listener pro odhlášení
    document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.logout();
        showLoginUI();
    });

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
            const branchSelect = document.getElementById('branchSelect');
            const sourceBranch = document.getElementById('sourceBranch');
            const targetBranch = document.getElementById('targetBranch');
            
            const options = branches.map(branch => 
                `<option value="${branch.name}">${branch.name}</option>`
            ).join('');
            
            if (branchSelect) branchSelect.innerHTML = options;
            if (sourceBranch) sourceBranch.innerHTML = options;
            if (targetBranch) targetBranch.innerHTML = options;
            
            // Načtení historie commitů
            loadCommitHistory(repoName, branches[0].name);
        } catch (error) {
            console.error('Chyba při načítání větví:', error);
            alert('Nepodařilo se načíst větve.');
        }
    }

    // Načtení historie commitů
    async function loadCommitHistory(repoName, branch) {
        try {
            console.log('Načítám historii commitů pro:', { repoName, branch });
    
            if (!repoName) {
                throw new Error('Není specifikován repozitář');
            }
            if (!branch) {
                branch = 'main'; // Výchozí větev pokud není specifikována
            }
    
            const url = `https://api.github.com/repos/${repoName}/commits?sha=${branch}&per_page=10`;
            console.log('Požadavek na URL:', url);
    
            const response = await fetch(url, {
                headers: auth.getHeaders()
            });
    
            if (!response.ok) {
                throw new Error(`GitHub API vrátilo chybu: ${response.status} ${response.statusText}`);
            }
    
            const commits = await response.json();
            console.log('Načtené commity:', commits.length);
    
            const commitList = document.getElementById('commitList');
            if (!commitList) {
                throw new Error('Element commitList nebyl nalezen');
            }
    
            if (commits.length === 0) {
                commitList.innerHTML = '<div class="empty-state">Žádné commity k zobrazení</div>';
                return;
            }
    
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
            const commitList = document.getElementById('commitList');
            if (commitList) {
                commitList.innerHTML = `<div class="error">Nepodařilo se načíst historii commitů: ${error.message}</div>`;
            }
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
            const branchSelect = document.getElementById('branchSelect');
            const newBranchName = document.getElementById('newBranchName').value.trim();
            const branch = newBranchName || branchSelect.value;
    
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
    
    // Inicializace diff vieweru
    diffViewer.initEventListeners();
;

document.addEventListener('DOMContentLoaded', function() {
    // Najít tlačítka v navigaci
    const tabButtons = document.querySelectorAll('.tabs button, button[data-section], .navigation-buttons button');
    
    // Pokud nebyly nalezeny žádné specifické tlačítka, zkusit najít podle textu
    if (tabButtons.length === 0) {
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(button => {
            const text = button.textContent.trim().toLowerCase();
            if (text === 'soubory' || text.includes('pull requesty') || text.includes('porovnání změn')) {
                button.addEventListener('click', handleTabClick);
            }
        });
    } else {
        tabButtons.forEach(button => {
            button.addEventListener('click', handleTabClick);
        });
    }
    
    // Funkce pro obsluhu kliknutí na tlačítko
    function handleTabClick(e) {
        const buttonText = e.target.textContent.trim().toLowerCase();
        
        // Odstranit aktivní třídu ze všech tlačítek
        document.querySelectorAll('button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Přidat aktivní třídu na kliknuté tlačítko
        e.target.classList.add('active');
        
        // Přepnout sekci podle textu tlačítka
        if (buttonText.includes('soubor')) {
            showSection('files');
        } else if (buttonText.includes('pull')) {
            showSection('pull');
        } else if (buttonText.includes('porovnání')) {
            showSection('diff');
        }
    }
    
    // Funkce pro zobrazení příslušné sekce
    function showSection(sectionType) {
        console.log('Přepínám na: ' + sectionType);
        
        // Najít všechny sekce
        const fileSections = document.querySelectorAll('.file-upload, .commit-form, .commit-history');
        const pullRequestsSection = document.querySelector('.pull-requests-section');
        const diffSection = document.querySelector('.diff-viewer-section');
        
        // Skrýt všechny sekce
        fileSections.forEach(section => {
            section.style.display = 'none';
        });
        
        if (pullRequestsSection) pullRequestsSection.style.display = 'none';
        if (diffSection) diffSection.style.display = 'none';
        
        // Zobrazit požadovanou sekci
        if (sectionType === 'files') {
            fileSections.forEach(section => {
                section.style.display = 'block';
            });
        } else if (sectionType === 'pull' && pullRequestsSection) {
            pullRequestsSection.style.display = 'block';
        } else if (sectionType === 'diff' && diffSection) {
            diffSection.style.display = 'block';
        }
    }
    
    // Defaultně aktivovat první tlačítko (Soubory)
    const firstButton = document.querySelector('button[data-section], .tabs button:first-child');
    if (firstButton) {
        firstButton.click();
    } else {
        // Pokud neexistuje specifické tlačítko, defaultně zobrazit sekci souborů
        showSection('files');
    }
});
