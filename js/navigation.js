// Přidejte tento kód pro správnou navigaci mezi sekcemi pomocí tlačítek
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializace navigačních tlačítek');
    
    // Vytvoření navigačních tlačítek pokud chybí
    const mainSection = document.getElementById('mainSection');
    if (mainSection) {
        // Zkontrolujeme, zda již existují tlačítka pro navigaci
        const existingNavButtons = document.querySelector('.navigation-buttons');
        
        if (!existingNavButtons) {
            console.log('Vytvářím navigační tlačítka');
            
            // Vytvoření navigačních tlačítek
            const navButtons = document.createElement('div');
            navButtons.className = 'navigation-buttons';
            navButtons.style.marginBottom = '16px';
            
            // Tlačítka pro navigaci
            navButtons.innerHTML = `
                <button class="nav-btn" data-section="files-section">Soubory</button>
                <button class="nav-btn" data-section="pull-requests-section">Pull Requesty</button>
                <button class="nav-btn" data-section="diff-section">Porovnání změn</button>
            `;
            
            // Vložení před první sekci
            const firstSection = mainSection.querySelector('.file-upload, .repo-select');
            if (firstSection && firstSection.parentNode) {
                firstSection.parentNode.insertBefore(navButtons, firstSection);
            } else {
                // Pokud nemůžeme najít první sekci, vložíme na začátek
                mainSection.insertBefore(navButtons, mainSection.firstChild);
            }
            
            // Přidání event listenerů
            const buttons = navButtons.querySelectorAll('.nav-btn');
            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    const sectionName = button.getAttribute('data-section');
                    showSection(sectionName);
                    
                    // Označení aktivního tlačítka
                    buttons.forEach(btn => {
                        btn.classList.remove('active');
                    });
                    button.classList.add('active');
                });
            });
            
            // Defaultně nastavíme první tlačítko jako aktivní
            buttons[0].classList.add('active');
        }
    }
    
    // Funkce pro zobrazení sekce
    function showSection(sectionName) {
        console.log('Přepínám na sekci:', sectionName);
        
        // Skryjeme všechny sekce
        const fileSections = document.querySelectorAll('.file-upload, .commit-form, .commit-history');
        const prSections = document.querySelectorAll('.pull-requests-section');
        const diffSections = document.querySelectorAll('.diff-viewer-section');
        
        fileSections.forEach(section => {
            section.style.display = 'none';
        });
        
        prSections.forEach(section => {
            section.style.display = 'none';
        });
        
        diffSections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Zobrazíme požadovanou sekci
        switch(sectionName) {
            case 'files-section':
                fileSections.forEach(section => {
                    section.style.display = 'block';
                });
                break;
            case 'pull-requests-section':
                prSections.forEach(section => {
                    section.style.display = 'block';
                });
                break;
            case 'diff-section':
                diffSections.forEach(section => {
                    section.style.display = 'block';
                });
                break;
        }
    }
    
    // Také upravíme existující tlačítka pokud existují
    const souborybtn = document.querySelector('button:contains("Soubory")');
    const pullbtn = document.querySelector('button:contains("Pull Requesty")');
    const diffbtn = document.querySelector('button:contains("Porovnání změn")');
    
    if (souborybtn) {
        souborybtn.addEventListener('click', () => showSection('files-section'));
    }
    
    if (pullbtn) {
        pullbtn.addEventListener('click', () => showSection('pull-requests-section'));
    }
    
    if (diffbtn) {
        diffbtn.addEventListener('click', () => showSection('diff-section'));
    }
    
    // Přidání funkce pro vyhledávání textu v tlačítkách (jako v jQuery)
    if (!document.querySelector.toString().includes(':contains')) {
        // Polyfill pro :contains selector
        const originalQuerySelector = document.querySelector;
        document.querySelector = function(selector) {
            if (selector.includes(':contains')) {
                const parts = selector.split(':contains');
                const elementSelector = parts[0] || '*';
                const textToMatch = parts[1].replace(/[()'"]/g, '').trim();
                
                const elements = document.querySelectorAll(elementSelector);
                for (let i = 0; i < elements.length; i++) {
                    if (elements[i].textContent.includes(textToMatch)) {
                        return elements[i];
                    }
                }
                return null;
            }
            return originalQuerySelector.call(this, selector);
        };
    }
});