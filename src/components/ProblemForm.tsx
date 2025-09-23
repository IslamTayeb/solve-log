import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, Globe, Code, FileText } from "lucide-react";

interface ProblemData {
  title: string;
  description: string;
  url: string;
}

export const ProblemForm = () => {
  const [url, setUrl] = useState("");
  const [solution, setSolution] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [problemData, setProblemData] = useState<ProblemData | null>(null);
  const { toast } = useToast();

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
      // Here we would normally fetch from the website
      // For now, let's simulate with a basic implementation
      const response = await fetch(`/api/fetch-problem?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch problem");
      }

      const data = await response.json();
      setProblemData(data);
      
      toast({
        title: "Problem Fetched",
        description: "Successfully extracted problem information",
      });
    } catch (error) {
      // Fallback: extract title from URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const title = pathParts[pathParts.length - 1]?.replace(/-/g, ' ') || 'Problem';
      
      setProblemData({
        title: title.charAt(0).toUpperCase() + title.slice(1),
        description: "Problem description will be extracted from the provided URL",
        url: url
      });
      
      toast({
        title: "Basic Info Extracted",
        description: "Using URL-based title extraction. Full scraping would require backend setup.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePythonFile = () => {
    if (!problemData || !solution.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fetch a problem and add your solution first",
        variant: "destructive",
      });
      return;
    }

    const fileName = problemData.title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.py';
    const content = `"""
${problemData.title}
${problemData.url}

Problem Description:
${problemData.description}
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
      title: "File Generated",
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
            
            {problemData && (
              <div className="mt-4 p-4 bg-code rounded-lg">
                <h4 className="font-semibold text-code-foreground mb-2">{problemData.title}</h4>
                <p className="text-sm text-muted-foreground">{problemData.description}</p>
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
          <div className="space-y-4">
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
            
            <Button 
              onClick={generatePythonFile}
              disabled={!problemData || !solution.trim()}
              className="w-full bg-success hover:bg-success/90 text-success-foreground shadow-elegant"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Generate & Download Python File
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};