import { generateProjectStarter } from '@/ai/flows/generate-project-starter-mock';
import { FilesystemTool } from './tools/filesystem';
import { ContextManager } from './context/manager';
import { ShellTool } from './tools/shell';
import { CodeExecutionTool } from './tools/code-execution';
import { DockerContainerManager, ContainerInfo } from './docker-manager';
import type { FileNode, TerminalSession, CommandExecution } from '@/lib/types';
import * as path from 'path';
import * as fs from 'fs/promises';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';

export class AgentRunner {
  private workspacePath: string;
  private fs: FilesystemTool;
  private context: ContextManager;
  private shell: ShellTool;
  private codeExecution: CodeExecutionTool;
  private dockerManager: DockerContainerManager;
  private terminalSessions: Map<string, TerminalSession> = new Map();
  private isRunning: boolean = false;
  private containerInfo: ContainerInfo | null = null;
  private jobId: string;

  constructor(jobId: string) {
    this.jobId = jobId;
    this.workspacePath = path.join(process.cwd(), 'workspaces', jobId);
    this.fs = new FilesystemTool(this.workspacePath);
    this.context = new ContextManager(this.workspacePath);
    this.shell = new ShellTool(this.workspacePath);
    this.codeExecution = new CodeExecutionTool(this.workspacePath);
    this.dockerManager = new DockerContainerManager();
  }

  async executeTask(task: string): Promise<void> {
    // Ensure workspace directory exists
    await fs.mkdir(this.workspacePath, { recursive: true });
    
    // Initialize context
    await this.context.initialize();
    await this.context.addEntry({
      type: 'task',
      content: `Starting task: ${task}`
    });

    try {
      // Use your AI flow to generate the project
      const projectStructure = await generateProjectStarter({
        description: task
      });

      // Create all the generated files
      for (const [filePath, content] of Object.entries(projectStructure.files)) {
        await this.fs.execute({
          type: 'create',
          path: filePath,
          content: content
        });

        await this.context.addEntry({
          type: 'file_change',
          content: `Created file: ${filePath}`
        });
      }

      // Create package.json if not already created
      const packageJsonExists = await this.fileExists('package.json');
      if (!packageJsonExists) {
        await this.createDefaultPackageJson(task);
      }

      // Create a README
      await this.fs.execute({
        type: 'create',
        path: 'README.md',
        content: this.generateReadme(task, projectStructure)
      });

      await this.context.addEntry({
        type: 'task',
        content: 'Task completed successfully'
      });

    } catch (error) {
      await this.context.addEntry({
        type: 'task',
        content: `Task failed: ${(error as Error).message}`
      });
      throw error;
    }
  }

