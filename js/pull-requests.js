class PullRequestManager {
    constructor(auth, repoManager) {
        this.auth = auth;
        this.repoManager = repoManager;
    }

    async fetchPullRequests() {
        try {
            const repo = this.repoManager.currentRepo;
            if (!repo) {
                throw new Error('Není vybrán žádný repozitář');
            }

            const response = await fetch(
                `https://api.github.com/repos/${repo.name}/pulls?state=all`,
                { headers: this.auth.getHeaders() }
            );

            if (!response.ok) {
                throw new Error(`Nepodařilo se načíst pull requesty: ${response.status}`);
            }

            const pullRequests = await response.json();
            return pullRequests;
        } catch (error) {
            console.error('Chyba při načítání pull requestů:', error);
            throw error;
        }
    }

    async createPullRequest(title, body, head, base) {
        try {
            const repo = this.repoManager.currentRepo;
            if (!repo) {
                throw new Error('Není vybrán žádný repozitář');
            }

            const response = await fetch(
                `https://api.github.com/repos/${repo.name}/pulls`,
                {
                    method: 'POST',
                    headers: this.auth.getHeaders(),
                    body: JSON.stringify({
                        title,
                        body,
                        head,
                        base
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Nepodařilo se vytvořit pull request: ${errorData.message || response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Chyba při vytváření pull requestu:', error);
            throw error;
        }
    }

    async getPullRequestDetails(pullNumber) {
        try {
            const repo = this.repoManager.currentRepo;
            if (!repo) {
                throw new Error('Není vybrán žádný repozitář');
            }

            const response = await fetch(
                `https://api.github.com/repos/${repo.name}/pulls/${pullNumber}`,
                { headers: this.auth.getHeaders() }
            );

            if (!response.ok) {
                throw new Error(`Nepodařilo se načíst detail pull requestu: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Chyba při načítání detailu pull requestu:', error);
            throw error;
        }
    }

    async getPullRequestComments(pullNumber) {
        try {
            const repo = this.repoManager.currentRepo;
            if (!repo) {
                throw new Error('Není vybrán žádný repozitář');
            }

            const response = await fetch(
                `https://api.github.com/repos/${repo.name}/pulls/${pullNumber}/comments`,
                { headers: this.auth.getHeaders() }
            );

            if (!response.ok) {
                throw new Error(`Nepodařilo se načíst komentáře pull requestu: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Chyba při načítání komentářů pull requestu:', error);
            throw error;
        }
    }

    async mergePullRequest(pullNumber, commitMessage) {
        try {
            const repo = this.repoManager.currentRepo;
            if (!repo) {
                throw new Error('Není vybrán žádný repozitář');
            }

            const response = await fetch(
                `https://api.github.com/repos/${repo.name}/pulls/${pullNumber}/merge`,
                {
                    method: 'PUT',
                    headers: this.auth.getHeaders(),
                    body: JSON.stringify({
                        commit_message: commitMessage || `Merge pull request #${pullNumber}`
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Nepodařilo se provést merge pull requestu: ${errorData.message || response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Chyba při merge pull requestu:', error);
            throw error;
        }
    }

    renderPullRequests(pullRequests, container) {
        if (!container) return;
        
        // Pokud nemáme žádné pull requesty
        if (!pullRequests || pullRequests.length === 0) {
            container.innerHTML = '<div class="empty-state">Žádné pull requesty k zobrazení</div>';
            return;
        }

        // Vytvoření HTML pro každý pull request
        const prHTML = pullRequests.map(pr => `
            <div class="pull-request" data-pr-id="${pr.number}">
                <div class="pr-header">
                    <h3>${this.escapeHtml(pr.title)}</h3>
                    <span class="status-badge ${pr.state === 'open' ? 'success' : 'error'}">
                        ${pr.state}
                    </span>
                </div>
                <p class="pr-info">
                    <span>#${pr.number}</span> 
                    otevřel <strong>${this.escapeHtml(pr.user.login)}</strong> 
                    ${this.formatDate(pr.created_at)}
                </p>
                <div class="pr-branches">
                    <code>${this.escapeHtml(pr.head.label)}</code> → 
                    <code>${this.escapeHtml(pr.base.label)}</code>
                </div>
                <div class="pr-actions">
                    <button class="view-pr-btn" data-pr-id="${pr.number}">Zobrazit detail</button>
                    ${pr.state === 'open' ? `<button class="merge-pr-btn" data-pr-id="${pr.number}">Merge</button>` : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = prHTML;

        // Přidání event listenerů na tlačítka
        container.querySelectorAll('.view-pr-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const prId = e.target.dataset.prId;
                this.showPullRequestDetail(prId);
            });
        });

        container.querySelectorAll('.merge-pr-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const prId = e.target.dataset.prId;
                if (confirm(`Opravdu chcete provést merge pull requestu #${prId}?`)) {
                    try {
                        await this.mergePullRequest(prId);
                        alert('Pull request byl úspěšně sloučen');
                        // Obnovit seznam po merge
                        this.loadPullRequests();
                    } catch (error) {
                        alert(`Chyba při slučování: ${error.message}`);
                    }
                }
            });
        });
    }

    async showPullRequestDetail(pullNumber) {
        try {
            const prDetails = await this.getPullRequestDetails(pullNumber);
            const prComments = await this.getPullRequestComments(pullNumber);
            
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Pull Request #${pullNumber}: ${this.escapeHtml(prDetails.title)}</h2>
                        <button class="close-modal">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="pr-detail-status">
                            <span class="status-badge ${prDetails.state === 'open' ? 'success' : 'error'}">
                                ${prDetails.state}
                            </span>
                            <span class="pr-author">
                                Autor: <strong>${this.escapeHtml(prDetails.user.login)}</strong>
                            </span>
                            <span class="pr-date">
                                Vytvořeno: ${this.formatDate(prDetails.created_at)}
                            </span>
                        </div>
                        <div class="pr-description">
                            <h3>Popis</h3>
                            <div class="markdown-content">
                                ${prDetails.body ? this.escapeHtml(prDetails.body) : '<em>Bez popisu</em>'}
                            </div>
                        </div>
                        <div class="pr-branches-detail">
                            <h3>Větve</h3>
                            <p>
                                <strong>Z:</strong> ${this.escapeHtml(prDetails.head.label)}<br>
                                <strong>Do:</strong> ${this.escapeHtml(prDetails.base.label)}
                            </p>
                        </div>
                        <div class="pr-comments">
                            <h3>Komentáře (${prComments.length})</h3>
                            ${prComments.length > 0 ? 
                                `<ul class="comments-list">
                                    ${prComments.map(comment => `
                                        <li class="comment">
                                            <div class="comment-header">
                                                <strong>${this.escapeHtml(comment.user.login)}</strong>
                                                <span>${this.formatDate(comment.created_at)}</span>
                                            </div>
                                            <div class="comment-body">
                                                ${this.escapeHtml(comment.body)}
                                            </div>
                                        </li>
                                    `).join('')}
                                </ul>` : 
                                '<p>Žádné komentáře</p>'
                            }
                        </div>
                        ${prDetails.state === 'open' ? `
                            <div class="pr-actions-detail">
                                <button class="merge-pr-btn-detail" data-pr-id="${pullNumber}">Merge Pull Request</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Přidání event listenerů
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.remove();
            });

            const mergeBtn = modal.querySelector('.merge-pr-btn-detail');
            if (mergeBtn) {
                mergeBtn.addEventListener('click', async () => {
                    if (confirm(`Opravdu chcete provést merge pull requestu #${pullNumber}?`)) {
                        try {
                            await this.mergePullRequest(pullNumber);
                            alert('Pull request byl úspěšně sloučen');
                            modal.remove();
                            // Obnovit seznam po merge
                            this.loadPullRequests();
                        } catch (error) {
                            alert(`Chyba při slučování: ${error.message}`);
                        }
                    }
                });
            }

        } catch (error) {
            console.error('Chyba při zobrazení detailu pull requestu:', error);
            alert(`Nepodařilo se načíst detail pull requestu: ${error.message}`);
        }
    }

    async loadPullRequests() {
        try {
            const prContainer = document.getElementById('pullRequestList');
            if (!prContainer) return;

            prContainer.innerHTML = '<div class="loading">Načítání pull requestů...</div>';
            
            const pullRequests = await this.fetchPullRequests();
            this.renderPullRequests(pullRequests, prContainer);
        } catch (error) {
            console.error('Chyba při načítání pull requestů:', error);
            const prContainer = document.getElementById('pullRequestList');
            if (prContainer) {
                prContainer.innerHTML = `
                    <div class="error">
                        Nepodařilo se načíst pull requesty: ${error.message}
                    </div>
                `;
            }
        }
    }

    escapeHtml(unsafe) {
        return unsafes
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('cs-CZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}