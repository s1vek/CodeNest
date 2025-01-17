class RepositoryManager {
    constructor(auth) {
        this.auth = auth;
        this.currentRepo = null;
    }

    async fetchUserRepos() {
        try {
            const response = await fetch('https://api.github.com/user/repos', {
                headers: this.auth.getHeaders()
            });
            
            if (response.ok) {
                const repos = await response.json();
                return repos.map(repo => ({
                    id: repo.id,
                    name: repo.full_name,
                    defaultBranch: repo.default_branch
                }));
            }
            throw new Error('Failed to fetch repositories');
        } catch (error) {
            console.error('Error fetching repositories:', error);
            throw error;
        }
    }

    async fetchBranches(repoName) {
        try {
            const response = await fetch(`https://api.github.com/repos/${repoName}/branches`, {
                headers: this.auth.getHeaders()
            });
            
            if (response.ok) {
                return await response.json();
            }
            throw new Error('Failed to fetch branches');
        } catch (error) {
            console.error('Error fetching branches:', error);
            throw error;
        }
    }

    setCurrentRepo(repo) {
        this.currentRepo = repo;
    }
}