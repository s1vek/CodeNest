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
   * Získání commitů repozitáře
   * @param {string} owner - Vlastník repozitáře
   * @param {string} repo - Název repozitáře
   * @param {number} page - Číslo stránky
   * @returns {Promise<Array>} Seznam commitů
   */
  async getCommits(owner, repo, page = 1) {
    try {
      const { data } = await this.octokit.repos.listCommits({
        owner,
        repo,
        per_page: 10,
        page
      });
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
   * @returns {Promise<Array>} Seznam souborů a adresářů
   */
  async getDirectoryContent(owner, repo, path = "") {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path
      });
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
   * @returns {Promise<Object>} Obsah souboru a metadata
   */
  async getFileContent(owner, repo, path) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path
      });
      
      // GitHub API vrací obsah v Base64
      return {
        content: Buffer.from(data.content, 'base64').toString(),
        sha: data.sha,
        name: data.name,
        path: data.path
      };
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
   * @param {string} sha - SHA existujícího souboru (při aktualizaci)
   * @returns {Promise<Object>} Výsledek operace
   */
  async createCommit(owner, repo, path, message, content, sha) {
    try {
      const { data } = await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        sha
      });
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
        repo
      });
      return data;
    } catch (error) {
      console.error("Chyba při získávání větví:", error);
      throw error;
    }
  }
}

// Exportujeme instanci služby
export default new GitHubService();