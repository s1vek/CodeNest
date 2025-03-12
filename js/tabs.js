// tabs.js - Správa tabů v rozhraní
document.addEventListener('DOMContentLoaded', () => {
    // Najít všechna tab tlačítka
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // Přidat event listener pro každé tlačítko
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Získat ID tabu, který chceme zobrazit
            const tabId = button.getAttribute('data-tab');
            
            // Odstranit aktivní třídu ze všech tabů
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Odstranit aktivní třídu ze všech tab panelů
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            
            // Přidat aktivní třídu aktuálnímu tlačítku
            button.classList.add('active');
            
            // Zobrazit odpovídající tab panel
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Inicializace formuláře pro vytvoření pull requestu
    const createPrBtn = document.getElementById('createPrBtn');
    const cancelPrBtn = document.getElementById('cancelPrBtn');
    const createPrForm = document.getElementById('createPrForm');
    
    if (createPrBtn && cancelPrBtn && createPrForm) {
        createPrBtn.addEventListener('click', () => {
            createPrForm.classList.remove('hidden');
        });
        
        cancelPrBtn.addEventListener('click', () => {
            createPrForm.classList.add('hidden');
        });
    }

    // Inicializace tlačítka pro novou větev
    const newBranchBtn = document.getElementById('newBranchBtn');
    const newBranchContainer = document.getElementById('newBranchContainer');
    
    if (newBranchBtn && newBranchContainer) {
        newBranchBtn.addEventListener('click', () => {
            newBranchContainer.classList.toggle('hidden');
            
            // Pokud se kontejner zobrazil, zaměřit input
            if (!newBranchContainer.classList.contains('hidden')) {
                document.getElementById('newBranchName').focus();
            }
        });
    }
});