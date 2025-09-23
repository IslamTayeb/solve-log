export interface ProblemInfo {
  title: string;
  platform: 'leetcode' | 'neetcode';
  url: string;
}

export class URLParser {
  static extractProblemInfo(url: string): ProblemInfo | null {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Remove query parameters and fragments
      const cleanPath = urlObj.pathname;
      
      if (hostname.includes('leetcode.com')) {
        return this.parseLeetCodeUrl(cleanPath, url);
      } else if (hostname.includes('neetcode.io')) {
        return this.parseNeetCodeUrl(cleanPath, url);
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  }

  private static parseLeetCodeUrl(path: string, url: string): ProblemInfo | null {
    // LeetCode pattern: /problems/problem-name/
    const leetcodeMatch = path.match(/\/problems\/([^\/]+)/);
    if (leetcodeMatch) {
      const problemSlug = leetcodeMatch[1];
      const title = this.slugToTitle(problemSlug);
      return {
        title,
        platform: 'leetcode',
        url
      };
    }
    return null;
  }

  private static parseNeetCodeUrl(path: string, url: string): ProblemInfo | null {
    // NeetCode patterns: /problems/problem-name or /problem/problem-name
    const neetcodeMatch = path.match(/\/problems?\/([^\/]+)/);
    if (neetcodeMatch) {
      const problemSlug = neetcodeMatch[1];
      const title = this.slugToTitle(problemSlug);
      return {
        title,
        platform: 'neetcode',
        url
      };
    }
    return null;
  }

  private static slugToTitle(slug: string): string {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  static titleToCamelCase(title: string): string {
    return title
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .split(/\s+/) // Split by whitespace
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}