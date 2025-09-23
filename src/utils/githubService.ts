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
  private static readonly CLIENT_ID = 'your_github_oauth_client_id'; // This would be set via environment
  private static readonly REDIRECT_URI = window.location.origin + '/auth/github/callback';
  private static readonly SCOPE = 'repo';

  static getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      scope: this.SCOPE,
      state: Math.random().toString(36).substring(7)
    });
    
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

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
      const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          content: btoa(unescape(encodeURIComponent(content))),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error creating file on GitHub:', error);
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