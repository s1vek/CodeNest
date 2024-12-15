class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        // Nastaví téma při načtení
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Přidá přepínač do navigace
        this.addThemeToggle();
        
        // Sleduje systémové preference
        this.watchSystemTheme();
    }

    addThemeToggle() {
        const header = document.querySelector('.header .container');
        const toggle = document.createElement('button');
        toggle.className = 'theme-toggle';
        toggle.innerHTML = `
            <span class="theme-icon light">🌞</span>
            <span class="theme-icon dark">🌙</span>
        `;
        
        toggle.addEventListener('click', () => this.toggleTheme());
        header.appendChild(toggle);
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
    }

    watchSystemTheme() {
        // Sleduje systémové nastavení dark/light mode
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.theme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', this.theme);
            }
        });
    }
}