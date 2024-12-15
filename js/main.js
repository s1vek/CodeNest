document.addEventListener('DOMContentLoaded', () => {
    const auth = new Auth();
    const repoManager = new RepositoryManager(auth);
    const commitManager = new CommitManager(auth, repoManager);
    const visualization = new CommitVisualization();

    // Přihlašovací formulář
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const token = document.getElementById('token').value;

        if (await auth.login(username, token)) {
            document.getElementById('loginSection').classList.add('hidden');
            document.getElementById('mainSection').classList.remove('hidden');
            loadRepositories();
        } else {
            alert('Přihlášení selhalo. Zkontrolujte své údaje.');
        }
    });

    // Načtení repozitářů
    async function loadRepositories() {
        try {
            const repos = await repoManager.fetchUserRepos();
            const select = document.getElementById('repoSelect');
            select.innerHTML = repos.map(repo => 
                `<option value="${repo.name}">${repo.name}</option>`
            ).join('');
            
            // Načtení větví pro první repozitář
            if (repos.length > 0) {
                repoManager.setCurrentRepo(repos[0]);
                loadBranches(repos[0].name);
            }
        } catch (error) {
            console.error('Error loading repositories:', error);
            alert('Nepodařilo se načíst repozitáře.');
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
            const commits = await commitManager.getCommitHistory(repoName, branch);
            visualization.renderCommitHistory(commits);
            visualization.renderBranchTree(commits);
        } catch (error) {
            console.error('Error loading commit history:', error);
            alert('Nepodařilo se načíst historii commitů.');
        }
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
        const files = document.getElementById('fileInput').files;
        const message = document.getElementById('commitMessage').value;
        const branch = document.getElementById('branchSelect').value;

        if (files.length === 0) {
            alert('Vyberte prosím nějaké soubory.');
            return;
        }

        try {
            await commitManager.createCommit(Array.from(files), message, branch);
            alert('Commit byl úspěšně vytvořen!');
            
            // Obnovení historie commitů
            const repoName = document.getElementById('repoSelect').value;
            loadCommitHistory(repoName, branch);
            
            // Reset formulářů
            document.getElementById('fileUploadForm').reset();
            document.getElementById('commitForm').reset();
            document.getElementById('fileList').innerHTML = '';
        } catch (error) {
            console.error('Error creating commit:', error);
            alert('Nepodařilo se vytvořit commit. ' + error.message);
        }
    });
});