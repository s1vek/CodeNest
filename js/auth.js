class Auth {
    constructor() {
        // Zkusíme načíst uložené údaje při inicializaci
        this.token = localStorage.getItem('github_token') || null;
        this.username = localStorage.getItem('github_username') || null;
        
        // Debug log
        console.log('Auth initialized. Token exists:', !!this.token);
    }

    async login(username, token) {
        try {
            console.log('Pokus o přihlášení...', username);
            
            // Validace vstupu
            if (!username || !token) {
                console.error('Chybějící uživatelské jméno nebo token');
                return false;
            }

            // Testovací endpoint pro ověření tokenu
            const response = await fetch('https://api.github.com/user', {
                method: 'GET',
                headers: {
                    'Authorization': `token ${token}`
                }
            });

            // Detailnější logování
            console.log('Login response status:', response.status);
            
            if (!response.ok) {
                console.error('Přihlášení selhalo:', response.status);
                return false;
            }

            // Uložení údajů
            this.token = token;
            this.username = username;
            localStorage.setItem('github_token', token);
            localStorage.setItem('github_username', username);
            
            return true;
        } catch (error) {
            console.error('Chyba při přihlašování:', error);
            return false;
        }
    }

    logout() {
        this.token = null;
        this.username = null;
        localStorage.removeItem('github_token');
        localStorage.removeItem('github_username');
        console.log('Uživatel odhlášen');
    }

    isLoggedIn() {
        return !!this.token;
    }

    getHeaders() {
        if (!this.token) {
            console.warn('Pokus o získání headers bez přihlášení');
            return {};
        }

        return {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
        };
    }
}