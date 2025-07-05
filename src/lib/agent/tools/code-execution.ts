import { ShellTool } from './shell';
import { FilesystemTool } from './filesystem';

export interface CodeExecutionResult {
  output: string;
  error?: string;
  exitCode: number;
}

export class CodeExecutionTool {
  private shell: ShellTool;
  private fs: FilesystemTool;

  constructor(workspacePath: string = '/tmp/workspace') {
    this.shell = new ShellTool(workspacePath);
    this.fs = new FilesystemTool(workspacePath);
  }

  async executeTypeScript(code: string): Promise<CodeExecutionResult> {
    const filename = `temp_${Date.now()}.ts`;
    
    try {
      // Write TypeScript code to file
      await this.fs.execute({
        type: 'create',
        path: filename,
        content: code
      });

      // Execute with ts-node
      const result = await this.shell.execute(`npx ts-node ${filename}`);
      
      // Cleanup
      await this.fs.execute({ type: 'delete', path: filename });

      return {
        output: result.stdout,
        error: result.stderr,
        exitCode: result.exitCode
      };
    } catch (error) {
      return {
        output: '',
        error: (error as Error).message,
        exitCode: 1
      };
    }
  }

  async executePython(code: string): Promise<CodeExecutionResult> {
    const filename = `temp_${Date.now()}.py`;
    
    try {
      await this.fs.execute({
        type: 'create',
        path: filename,
        content: code
      });

      const result = await this.shell.execute(`python3 ${filename}`);
      
      await this.fs.execute({ type: 'delete', path: filename });

      return {
        output: result.stdout,
        error: result.stderr,
        exitCode: result.exitCode
      };
    } catch (error) {
      return {
        output: '',
        error: (error as Error).message,
        exitCode: 1
      };
    }
  }

  async executeInJupyter(code: string, language: 'python' | 'typescript' = 'python'): Promise<CodeExecutionResult> {
    // For now, use direct execution. In production, integrate with Jupyter API
    if (language === 'python') {
      return this.executePython(code);
    } else {
      return this.executeTypeScript(code);
    }
  }
}
