import { Octokit } from "@octokit/rest";

class GitHubService {
  constructor() {
    this.octokit = null;
  }

  init(token) {
    this.octokit = new Octokit({ auth: token });
  }

  async getUser() {
    try {
      const { data } = await this.octokit.users.getAuthenticated();
      return data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  }

  async getRepositories() {
    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        sort: "updated",
        per_page: 100
      });
      return data;
    } catch (error) {
      console.error("Error fetching repositories:", error);
      throw error;
    }
  }

  async getRepository(owner, repo) {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo
      });
      return data;
    } catch (error) {
      console.error("Error fetching repository:", error);
      throw error;
    }
  }

  async getBranches(owner, repo) {
    try {
      const { data } = await this.octokit.repos.listBranches({
        owner,
        repo,
        per_page: 100
      });
      return data;
    } catch (error) {
      console.error("Error fetching branches:", error);
      throw error;
    }
  }

  async getCommits(owner, repo, page = 1, branch) {
    try {
      const params = {
        owner,
        repo,
        per_page: 10,
        page
      };

      if (branch) {
        params.sha = branch;
      }

      const { data } = await this.octokit.repos.listCommits(params);
      return data;
    } catch (error) {
      console.error("Error fetching commits:", error);
      throw error;
    }
  }

  async getCommitDetails(owner, repo, sha) {
    try {
      const { data } = await this.octokit.repos.getCommit({
        owner,
        repo,
        ref: sha
      });
      return data;
    } catch (error) {
      console.error("Error fetching commit details:", error);
      throw error;
    }
  }

  async getDirectoryContent(owner, repo, path = "", branch) {
    try {
      const params = {
        owner,
        repo,
        path
      };

      if (branch) {
        params.ref = branch;
      }

      const { data } = await this.octokit.repos.getContent(params);

      return Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error("Error fetching directory content:", error);
      throw error;
    }
  }

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

      if (branch) {
        params.ref = branch;
      }

      const { data } = await this.octokit.repos.getContent(params);
      
      if (data && data.content && data.encoding === 'base64') {
        return {
          content: Buffer.from(data.content, 'base64').toString('utf-8'),
          sha: data.sha,
          name: data.name,
          path: data.path
        };
      } 
      else if (typeof data === 'string') {
        return {
          content: data,
          path: path,
          name: path.split('/').pop()
        };
      }
      else {
        if (typeof data === 'object' && !data.content) {
          throw new Error("GitHub API did not return file content - file may be too large");
        }
        return {
          content: JSON.stringify(data, null, 2),
          path: path,
          name: path.split('/').pop()
        };
      }
    } catch (error) {
      console.error("Error fetching file content:", error);
      throw error;
    }
  }

  async createCommit(owner, repo, path, message, content, branch, sha) {
    try {
      const base64Content = btoa(unescape(encodeURIComponent(content)));
      
      const params = {
        owner,
        repo,
        path,
        message,
        content: base64Content
      };

      if (sha) {
        params.sha = sha;
      }

      if (branch) {
        params.branch = branch;
      }

      const { data } = await this.octokit.repos.createOrUpdateFileContents(params);
      return data;
    } catch (error) {
      console.error("Error creating commit:", error);
      throw error;
    }
  }

  async getPullRequests(owner, repo) {
    try {
      const { data } = await this.octokit.pulls.list({
        owner,
        repo,
        state: "all"
      });
      return data;
    } catch (error) {
      console.error("Error fetching pull requests:", error);
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

      if (sha) {
        params.sha = sha;
      }

      if (branch) {
        params.branch = branch;
      }

      const { data } = await this.octokit.repos.createOrUpdateFileContents(params);
      return data;
    } catch (error) {
      console.error("Error creating commit:", error);
      throw error;
    }
  }

  async createBranch(owner, repo, newBranchName, baseBranchName) {
    try {
      const { data: refData } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranchName}`
      });
      
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

  async deleteBranch(owner, repo, branchName) {
    try {
      const { data } = await this.octokit.git.deleteRef({
        owner,
        repo,
        ref: `heads/${branchName}`
      });
      return data;
    } catch (error) {
      console.error("Error deleting branch:", error);
      throw error;
    }
  }

  async isBranchProtected(owner, repo, branchName) {
    try {
      const { data } = await this.octokit.repos.getBranchProtection({
        owner,
        repo,
        branch: branchName
      });
      return !!data;
    } catch (error) {
      if (error.status === 404) {
        return false;
      }
      console.error("Error checking branch protection:", error);
      throw error;
    }
  }

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

  async closePullRequest(owner, repo, pull_number, state = "closed") {
    try {
      const { data } = await this.octokit.pulls.update({
        owner,
        repo,
        pull_number,
        state
      });
      return data;
    } catch (error) {
      console.error("Error closing pull request:", error);
      throw error;
    }
  }

  async getIssues(owner, repo, state = 'open') {
    try {
      const { data } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state,
        per_page: 100
      });
      return data;
    } catch (error) {
      console.error("Error fetching issues:", error);
      throw error;
    }
  }

  async getIssueDetails(owner, repo, issue_number) {
    try {
      const { data } = await this.octokit.issues.get({
        owner,
        repo,
        issue_number
      });
      return data;
    } catch (error) {
      console.error("Error fetching issue details:", error);
      throw error;
    }
  }

  async createIssue(owner, repo, title, body, labels = []) {
    try {
      const { data } = await this.octokit.issues.create({
        owner,
        repo,
        title,
        body,
        labels
      });
      return data;
    } catch (error) {
      console.error("Error creating issue:", error);
      throw error;
    }
  }

  async updateIssueState(owner, repo, issue_number, state) {
    try {
      const { data } = await this.octokit.issues.update({
        owner,
        repo,
        issue_number,
        state
      });
      return data;
    } catch (error) {
      console.error("Error updating issue state:", error);
      throw error;
    }
  }

  async createRepository(name, description = '', isPrivate = false, autoInit = true) {
    try {
      const { data } = await this.octokit.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
        auto_init: autoInit
      });
      return data;
    } catch (error) {
      console.error("Error creating repository:", error);
      throw error;
    }
  }

  async getLabels(owner, repo) {
    try {
      const { data } = await this.octokit.issues.listLabelsForRepo({
        owner,
        repo,
        per_page: 100
      });
      return data;
    } catch (error) {
      console.error("Error fetching labels:", error);
      throw error;
    }
  }

  async getIssueComments(owner, repo, issue_number) {
    try {
      const { data } = await this.octokit.issues.listComments({
        owner,
        repo,
        issue_number,
        per_page: 100
      });
      return data;
    } catch (error) {
      console.error("Error fetching issue comments:", error);
      throw error;
    }
  }

  async addIssueComment(owner, repo, issue_number, body) {
    try {
      const { data } = await this.octokit.issues.createComment({
        owner,
        repo,
        issue_number,
        body
      });
      return data;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  }

  async getLanguages(owner, repo) {
    try {
      const { data } = await this.octokit.repos.listLanguages({
        owner,
        repo
      });
      return data;
    } catch (error) {
      console.error("Error fetching languages:", error);
      throw error;
    }
  }
  
  async getContributorsStats(owner, repo) {
    try {
      const { data } = await this.octokit.repos.getContributorsStats({
        owner,
        repo
      });
      
      if (data === 204 || !data) {
        throw new Error("GitHub is still generating statistics, please try again later");
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching contributors stats:", error);
      throw error;
    }
  }
  
  async getCommitActivity(owner, repo) {
    try {
      const { data } = await this.octokit.repos.getCommitActivityStats({
        owner,
        repo
      });
      
      if (data === 204 || !data) {
        throw new Error("GitHub is still generating statistics, please try again later");
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching commit activity:", error);
      throw error;
    }
  }
  
  async getCodeFrequency(owner, repo) {
    try {
      const { data } = await this.octokit.repos.getCodeFrequencyStats({
        owner,
        repo
      });
      
      if (data === 204 || !data) {
        throw new Error("GitHub is still generating statistics, please try again later");
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching code frequency:", error);
      throw error;
    }
  }
  
  async getRepositoryStats(owner, repo) {
    try {
      const [languages, contributorsStats, commitActivity, repoData] = await Promise.allSettled([
        this.getLanguages(owner, repo),
        this.getContributorsStats(owner, repo),
        this.getCommitActivity(owner, repo),
        this.getRepository(owner, repo)
      ]);
      
      return {
        languages: languages.status === 'fulfilled' ? languages.value : null,
        contributors: contributorsStats.status === 'fulfilled' ? contributorsStats.value : null,
        commitActivity: commitActivity.status === 'fulfilled' ? commitActivity.value : null,
        repoData: repoData.status === 'fulfilled' ? repoData.value : null
      };
    } catch (error) {
      console.error("Error fetching repository statistics:", error);
      throw error;
    }
  }
}

const githubService = new GitHubService();
export default githubService;