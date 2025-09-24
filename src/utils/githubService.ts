interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
}

interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string;
}

export class GitHubService {

  static getAccessToken(): string | null {
    return localStorage.getItem('github_access_token');
  }

  static setAccessToken(token: string): void {
    localStorage.setItem('github_access_token', token);
  }

  static removeAccessToken(): void {
    localStorage.removeItem('github_access_token');
  }

  static async getCurrentUser(): Promise<GitHubUser | null> {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch user');
      return await response.json();
    } catch (error) {
      console.error('Error fetching GitHub user:', error);
      return null;
    }
  }

  static async getUserRepos(): Promise<GitHubRepo[]> {
    const token = this.getAccessToken();
    if (!token) return [];

    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch repositories');
      return await response.json();
    } catch (error) {
      console.error('Error fetching GitHub repos:', error);
      return [];
    }
  }

  static async createFile(
    repo: string,
    path: string,
    content: string,
    message: string
  ): Promise<boolean> {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      // First, try to get the existing file to get its SHA for updating
      let sha: string | undefined;
      try {
        const existingFileResponse = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });
        
        if (existingFileResponse.ok) {
          const existingFile = await existingFileResponse.json();
          sha = existingFile.sha;
        }
      } catch (error) {
        // File doesn't exist, which is fine
      }

      const body: any = {
        message,
        content: btoa(unescape(encodeURIComponent(content))),
      };

      // If file exists, include SHA to update it
      if (sha) {
        body.sha = sha;
      }

      const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      return response.ok;
    } catch (error) {
      console.error('Error creating/updating file on GitHub:', error);
      return false;
    }
  }

  static formatCommitMessage(problemTitle: string): string {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    return `Add solution for ${problemTitle} - ${month}/${day}`;
  }
}