  async packageProject(jobId: string): Promise<string> {
    const outputPath = path.join(process.cwd(), 'public', 'downloads');
    await fs.mkdir(outputPath, { recursive: true });
    
    const zipPath = path.join(outputPath, `${jobId}.zip`);
    
    return new Promise((resolve, reject) => {
      const output = require('fs').createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`Archive created: ${archive.pointer()} total bytes`);
        resolve(zipPath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(this.workspacePath, false);
      archive.finalize();
    });
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await this.fs.execute({ type: 'read', path: filePath });
      return true;
    } catch {
      return false;
    }
  }

  private async createDefaultPackageJson(task: string): Promise<void> {
    const packageJson = {
      name: `generated-project-${Date.now()}`,
      version: '1.0.0',
      description: `Project generated from: ${task}`,
      main: 'index.js',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint'
      },
      dependencies: {
        'next': '^14.0.0',
        'react': '^18.0.0',
        'react-dom': '^18.0.0',
        'tailwindcss': '^3.0.0'
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        '@types/react': '^18.0.0',
        '@types/react-dom': '^18.0.0',
        'typescript': '^5.0.0'
      }
    };

    await this.fs.execute({
      type: 'create',
      path: 'package.json',
      content: JSON.stringify(packageJson, null, 2)
    });
  }

  private generateReadme(task: string, projectStructure: any): string {
    return `# Generated Project

## Task Description
${task}

## Generated Files
${Object.keys(projectStructure.files).map(file => `- ${file}`).join('\n')}

## Setup Instructions
1. Install dependencies: \`npm install\`
2. Run development server: \`npm run dev\`
3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure
This project was automatically generated by the Sandbox AI Coding Agent.

Generated at: ${new Date().toISOString()}
`;
  }

  async startSandboxEnvironment(): Promise<ContainerInfo> {
    // Ensure workspace directory exists
    await fs.mkdir(this.workspacePath, { recursive: true });
    
    // Start Docker container with VNC
    this.containerInfo = await this.dockerManager.createContainer(
      this.jobId, 
      this.workspacePath
    );
    
    return this.containerInfo;
  }

  async stopSandboxEnvironment(): Promise<void> {
    if (this.containerInfo) {
      await this.dockerManager.stopContainer(this.jobId);
      this.containerInfo = null;
    }
  }

  async executeInteractiveCommand(command: string, sessionId?: string): Promise<CommandExecution> {
    const session = sessionId ? this.terminalSessions.get(sessionId) : this.createNewTerminalSession();
    if (!session) throw new Error('Terminal session not found');

    const commandId = uuidv4();
    const startTime = Date.now();

    try {
      let result;
      
      if (this.containerInfo && this.containerInfo.status === 'running') {
        // Execute in Docker container
        result = await this.dockerManager.executeInContainer(this.jobId, command);
      } else {
        // Fallback to local execution
        result = await this.shell.execute({
          type: 'command',
          command: command,
          workingDirectory: this.workspacePath
        });
      }

      const execution: CommandExecution = {
        id: commandId,
        command,
        output: result.output || '',
        exitCode: result.exitCode || 0,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };

      session.commands.push(execution);
      this.terminalSessions.set(session.id, session);

      return execution;
    } catch (error) {
      const execution: CommandExecution = {
        id: commandId,
        command,
        output: (error as Error).message,
        exitCode: 1,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };

      session.commands.push(execution);
      this.terminalSessions.set(session.id, session);

      return execution;
    }
  }

  async getVncUrl(): Promise<string | null> {
    if (this.containerInfo && this.containerInfo.status === 'running') {
      return this.containerInfo.vncUrl;
    }
    return null;
  }

  async getJupyterUrl(): Promise<string | null> {
    if (this.containerInfo && this.containerInfo.status === 'running') {
      return this.containerInfo.jupyterUrl;
    }
    return null;
  }

  async getContainerStatus(): Promise<ContainerInfo | null> {
    if (this.containerInfo) {
      return await this.dockerManager.getContainerInfo(this.jobId);
    }
    return null;
  }

  createNewTerminalSession(): TerminalSession {
    const session: TerminalSession = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      commands: [],
      isActive: true
    };

    this.terminalSessions.set(session.id, session);
    return session;
  }

  async startPreviewServer(): Promise<string> {
    try {
      if (this.containerInfo && this.containerInfo.status === 'running') {
        // Install dependencies and start dev server in container
        await this.executeInteractiveCommand('cd /home/agent/workspace && npm install');
        await this.executeInteractiveCommand('cd /home/agent/workspace && npm run dev &');
        
        // Return the dev server URL through the container port
        return `http://localhost:${this.containerInfo.ports.dev}`;
      }
      
      // Fallback to local execution
      const packageJsonPath = path.join(this.workspacePath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      
      let startCommand = 'npm run dev';
      if (packageJson.scripts?.dev) {
        startCommand = 'npm run dev';
      } else if (packageJson.scripts?.start) {
        startCommand = 'npm start';
      } else {
        startCommand = 'next dev'; // Default for Next.js
      }

      // Install dependencies first
      await this.executeInteractiveCommand('npm install');
      
      // Start the preview server
      const result = await this.shell.execute({
        type: 'command',
        command: startCommand,
        workingDirectory: this.workspacePath,
        background: true
      });

      // Return preview URL (assuming Next.js default port 3001 to avoid conflict)
      return `http://localhost:3001`;
    } catch (error) {
      throw new Error(`Failed to start preview server: ${(error as Error).message}`);
    }
  }

  async stopPreviewServer(): Promise<void> {
    if (this.containerInfo && this.containerInfo.status === 'running') {
      await this.executeInteractiveCommand('pkill -f "npm run dev" || pkill -f "next dev" || true');
    }
  }

  async getFileTree(): Promise<FileNode[]> {
    return this.buildFileTree(this.workspacePath);
  }

  private async buildFileTree(dirPath: string, relativePath: string = ''): Promise<FileNode[]> {
    const nodes: FileNode[] = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip node_modules and hidden files
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        
        const fullPath = path.join(dirPath, entry.name);
        const entryRelativePath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          const children = await this.buildFileTree(fullPath, entryRelativePath);
          nodes.push({
            name: entry.name,
            path: entryRelativePath,
            type: 'directory',
            children
          });
        } else {
          const stats = await fs.stat(fullPath);
          nodes.push({
            name: entry.name,
            path: entryRelativePath,
            type: 'file',
            size: stats.size,
            lastModified: stats.mtime.toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error building file tree:', error);
    }
    
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  async getFileContent(filePath: string): Promise<string> {
    const fullPath = path.join(this.workspacePath, filePath);
    return fs.readFile(fullPath, 'utf-8');
  }

  async updateFileContent(filePath: string, content: string): Promise<void> {
    await this.fs.execute({
      type: 'create',
      path: filePath,
      content
    });
    
    // Re-package project after file update
    await this.packageProject(path.basename(this.workspacePath));
  }

  getTerminalSessions(): TerminalSession[] {
    return Array.from(this.terminalSessions.values());
  }
}
