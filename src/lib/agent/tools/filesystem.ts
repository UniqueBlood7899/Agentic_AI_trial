import * as fs from 'fs/promises';
import * as path from 'path';

export interface FileOperation {
  type: 'create' | 'read' | 'write' | 'delete' | 'move' | 'list';
  path: string;
  content?: string;
  destination?: string;
}

export class FilesystemTool {
  private basePath: string;

  constructor(basePath: string = '/tmp/workspace') {
    this.basePath = basePath;
  }

  async execute(operation: FileOperation): Promise<any> {
    const fullPath = path.resolve(this.basePath, operation.path);
    
    // Security: Ensure path is within workspace
    if (!fullPath.startsWith(this.basePath)) {
      throw new Error('Access denied: Path outside workspace');
    }

    switch (operation.type) {
      case 'create':
        await this.ensureDirectory(path.dirname(fullPath));
        await fs.writeFile(fullPath, operation.content || '');
        return { success: true, path: operation.path };

      case 'read':
        const content = await fs.readFile(fullPath, 'utf8');
        return { content, path: operation.path };

      case 'write':
        await fs.writeFile(fullPath, operation.content || '');
        return { success: true, path: operation.path };

      case 'delete':
        await fs.unlink(fullPath);
        return { success: true, path: operation.path };

      case 'move':
        if (!operation.destination) throw new Error('Destination required for move');
        const destPath = path.resolve(this.basePath, operation.destination);
        if (!destPath.startsWith(this.basePath)) {
          throw new Error('Access denied: Destination outside workspace');
        }
        await this.ensureDirectory(path.dirname(destPath));
        await fs.rename(fullPath, destPath);
        return { success: true, from: operation.path, to: operation.destination };

      case 'list':
        const items = await fs.readdir(fullPath, { withFileTypes: true });
        return {
          items: items.map(item => ({
            name: item.name,
            type: item.isDirectory() ? 'directory' : 'file'
          }))
        };

      default:
        throw new Error(`Unknown operation: ${operation.type}`);
    }
  }

  private async ensureDirectory(dirPath: string) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }
}
