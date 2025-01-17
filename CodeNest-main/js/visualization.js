class CommitVisualization {
    constructor(container) {
        this.container = container;
    }

    renderCommitHistory(commits) {
        const commitList = document.getElementById('commitList');
        commitList.innerHTML = commits.map(commit => `
            <div class="commit">
                <h3>${commit.message}</h3>
                <p>SHA: ${commit.sha.substring(0, 7)}</p>
                <p>Autor: ${commit.author}</p>
                <p>Datum: ${new Date(commit.date).toLocaleString()}</p>
                <a href="${commit.url}" target="_blank">Zobrazit na GitHubu</a>
            </div>
        `).join('');
    }

    renderBranchTree(commits) {
        const branchTree = document.getElementById('branchTree');
        branchTree.innerHTML = '';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', commits.length * 50);
        
        commits.forEach((commit, index) => {
            // Vytvoření bodu commitu
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '20');
            circle.setAttribute('cy', 25 + index * 50);
            circle.setAttribute('r', '5');
            circle.setAttribute('fill', '#2ea44f');
            
            // Vytvoření spojovací čáry
            if (index < commits.length - 1) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', '20');
                line.setAttribute('y1', 30 + index * 50);
                line.setAttribute('x2', '20');
                line.setAttribute('y2', 20 + (index + 1) * 50);
                line.setAttribute('stroke', '#e1e4e8');
                line.setAttribute('stroke-width', '2');
                svg.appendChild(line);
            }
            
            // Přidání textu commitu
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '40');
            text.setAttribute('y', 30 + index * 50);
            text.textContent = `${commit.message} (${commit.sha.substring(0, 7)})`;
            
            svg.appendChild(circle);
            svg.appendChild(text);
        });

        branchTree.appendChild(svg);
    }
}