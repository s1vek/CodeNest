// src/services/github.js
import { Octokit } from "@octokit/rest";

/**
 * Služba pro komunikaci s GitHub API
 */
class GitHubService {
  constructor() {
    this.octokit = null;
  }

  /**
   * Inicializace GitHub klienta s tokenem
   * @param {string} token - GitHub Personal Access Token
   */
  init(token) {
    this.octokit = new Octokit({ auth: token });
  }

  /**
   * Získání informací o přihlášeném uživateli
   * @returns {Promise<Object>} Data uživatele
   */
  async getUser() {
    try {
      const { data } = await this.octokit.users.getAuthenticated();
      return data;
    } catch (error) {
      console.error("Chyba při získávání dat uživatele:", error);
      throw error;
    }
  }

  /**
   * Získání seznamu repozitářů uživatele
   * @returns {Promise<Array>} Seznam repozitářů
   */
  async getRepositories() {
    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        sort: "updated",
        per_page: 100
      });
      return data;
    } catch (error) {
      console.error("Chyba při získávání repozitářů:", error);
      throw error;
    }
  }

  /**
   * Získání detailů repozitáře
   * @param {string} owner - Vlastník repozitáře
   * @param {string} repo - Název repozitáře
   * @returns {Promise<Object>} Data repozitáře
   */
  async getRepository(owner, repo) {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo
      });
      return data;
    } catch (error) {
      console.error("Chyba při získávání repozitáře:", error);
      throw error;
    }
  }

  /**
   * Získání větví repozitáře
   * @param {string} owner - Vlastník repozitáře
   * @param {string} repo - Název repozitáře
   * @returns {Promise<Array>} Seznam větví
   */
  async getBranches(owner, repo) {
    try {
      const { data } = await this.octokit.repos.listBranches({
        owner,
        repo,
        per_page: 100
      });
      return data;
    } catch (error) {
      console.error("Chyba při získávání větví:", error);
      throw error;
    }
  }

  /**
   * Získání commitů repozitáře
   * @param {string} owner - Vlastník repozitáře
   * @param {string} repo - Název repozitáře
   * @param {number} page - Číslo stránky
   * @param {string} branch - Název větve (volitelné)
   * @returns {Promise<Array>} Seznam commitů
   */
  async getCommits(owner, repo, page = 1, branch) {
    try {
      const params = {
        owner,
        repo,
        per_page: 10,
        page
      };

      // Pokud je zadaná větev, přidáme ji do parametrů
      if (branch) {
        params.sha = branch;
      }

      const { data } = await this.octokit.repos.listCommits(params);
      return data;
    } catch (error) {
      console.error("Chyba při získávání commitů:", error);
      throw error;
    }
  }

  /**
   * Získání detailů commitu
   * @param {string} owner - Vlastník repozitáře
   * @param {string} repo - Název repozitáře
   * @param {string} sha - SHA identifikátor commitu
   * @returns {Promise<Object>} Detaily commitu
   */
  async getCommitDetails(owner, repo, sha) {
    try {
      const { data } = await this.octokit.repos.getCommit({
        owner,
        repo,
        ref: sha
      });
      return data;
    } catch (error) {
      console.error("Chyba při získávání detailů commitu:", error);
      throw error;
    }
  }

  /**
   * Získání obsahu adresáře v repozitáři
   * @param {string} owner - Vlastník repozitáře
   * @param {string} repo - Název repozitáře
   * @param {string} path - Cesta k adresáři (prázdná pro kořenový adresář)
   * @param {string} branch - Název větve (volitelné)
   * @returns {Promise<Array>} Seznam souborů a adresářů
   */
  async getDirectoryContent(owner, repo, path = "", branch) {
    try {
      const params = {
        owner,
        repo,
        path
      };

      // Pokud je zadaná větev, přidáme ji do parametrů
      if (branch) {
        params.ref = branch;
      }

      const { data } = await this.octokit.repos.getContent(params);

      // GitHub API vrací pole pro adresáře, objekt pro soubory
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error("Chyba při získávání obsahu adresáře:", error);
      throw error;
    }
  }

  /**
   * Získání obsahu souboru
   * @param {string} owner - Vlastník repozitáře
   * @param {string} repo - Název repozitáře
   * @param {string} path - Cesta k souboru
   * @param {string} branch - Název větve (volitelné)
   * @returns {Promise<Object>} Obsah souboru a metadata
   */
  async getFileContent(owner, repo, path, branch) {
    try {
      const params = {
        owner,
        repo,
        path,
        headers: {
          'Accept': 'application/vnd.github.v3.raw'
        }
      };

      // Pokud je zadaná větev, přidáme ji do parametrů
      if (branch) {
        params.ref = branch;
      }

      const { data } = await this.octokit.repos.getContent(params);
      
      // Kontrola, zda je výsledek objekt s content vlastností (Base64 kódované)
      if (data && data.content && data.encoding === 'base64') {
        return {
          content: Buffer.from(data.content, 'base64').toString('utf-8'),
          sha: data.sha,
          name: data.name,
          path: data.path
        };
      } 
      // Pokud API vrátí přímo obsah (není Base64 kódovaný)
      else if (typeof data === 'string') {
        return {
          content: data,
          path: path,
          name: path.split('/').pop()
        };
      }
      // Jiný formát dat
      else {
        if (typeof data === 'object' && !data.content) {
          throw new Error("GitHub API nevrátilo obsah souboru - možná je soubor příliš velký");
        }
        return {
          content: JSON.stringify(data, null, 2),
          path: path,
          name: path.split('/').pop()
        };
      }
    } catch (error) {
      console.error("Chyba při získávání obsahu souboru:", error);
      throw error;
    }
  }

  /**
   * Vytvoření nebo aktualizace souboru (commit)
   * @param {string} owner - Vlastník repozitáře
   * @param {string} repo - Název repozitáře
   * @param {string} path - Cesta k souboru
   * @param {string} message - Commit message
   * @param {string} content - Obsah souboru
   * @param {string} branch - Název větve
   * @param {string} sha - SHA existujícího souboru (při aktualizaci)
   * @returns {Promise<Object>} Výsledek operace
   */
  async createCommit(owner, repo, path, message, content, branch, sha) {
    try {
      // Konverze obsahu do Base64 - oprava pro prohlížeč (nepoužívá Node.js Buffer)
      const base64Content = btoa(unescape(encodeURIComponent(content)));
      
      const params = {
        owner,
        repo,
        path,
        message,
        content: base64Content
      };

      // Přidáme SHA, pokud je k dispozici (pro aktualizaci existujícího souboru)
      if (sha) {
        params.sha = sha;
      }

      // Přidáme větev, pokud je zadaná
      if (branch) {
        params.branch = branch;
      }

      const { data } = await this.octokit.repos.createOrUpdateFileContents(params);
      return data;
    } catch (error) {
      console.error("Chyba při vytváření commitu:", error);
      throw error;
    }
  }

  /**
   * Získání pull requestů repozitáře
   * @param {string} owner - Vlastník repozitáře
   * @param {string} repo - Název repozitáře
   * @returns {Promise<Array>} Seznam pull requestů
   */
  async getPullRequests(owner, repo) {
    try {
      const { data } = await this.octokit.pulls.list({
        owner,
        repo,
        state: "all"
      });
      return data;
    } catch (error) {
      console.error("Chyba při získávání pull requestů:", error);
      throw error;
    }
  }

  async createCommitWithBase64(owner, repo, path, message, base64Content, branch, sha) {
    try {
      const params = {
        owner,
        repo,
        path,
        message,
        content: base64Content
      };

      // Přidáme SHA, pokud je k dispozici (pro aktualizaci existujícího souboru)
      if (sha) {
        params.sha = sha;
      }

      // Přidáme větev, pokud je zadaná
      if (branch) {
        params.branch = branch;
      }

      const { data } = await this.octokit.repos.createOrUpdateFileContents(params);
      return data;
    } catch (error) {
      console.error("Chyba při vytváření commitu:", error);
      throw error;
    }
  }

  // Přidejte tyto metody do src/services/github.js

  /**
   * Získání seznamu větví repozitáře se základními informacemi
   * @param {string} owner - Vlastník repozitáře
   * @param {string} repo - Název repozitáře
   * @returns {Promise<Array>} Seznam větví
   */
  async getBranches(owner, repo) {
    try {
      const { data } = await this.octokit.repos.listBranches({
        owner,
        repo,
        per_page: 100
      });
      return data;
    } catch (error) {
      console.error("Error getting branches:", error);
      throw error;
    }
  }

  /**
   * Vytvoření nové větve z existující
   * @param {string} owner - Vlastník repozitáře
   * @param {string} repo - Název repozitáře
   * @param {string} newBranchName - Název nové větve
   * @param {string} baseBranchName - Název výchozí větve (source)
   * @returns {Promise<Object>} Informace o vytvořené větvi
   */
  async createBranch(owner, repo, newBranchName, baseBranchName) {
    try {
      // 1. Získáme referenci výchozí větve
      const { data: refData } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranchName}`
      });
      
      // 2. Vytvoříme novou větev z této reference
      const { data } = await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${newBranchName}`,
        sha: refData.object.sha
      });
      
      return data;
    } catch (error) {
      console.error("Error creating branch:", error);
      throw error;
    }
  }

  /**
   * Vytvoření Pull Requestu
   * @param {string} owner - Vlastník repozitáře
   * @param {string} repo - Název repozitáře
   * @param {string} title - Název Pull Requestu
   * @param {string} body - Popis Pull Requestu
   * @param {string} headBranch - Název větve s změnami
   * @param {string} baseBranch - Název cílové větve (obvykle main)
   * @returns {Promise<Object>} Vytvořený Pull Request
   */
  async createPullRequest(owner, repo, title, body, headBranch, baseBranch) {
    try {
      const { data } = await this.octokit.pulls.create({
        owner,
        repo,
        title,
        body,
        head: headBranch,
        base: baseBranch
      });
      return data;
    } catch (error) {
      console.error("Error creating pull request:", error);
      throw error;
    }
  }

  /**
   * Získání detailů konkrétního Pull Requestu
   * @param {string} owner - Vlastník repozitáře
   * @param {string} repo - Název repozitáře
   * @param {number} pull_number - Číslo Pull Requestu
   * @returns {Promise<Object>} Detail Pull Requestu
   */
  async getPullRequestDetails(owner, repo, pull_number) {
    try {
      const { data } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number
      });
      return data;
    } catch (error) {
      console.error("Error getting pull request details:", error);
      throw error;
    }
  }
  
  /**
   * Získání aktuální větve ze zadané reference
   * @param {string} owner - Vlastník repozitáře
   * @param {string} repo - Název repozitáře
   * @param {string} branchName - Název větve
   * @returns {Promise<Object>} Informace o větvi
   */
  async getBranch(owner, repo, branchName) {
    try {
      const { data } = await this.octokit.repos.getBranch({
        owner,
        repo,
        branch: branchName
      });
      return data;
    } catch (error) {
      console.error("Error getting branch:", error);
      throw error;
    }
  }

}

// Exportujeme instanci služby
const githubService = new GitHubService();
export default githubService;