import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import * as THREE from 'three';
import { getEnabledGames, GAME_DEFINITIONS } from '@/data/games';
import WorldVisualizer from '@/components/WorldVisualizer';

// Define the submission type
interface Submission {
  id: number;
  title: string;
  description: string;
  url: string;
  color: string;
  glow_color: string;
  core_color: string;
  position_x: number;
  position_y: number;
  position_z: number;
  radius: number;
  status: string;
  created_at: string;
}

const AdminPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    const savedApiKey = localStorage.getItem('admin_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsAuthenticated(true);
      fetchSubmissions(savedApiKey, 'pending');
    }
  }, []);

  // Fetch submissions based on status
  const fetchSubmissions = async (key: string, status: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/submissions?status=${status}`, {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.submissions);
      } else {
        throw new Error(data.error || 'Failed to fetch submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch submissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an API key',
        variant: 'destructive',
      });
      return;
    }
    
    // Test the API key by trying to fetch submissions
    try {
      const response = await fetch('/api/submissions', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (response.ok) {
        // Store the API key in localStorage
        localStorage.setItem('admin_api_key', apiKey);
        setIsAuthenticated(true);
        fetchSubmissions(apiKey, activeTab);
        
        toast({
          title: 'Success',
          description: 'Authenticated successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Invalid API key',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error authenticating:', error);
      toast({
        title: 'Error',
        description: 'Failed to authenticate',
        variant: 'destructive',
      });
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('admin_api_key');
    setApiKey('');
    setIsAuthenticated(false);
    setSubmissions([]);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    fetchSubmissions(apiKey, value);
  };

  // Update submission status
  const updateStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/submissions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ id, status })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update submission');
      }
      
      const data = await response.json();
      if (data.success) {
        // If approved, process for games.ts update
        if (status === 'approved') {
          // Find the submission
          const submission = submissions.find(s => s.id === id);
          if (submission) {
            await addToGamesFile(submission);
          }
        }
        
        // Refresh the list
        fetchSubmissions(apiKey, activeTab);
        
        toast({
          title: 'Success',
          description: `Submission ${status} successfully`,
        });
      } else {
        throw new Error(data.error || 'Failed to update submission');
      }
    } catch (error) {
      console.error('Error updating submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to update submission status',
        variant: 'destructive',
      });
    }
  };

  // Add approved submission to games.ts
  const addToGamesFile = async (submission: Submission) => {
    try {
      // Make API call to update the games.ts file
      const response = await fetch('/api/update-games', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(submission)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update games file');
      }
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Game added to games.ts successfully',
        });
      } else {
        throw new Error(data.error || 'Failed to update games file');
      }
    } catch (error) {
      console.error('Error updating games file:', error);
      toast({
        title: 'Error',
        description: 'Failed to add game to games.ts',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Portal</h1>
      
      {!isAuthenticated ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Administrator Login</CardTitle>
            <CardDescription>Enter your API key to access the admin portal</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input 
                    id="apiKey"
                    type="password"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/')}>Cancel</Button>
              <Button type="submit">Login</Button>
            </CardFooter>
          </form>
        </Card>
      ) : (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-2xl font-semibold">Portal Submissions</h2>
            <Button onClick={handleLogout} variant="outline">Logout</Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-6">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center p-10">
                  <p>No {activeTab} submissions found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {submissions.map((submission) => (
                    <Card key={submission.id} className="overflow-hidden">
                      <CardHeader>
                        <CardTitle>{submission.title}</CardTitle>
                        <CardDescription>{submission.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium mb-1">URL</p>
                            <a href={submission.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                              {submission.url}
                            </a>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Submitted</p>
                            <p>{new Date(submission.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div>
                            <p className="text-sm font-medium mb-1">Color</p>
                            <div className="flex items-center">
                              <div 
                                className="w-6 h-6 rounded mr-2" 
                                style={{ backgroundColor: submission.color }}
                              />
                              <span>{submission.color}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Glow</p>
                            <div className="flex items-center">
                              <div 
                                className="w-6 h-6 rounded mr-2" 
                                style={{ backgroundColor: submission.glow_color }}
                              />
                              <span>{submission.glow_color}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Core</p>
                            <div className="flex items-center">
                              <div 
                                className="w-6 h-6 rounded mr-2" 
                                style={{ backgroundColor: submission.core_color }}
                              />
                              <span>{submission.core_color}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="h-48 border rounded overflow-hidden relative">
                          <WorldVisualizer
                            position={{ 
                              x: submission.position_x, 
                              y: submission.position_y, 
                              z: submission.position_z 
                            }}
                            radius={submission.radius}
                            color={submission.color}
                            glowColor={submission.glow_color}
                            coreColor={submission.core_color}
                            onPositionChange={() => {}}
                          />
                        </div>
                      </CardContent>
                      
                      {submission.status === 'pending' && (
                        <CardFooter className="flex justify-end gap-2">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => updateStatus(submission.id, 'rejected')}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => updateStatus(submission.id, 'approved')}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default AdminPage;