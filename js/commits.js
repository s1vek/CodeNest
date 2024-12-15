class CommitManager {
    constructor(auth, repoManager) {
        this.auth = auth;
        this.repoManager = repoManager;
    }

    async createCommit(files, message, branch) {
        try {
            const repo = this.repoManager.currentRepo;
            if (!repo) throw new Error('No repository selected');

            // 1. Get the latest commit SHA
            const refResponse = await fetch(
                `https://api.github.com/repos/${repo.name}/git/refs/heads/${branch}`,
                { headers: this.auth.getHeaders() }
            );
            const refData = await refResponse.json();
            const latestCommitSha = refData.object.sha;

            // 2. Create blobs for each file
            const fileBlobs = await Promise.all(files.map(async file => {
                const content = await this.readFileAsBase64(file);
                const blobResponse = await fetch(
                    `https://api.github.com/repos/${repo.name}/git/blobs`,
                    {
                        method: 'POST',
                        headers: this.auth.getHeaders(),
                        body: JSON.stringify({
                            content: content,
                            encoding: 'base64'
                        })
                    }
                );
                const blobData = await blobResponse.json();
                return {
                    path: file.name,
                    mode: '100644',
                    type: 'blob',
                    sha: blobData.sha
                };
            }));

            // 3. Create a tree
            const treeResponse = await fetch(
                `https://api.github.com/repos/${repo.name}/git/trees`,
                {
                    method: 'POST',
                    headers: this.auth.getHeaders(),
                    body: JSON.stringify({
                        base_tree: latestCommitSha,
                        tree: fileBlobs
                    })
                }
            );
            const treeData = await treeResponse.json();

            // 4. Create a commit
            const commitResponse = await fetch(
                `https://api.github.com/repos/${repo.name}/git/commits`,
                {
                    method: 'POST',
                    headers: this.auth.getHeaders(),
                    body: JSON.stringify({
                        message: message,
                        tree: treeData.sha,
                        parents: [latestCommitSha]
                    })
                }
            );
            const commitData = await commitResponse.json();

            // 5. Update the reference
            await fetch(
                `https://api.github.com/repos/${repo.name}/git/refs/heads/${branch}`,
                {
                    method: 'PATCH',
                    headers: this.auth.getHeaders(),
                    body: JSON.stringify({
                        sha: commitData.sha,
                        force: true
                    })
                }
            );

            return commitData;
        } catch (error) {
            console.error('Error creating commit:', error);
            throw error;
        }
    }

    async readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const content = reader.result.split(',')[1];
                resolve(content);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async getCommitHistory(repoName, branch) {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${repoName}/commits?sha=${branch}`,
                { headers: this.auth.getHeaders() }
            );
            
            if (response.ok) {
                const commits = await response.json();
                return commits.map(commit => ({
                    sha: commit.sha,
                    message: commit.commit.message,
                    author: commit.commit.author.name,
                    date: commit.commit.author.date,
                    url: commit.html_url
                }));
            }
            throw new Error('Failed to fetch commit history');
        } catch (error) {
            console.error('Error fetching commit history:', error);
            throw error;
        }
    }
}