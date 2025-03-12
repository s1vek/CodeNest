document.addEventListener('DOMContentLoaded', () => {
    console.log('Login script načten');
    
    // Najít přihlašovací formulář
    const loginForm = document.querySelector('.login-form form') || 
                     document.querySelector('form') || 
                     document.querySelector('#loginForm');
    
    if (loginForm) {
        console.log('Formulář nalezen:', loginForm);
        
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error('Přihlašovací formulář nenalezen!');
    }

    // Funkce pro zpracování přihlášení
    async function handleLogin(e) {
        e.preventDefault();
        console.log('Odesílání formuláře');
        
        // Najít vstupní pole
        const inputs = loginForm.querySelectorAll('input');
        console.log('Nalezeno vstupních polí:', inputs.length);
        
        let usernameInput = null;
        let tokenInput = null;
        
        // Procházet všechna nalezená pole a určit, které je pro jméno a které pro token
        inputs.forEach(input => {
            if (input.type === 'password') {
                tokenInput = input;
            } else if (input.type === 'text' || input.type === 'email') {
                usernameInput = input;
            }
        });
        
        // Alternativní způsob hledání
        if (!usernameInput) {
            usernameInput = document.querySelector('input[id="username"]') || 
                           document.querySelector('input[placeholder*="jméno"]') ||
                           inputs[0];
        }
        
        if (!tokenInput) {
            tokenInput = document.querySelector('input[id="token"]') || 
                        document.querySelector('input[type="password"]') ||
                        inputs[1];
        }
        
        if (!usernameInput) {
            console.error('Pole pro uživatelské jméno nenalezeno');
            alert('Chyba: Pole pro uživatelské jméno nenalezeno');
            return;
        }
        
        if (!tokenInput) {
            console.error('Pole pro token nenalezeno');
            alert('Chyba: Pole pro token nenalezeno');
            return;
        }
        
        // Získáme hodnoty
        const username = usernameInput.value || '';
        const token = tokenInput.value || '';
        
        console.log('Přihlašovací údaje:', { 
            username: username ? username : 'prázdné', 
            tokenLength: token.length 
        });
        
        if (!username || !token) {
            alert('Prosím vyplňte uživatelské jméno a token');
            return;
        }
        
        // Získáme tlačítko
        const loginBtn = loginForm.querySelector('button[type="submit"]') || 
                        loginForm.querySelector('button') ||
                        loginForm.querySelector('input[type="submit"]');
        
        if (loginBtn) {
            const originalText = loginBtn.textContent || 'Přihlásit se';
            loginBtn.disabled = true;
            loginBtn.textContent = 'Přihlašování...';
        }
        
        try {
            // Předpokládáme, že třída Auth již existuje globálně
            if (typeof Auth !== 'undefined' && window.auth) {
                console.log('Používám existující instanci Auth');
                
                const success = await window.auth.login(username, token);
                
                if (success) {
                    console.log('Přihlášení úspěšné');
                    
                    // Skryjeme login a zobrazíme hlavní obsah
                    document.getElementById('loginSection').classList.add('hidden');
                    document.getElementById('mainSection').classList.remove('hidden');
                    
                    // Pokusíme se načíst repozitáře, pokud funkce existuje
                    if (typeof loadRepositories === 'function') {
                        loadRepositories();
                    } else {
                        console.log('Funkce loadRepositories neexistuje');
                        // Obnovíme stránku pro případ, že je potřeba načíst další skripty
                        location.reload();
                    }
                } else {
                    console.error('Přihlášení se nezdařilo');
                    alert('Přihlášení selhalo - neplatný token nebo uživatelské jméno');
                }
            } else {
                console.error('Auth není definován nebo není k dispozici');
                alert('Chyba: Autentizační systém není k dispozici');
            }
        } catch (error) {
            console.error('Chyba při přihlašování:', error);
            alert('Přihlášení selhalo: ' + (error.message || 'Neznámá chyba'));
        } finally {
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = originalText || 'Přihlásit se';
            }
        }
    }
});