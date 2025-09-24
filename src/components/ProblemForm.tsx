import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, Globe, Code, FileText, Github } from "lucide-react";
import { URLParser, ProblemInfo } from "@/utils/urlParser";
import { GitHubService } from "@/utils/githubService";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
}

export const ProblemForm = () => {
  const [url, setUrl] = useState("");
  const [solution, setSolution] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [problemInfo, setProblemInfo] = useState<ProblemInfo | null>(null);
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("IslamTayeb/islam-x-neetcode-150");
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkGitHubAuth = async () => {
      const token = GitHubService.getAccessToken();
      if (token) {
        setIsGithubConnected(true);
        const repos = await GitHubService.getUserRepos();
        setGithubRepos(repos);
      }
    };
    
    checkGitHubAuth();
  }, []);

  const handleFetchProblem = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a problem URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const info = URLParser.extractProblemInfo(url);
      
      if (info) {
        setProblemInfo(info);
        toast({
          title: "Problem Parsed",
          description: `Successfully extracted info for ${info.title} from ${info.platform}`,
        });
      } else {
        toast({
          title: "Unsupported URL",
          description: "Please enter a valid LeetCode or NeetCode URL",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse the problem URL",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubAuth = () => {
    const token = prompt(
      "Please enter your GitHub Personal Access Token:\n\n" +
      "1. Go to GitHub Settings > Developer settings > Personal access tokens\n" +
      "2. Generate a new token with 'repo' scope\n" +
      "3. Copy and paste the token here"
    );
    
    if (token) {
      GitHubService.setAccessToken(token);
      setIsGithubConnected(true);
      
      // Test the token and fetch repos
      GitHubService.getUserRepos().then(repos => {
        setGithubRepos(repos);
        toast({
          title: "GitHub Connected",
          description: "Successfully connected to GitHub!",
        });
      }).catch(() => {
        GitHubService.removeAccessToken();
        setIsGithubConnected(false);
        toast({
          title: "Invalid Token",
          description: "Please check your Personal Access Token",
          variant: "destructive",
        });
      });
    }
  };

  const generateAndCommitFile = async () => {
    if (!problemInfo || !solution.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fetch a problem and add your solution first",
        variant: "destructive",
      });
      return;
    }

    if (!isGithubConnected) {
      toast({
        title: "GitHub Not Connected",
        description: "Please connect to GitHub first",
        variant: "destructive",
      });
      return;
    }

    const fileName = URLParser.titleToCamelCase(problemInfo.title) + '.py';
    const content = `"""
${problemInfo.title}
${problemInfo.url}

Platform: ${problemInfo.platform}
"""

# Solution
${solution}

${notes ? `\n# Notes\n# ${notes.split('\n').join('\n# ')}` : ''}
`;

    const commitMessage = GitHubService.formatCommitMessage(problemInfo.title);
    
    setIsLoading(true);
    try {
      const success = await GitHubService.createFile(
        selectedRepo,
        fileName,
        content,
        commitMessage
      );

      if (success) {
        toast({
          title: "Success",
          description: `Committed ${fileName} to ${selectedRepo}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to commit file to GitHub",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to commit file to GitHub",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = () => {
    if (!problemInfo || !solution.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fetch a problem and add your solution first",
        variant: "destructive",
      });
      return;
    }

    const fileName = URLParser.titleToCamelCase(problemInfo.title) + '.py';
    const content = `"""
${problemInfo.title}
${problemInfo.url}

Platform: ${problemInfo.platform}
"""

# Solution
${solution}

${notes ? `\n# Notes\n# ${notes.split('\n').join('\n# ')}` : ''}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    toast({
      title: "File Downloaded",
      description: `Downloaded ${fileName} successfully`,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="shadow-card border-0 bg-gradient-subtle">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Interview Prep Organizer
          </CardTitle>
          <CardDescription className="text-lg">
            Scrape coding problems and organize your solutions
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Problem URL
            </CardTitle>
            <CardDescription>
              Enter the URL of the coding problem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Problem URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://leetcode.com/problems/two-sum"
                className="font-mono"
              />
            </div>
            <Button 
              onClick={handleFetchProblem}
              disabled={isLoading}
              className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-300"
            >
              {isLoading ? "Fetching..." : "Fetch Problem"}
            </Button>
            
            {problemInfo && (
              <div className="mt-4 p-4 bg-code rounded-lg">
                <h4 className="font-semibold text-code-foreground mb-2">{problemInfo.title}</h4>
                <p className="text-sm text-muted-foreground">Platform: {problemInfo.platform}</p>
                <p className="text-xs text-muted-foreground mt-1">File: {URLParser.titleToCamelCase(problemInfo.title)}.py</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              Your Solution
            </CardTitle>
            <CardDescription>
              Paste your Python solution code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="solution">Solution Code</Label>
              <Textarea
                id="solution"
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="def two_sum(nums, target):
    # Your solution here
    pass"
                className="min-h-[200px] font-mono text-sm bg-code text-code-foreground"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Notes & Insights
            </CardTitle>
            <CardDescription>
              Add your notes, time complexity, approach, etc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Time Complexity: O(n)
Space Complexity: O(n)

Approach: Use a hash map to store complements...

Key insights:
- ..."
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5 text-primary" />
              GitHub Integration
            </CardTitle>
            <CardDescription>
              Connect to GitHub and select repository
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isGithubConnected ? (
              <Button 
                onClick={handleGitHubAuth}
                className="w-full"
                variant="outline"
              >
                <Github className="mr-2 h-4 w-4" />
                Connect GitHub
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="repo-select">Select Repository</Label>
                  <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a repository" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IslamTayeb/islam-x-neetcode-150">
                        IslamTayeb/islam-x-neetcode-150 (default)
                      </SelectItem>
                      {githubRepos.map((repo) => (
                        <SelectItem key={repo.id} value={repo.full_name}>
                          {repo.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Button 
          onClick={downloadFile}
          disabled={!problemInfo || !solution.trim()}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
          size="lg"
        >
          <Download className="mr-2 h-5 w-5" />
          Download Python File
        </Button>

        <Button 
          onClick={generateAndCommitFile}
          disabled={!problemInfo || !solution.trim() || !isGithubConnected || isLoading}
          className="bg-success hover:bg-success/90 text-success-foreground shadow-elegant"
          size="lg"
        >
          <Github className="mr-2 h-5 w-5" />
          {isLoading ? "Committing..." : "Commit to GitHub"}
        </Button>
      </div>
    </div>
  );
};