class Auth {
    constructor() {
        this.token = null;
        this.username = null;
    }

    async login(username, token) {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                this.token = token;
                this.username = username;
                localStorage.setItem('github_token', token);
                localStorage.setItem('github_username', username);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }

    logout() {
        this.token = null;
        this.username = null;
        localStorage.removeItem('github_token');
        localStorage.removeItem('github_username');
    }

    isLoggedIn() {
        return !!this.token;
    }

    getHeaders() {
        return {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
        };
    }
}