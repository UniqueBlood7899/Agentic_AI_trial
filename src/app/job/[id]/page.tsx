'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Terminal, FileText, Eye, Download, Play, Square, Folder, File, Monitor, BookOpen, Server } from 'lucide-react';
import type { Job, FileNode, TerminalSession, CommandExecution } from '@/lib/types';

export default function JobDetailsPage() {
  const params = useParams();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [command, setCommand] = useState<string>('');
  const [terminalOutput, setTerminalOutput] = useState<CommandExecution[]>([]);
  const [isPreviewRunning, setIsPreviewRunning] = useState<boolean>(false);
  const [isSandboxRunning, setIsSandboxRunning] = useState<boolean>(false);
  const [vncUrl, setVncUrl] = useState<string | null>(null);
  const [jupyterUrl, setJupyterUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchFileTree();
      checkSandboxStatus();
      const interval = setInterval(() => {
        fetchJobDetails();
        checkSandboxStatus();
      }, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`/api/status/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data);
        setIsPreviewRunning(!!data.previewUrl);
        setLoading(false);
      } else {
        setError('Failed to fetch job details');
        setLoading(false);
      }
    } catch (err) {
      setError('Error fetching job details');
      setLoading(false);
    }
  };

  const fetchFileTree = async () => {
    try {
      const response = await fetch(`/api/files/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setFileTree(data.fileTree);
      }
    } catch (err) {
      console.error('Error fetching file tree:', err);
    }
  };

  const fetchFileContent = async (filePath: string) => {
    try {
      const response = await fetch(`/api/files/${jobId}/${encodeURIComponent(filePath)}`);
      if (response.ok) {
        const data = await response.json();
        setFileContent(data.content);
        setSelectedFile(filePath);
      }
    } catch (err) {
      console.error('Error fetching file content:', err);
    }
  };

  const updateFileContent = async () => {
    if (!selectedFile) return;
    
    try {
      const response = await fetch(`/api/files/${jobId}/${encodeURIComponent(selectedFile)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: fileContent })
      });
      
      if (response.ok) {
        await fetchJobDetails(); // Refresh logs
        await fetchFileTree(); // Refresh file tree
      }
    } catch (err) {
      console.error('Error updating file:', err);
    }
  };

  const executeCommand = async () => {
    if (!command.trim()) return;

    try {
      const response = await fetch(`/api/execute/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: command.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setTerminalOutput(prev => [...prev, data.execution]);
        setCommand('');
        await fetchJobDetails(); // Refresh logs
        await fetchFileTree(); // Refresh file tree in case files changed
      }
    } catch (err) {
      console.error('Error executing command:', err);
    }
  };

  const startPreview = async () => {
    try {
      const response = await fetch(`/api/preview/${jobId}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setIsPreviewRunning(true);
        await fetchJobDetails(); // Refresh to get preview URL
      }
    } catch (err) {
      console.error('Error starting preview:', err);
    }
  };

  const stopPreview = async () => {
    try {
      const response = await fetch(`/api/preview/${jobId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setIsPreviewRunning(false);
        await fetchJobDetails();
      }
    } catch (err) {
      console.error('Error stopping preview:', err);
    }
  };

  const downloadProject = () => {
    window.open(`/api/download/${jobId}`, '_blank');
  };

  const startSandbox = async () => {
    try {
      const response = await fetch(`/api/sandbox/${jobId}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setIsSandboxRunning(true);
        setVncUrl(data.containerInfo.vncUrl);
        setJupyterUrl(data.containerInfo.jupyterUrl);
        await fetchJobDetails();
      }
    } catch (err) {
      console.error('Error starting sandbox:', err);
    }
  };

  const stopSandbox = async () => {
    try {
      const response = await fetch(`/api/sandbox/${jobId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setIsSandboxRunning(false);
        setVncUrl(null);
        setJupyterUrl(null);
        await fetchJobDetails();
      }
    } catch (err) {
      console.error('Error stopping sandbox:', err);
    }
  };

  const checkSandboxStatus = async () => {
    try {
      const response = await fetch(`/api/sandbox/${jobId}`);
      
      if (response.ok) {
        const data = await response.json();
        setIsSandboxRunning(true);
        setVncUrl(data.containerInfo.vncUrl);
        setJupyterUrl(data.containerInfo.jupyterUrl);
      } else {
        setIsSandboxRunning(false);
        setVncUrl(null);
        setJupyterUrl(null);
      }
    } catch (err) {
      setIsSandboxRunning(false);
      setVncUrl(null);
      setJupyterUrl(null);
    }
  };

  const renderFileTree = (nodes: FileNode[], level: number = 0) => {
    return nodes.map((node) => (
      <div key={node.path} style={{ marginLeft: level * 16 }}>
        <div
          className={`flex items-center p-1 hover:bg-gray-100 cursor-pointer rounded ${
            selectedFile === node.path ? 'bg-blue-100' : ''
          }`}
          onClick={() => {
            if (node.type === 'file') {
              fetchFileContent(node.path);
            }
          }}
        >
          {node.type === 'directory' ? (
            <Folder className="w-4 h-4 mr-2 text-blue-500" />
          ) : (
            <File className="w-4 h-4 mr-2 text-gray-500" />
          )}
          <span className="text-sm">{node.name}</span>
          {node.type === 'file' && node.size && (
            <span className="text-xs text-gray-400 ml-auto">
              {(node.size / 1024).toFixed(1)}KB
            </span>
          )}
        </div>
        {node.children && renderFileTree(node.children, level + 1)}
      </div>
    ));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error || !job) {
    return <div className="text-red-500 text-center">{error || 'Job not found'}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Job Details</h1>
          <p className="text-gray-600">{job.id}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={job.status === 'Completed' ? 'default' : 'secondary'}>
            {job.status}
          </Badge>
          <Button onClick={downloadProject} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="terminal" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="terminal">Terminal</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="vnc">VNC</TabsTrigger>
              <TabsTrigger value="jupyter">Jupyter</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="terminal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Terminal className="w-5 h-5 mr-2" />
                    Interactive Terminal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 w-full border rounded p-2 mb-4 bg-black text-green-400 font-mono text-sm">
                    {terminalOutput.map((exec) => (
                      <div key={exec.id} className="mb-2">
                        <div className="text-blue-400">$ {exec.command}</div>
                        <div className="whitespace-pre-wrap">{exec.output}</div>
                      </div>
                    ))}
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Input
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      placeholder="Enter command..."
                      onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
                      className="font-mono"
                    />
                    <Button onClick={executeCommand}>Execute</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>File Tree</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      {renderFileTree(fileTree)}
                    </ScrollArea>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>File Editor</span>
                      {selectedFile && (
                        <Button onClick={updateFileContent} size="sm">
                          Save
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedFile ? (
                      <>
                        <p className="text-sm text-gray-600 mb-2">{selectedFile}</p>
                        <Textarea
                          value={fileContent}
                          onChange={(e) => setFileContent(e.target.value)}
                          className="h-80 font-mono text-sm"
                          placeholder="Select a file to edit..."
                        />
                      </>
                    ) : (
                      <div className="h-80 flex items-center justify-center text-gray-500">
                        Select a file to view/edit
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Eye className="w-5 h-5 mr-2" />
                      Live Preview
                    </div>
                    <div className="flex gap-2">
                      {!isPreviewRunning ? (
                        <Button onClick={startPreview}>
                          <Play className="w-4 h-4 mr-2" />
                          Start Preview
                        </Button>
                      ) : (
                        <Button onClick={stopPreview} variant="destructive">
                          <Square className="w-4 h-4 mr-2" />
                          Stop Preview
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {job.previewUrl ? (
                    <div className="border rounded">
                      <iframe
                        src={job.previewUrl}
                        className="w-full h-96"
                        title="Live Preview"
                      />
                    </div>
                  ) : (
                    <div className="h-96 flex items-center justify-center text-gray-500 border rounded">
                      {isPreviewRunning ? 'Starting preview server...' : 'Click "Start Preview" to view your app'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vnc" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Monitor className="w-5 h-5 mr-2" />
                      VNC Desktop Environment
                    </div>
                    <div className="flex gap-2">
                      {!isSandboxRunning ? (
                        <Button onClick={startSandbox}>
                          <Server className="w-4 h-4 mr-2" />
                          Start Sandbox
                        </Button>
                      ) : (
                        <Button onClick={stopSandbox} variant="destructive">
                          <Square className="w-4 h-4 mr-2" />
                          Stop Sandbox
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {vncUrl ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Badge variant="default">Sandbox Running</Badge>
                        <a 
                          href={vncUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-sm"
                        >
                          Open VNC in new tab →
                        </a>
                      </div>
                      <div className="border rounded">
                        <iframe
                          src={vncUrl}
                          className="w-full h-96"
                          title="VNC Desktop"
                        />
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Full desktop environment with GUI applications and development tools.</p>
                        <p>Use the mouse and keyboard to interact with the virtual desktop.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-96 flex items-center justify-center text-gray-500 border rounded">
                      {isSandboxRunning ? 'Starting sandbox environment...' : 'Click "Start Sandbox" to launch VNC desktop'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jupyter" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Jupyter Notebook
                    </div>
                    <div className="flex gap-2">
                      {jupyterUrl && (
                        <a 
                          href={jupyterUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-sm"
                        >
                          Open Jupyter in new tab →
                        </a>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {jupyterUrl ? (
                    <div className="space-y-4">
                      <Badge variant="default">Jupyter Server Running</Badge>
                      <div className="border rounded">
                        <iframe
                          src={jupyterUrl}
                          className="w-full h-96"
                          title="Jupyter Notebook"
                        />
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Interactive Python development environment with notebooks.</p>
                        <p>Create and run Python scripts, data analysis, and machine learning experiments.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-96 flex items-center justify-center text-gray-500 border rounded">
                      Start the sandbox environment to access Jupyter Notebook
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Execution Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    {job.logs.map((log, index) => (
                      <div key={index} className="mb-2 p-2 border-l-2 border-gray-200">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.type === 'error' ? 'destructive' : 'secondary'}>
                            {log.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{log.message}</p>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <strong>Description:</strong>
                <p className="text-sm text-gray-600">{job.description}</p>
              </div>
              <Separator />
              <div>
                <strong>Created:</strong>
                <p className="text-sm">{new Date(job.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <strong>Updated:</strong>
                <p className="text-sm">{new Date(job.updatedAt).toLocaleString()}</p>
              </div>
              {job.previewUrl && (
                <>
                  <Separator />
                  <div>
                    <strong>Preview URL:</strong>
                    <p className="text-sm">
                      <a href={job.previewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {job.previewUrl}
                      </a>
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
