class CommitManager {
    constructor(auth, repoManager) {
        this.auth = auth;
        this.repoManager = repoManager;
    }

    async createCommit(files, message, branch) {
        try {
            const repo = this.repoManager.currentRepo;
            if (!repo) {
                throw new Error('Není vybrán žádný repozitář');
            }

            // Přidáno logování pro debugování
            console.log('Začínám nahrávání:', {
                repo: repo.name,
                branch: branch,
                filesCount: files.length
            });

            // 1. Nejdřív získáme referenci aktuální větve
            const refResponse = await fetch(
                `https://api.github.com/repos/${repo.name}/git/ref/heads/${branch}`,
                { headers: this.auth.getHeaders() }
            );
            
            if (!refResponse.ok) {
                throw new Error(`Nepodařilo se získat referenci větve: ${refResponse.status}`);
            }
            
            const refData = await refResponse.json();
            const latestCommitSha = refData.object.sha;

            // 2. Pro každý soubor vytvoříme blob
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
                
                if (!blobResponse.ok) {
                    throw new Error(`Nepodařilo se vytvořit blob pro soubor ${file.name}`);
                }
                
                const blobData = await blobResponse.json();
                console.log(`Blob vytvořen pro ${file.name}:`, blobData.sha);
                
                return {
                    path: file.name,
                    mode: '100644',
                    type: 'blob',
                    sha: blobData.sha
                };
            }));

            // 3. Vytvoříme nový tree
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
            
            if (!treeResponse.ok) {
                throw new Error('Nepodařilo se vytvořit tree');
            }
            
            const treeData = await treeResponse.json();

            // 4. Vytvoříme nový commit
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
            
            if (!commitResponse.ok) {
                throw new Error('Nepodařilo se vytvořit commit');
            }
            
            const commitData = await commitResponse.json();

            // 5. Aktualizujeme referenci větve
            const updateRefResponse = await fetch(
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
            
            if (!updateRefResponse.ok) {
                throw new Error('Nepodařilo se aktualizovat referenci větve');
            }

            console.log('Commit úspěšně vytvořen:', commitData.sha);
            return commitData;

        } catch (error) {
            console.error('Chyba při vytváření commitu:', error);
            throw error;
        }
    }

    async readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Odstraníme prefix data URL a získáme čistý base64
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = () => reject(new Error('Nepodařilo se přečíst soubor'));
            reader.readAsDataURL(file);
        });
    }
}