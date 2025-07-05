import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ShellInput {
  type: 'command';
  command: string;
  workingDirectory?: string;
  timeout?: number;
  background?: boolean;
}

export interface ShellResult {
  output?: string;
  error?: string;
  exitCode?: number;
  pid?: number; // For background processes
}

export class ShellTool {
  private workingDirectory: string;
  private backgroundProcesses: Map<number, any> = new Map();

  constructor(workingDirectory: string = '/tmp/workspace') {
    this.workingDirectory = workingDirectory;
  }

  async execute(input: ShellInput): Promise<ShellResult> {
    const { 
      command, 
      workingDirectory = this.workingDirectory, 
      timeout = 30000,
      background = false 
    } = input;

    try {
      // Security: Basic command sanitization
      if (this.isBlacklistedCommand(command)) {
        throw new Error('Command not allowed for security reasons');
      }

      if (background) {
        return this.executeBackground(command, workingDirectory);
      }

      const { stdout, stderr } = await execAsync(command, {
        cwd: workingDirectory,
        timeout,
        env: { 
          ...process.env, 
          PATH: process.env.PATH,
          NODE_ENV: 'development'
        }
      });

      return {
        output: stdout.toString(),
        error: stderr.toString(),
        exitCode: 0
      };
    } catch (error: any) {
      return {
        output: '',
        error: error.message,
        exitCode: error.code || 1
      };
    }
  }

  private executeBackground(command: string, workingDirectory: string): ShellResult {
    const args = command.split(' ');
    const cmd = args.shift();
    
    if (!cmd) {
      throw new Error('Invalid command');
    }

    const child = spawn(cmd, args, {
      cwd: workingDirectory,
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        PATH: process.env.PATH,
        NODE_ENV: 'development',
        PORT: '3001' // Use different port to avoid conflicts
      }
    });

    this.backgroundProcesses.set(child.pid!, child);

    child.on('exit', () => {
      this.backgroundProcesses.delete(child.pid!);
    });

    return {
      output: `Background process started with PID: ${child.pid}`,
      exitCode: 0,
      pid: child.pid
    };
  }

  killProcess(pid: number): boolean {
    const process = this.backgroundProcesses.get(pid);
    if (process) {
      process.kill();
      this.backgroundProcesses.delete(pid);
      return true;
    }
    return false;
  }

  getRunningProcesses(): number[] {
    return Array.from(this.backgroundProcesses.keys());
  }

  private isBlacklistedCommand(command: string): boolean {
    const blacklist = [
      'rm -rf /',
      'dd if=',
      'mkfs',
      'fdisk',
      'shutdown',
      'reboot',
      'halt',
      'init 0',
      'init 6',
      'format',
      'del /f /s /q C:\\',
      'rd /s /q C:\\'
    ];
    
    return blacklist.some(blocked => command.toLowerCase().includes(blocked.toLowerCase()));
  }

  setWorkingDirectory(path: string) {
    this.workingDirectory = path;
  }

  getWorkingDirectory(): string {
    return this.workingDirectory;
  }
}
