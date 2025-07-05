import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface ContainerConfig {
  jobId: string;
  workspacePath: string;
  ports: {
    vnc: number;
    novnc: number;
    jupyter: number;
    dev: number;
  };
}

export interface ContainerInfo {
  containerId: string;
  status: 'starting' | 'running' | 'stopped' | 'error';
  ports: ContainerConfig['ports'];
  vncUrl: string;
  jupyterUrl: string;
  logs: string[];
}

export class DockerContainerManager {
  private containers: Map<string, ContainerInfo> = new Map();
  private baseVncPort = 5900;
  private baseNoVncPort = 6080;
  private baseJupyterPort = 8888;
  private baseDevPort = 3001;

  async createContainer(jobId: string, workspacePath: string): Promise<ContainerInfo> {
    const ports = this.allocatePorts();
    
    const config: ContainerConfig = {
      jobId,
      workspacePath,
      ports
    };

    try {
      // Build the docker run command
      const dockerCommand = [
        'docker', 'run', '-d',
        '--name', `sandbox-${jobId}`,
        '-p', `${ports.vnc}:5900`,
        '-p', `${ports.novnc}:6080`, 
        '-p', `${ports.jupyter}:8888`,
        '-p', `${ports.dev}:3000`,
        '-v', `${workspacePath}:/home/agent/workspace`,
        '--security-opt', 'seccomp=unconfined',
        '--cap-add', 'SYS_ADMIN',
        'sandbox-agent:latest'
      ].join(' ');

      console.log(`Starting container with command: ${dockerCommand}`);
      
      const { stdout } = await execAsync(dockerCommand);
      const containerId = stdout.trim();

      const containerInfo: ContainerInfo = {
        containerId,
        status: 'starting',
        ports,
        vncUrl: `http://localhost:${ports.novnc}`,
        jupyterUrl: `http://localhost:${ports.jupyter}`,
        logs: [`Container ${containerId} created`]
      };

      this.containers.set(jobId, containerInfo);

      // Wait for container to be ready
      setTimeout(() => this.checkContainerStatus(jobId), 5000);

      return containerInfo;
    } catch (error) {
      throw new Error(`Failed to create container: ${(error as Error).message}`);
    }
  }

  async stopContainer(jobId: string): Promise<void> {
    const container = this.containers.get(jobId);
    if (!container) {
      throw new Error('Container not found');
    }

    try {
      await execAsync(`docker stop sandbox-${jobId}`);
      await execAsync(`docker rm sandbox-${jobId}`);
      
      container.status = 'stopped';
      this.containers.set(jobId, container);
    } catch (error) {
      console.error(`Failed to stop container for job ${jobId}:`, error);
    }
  }

  async getContainerInfo(jobId: string): Promise<ContainerInfo | null> {
    return this.containers.get(jobId) || null;
  }

  async executeInContainer(jobId: string, command: string): Promise<{output: string; exitCode: number}> {
    const container = this.containers.get(jobId);
    if (!container) {
      throw new Error('Container not found');
    }

    try {
      const dockerExecCommand = `docker exec sandbox-${jobId} bash -c "${command.replace(/"/g, '\\"')}"`;
      const { stdout, stderr } = await execAsync(dockerExecCommand);
      
      return {
        output: stdout + stderr,
        exitCode: 0
      };
    } catch (error: any) {
      return {
        output: error.message,
        exitCode: error.code || 1
      };
    }
  }

  async copyFileToContainer(jobId: string, localPath: string, containerPath: string): Promise<void> {
    try {
      await execAsync(`docker cp "${localPath}" sandbox-${jobId}:${containerPath}`);
    } catch (error) {
      throw new Error(`Failed to copy file to container: ${(error as Error).message}`);
    }
  }

  async copyFileFromContainer(jobId: string, containerPath: string, localPath: string): Promise<void> {
    try {
      await execAsync(`docker cp sandbox-${jobId}:${containerPath} "${localPath}"`);
    } catch (error) {
      throw new Error(`Failed to copy file from container: ${(error as Error).message}`);
    }
  }

  private allocatePorts(): ContainerConfig['ports'] {
    // Simple port allocation - in production, you'd want more sophisticated port management
    const offset = this.containers.size;
    return {
      vnc: this.baseVncPort + offset,
      novnc: this.baseNoVncPort + offset,
      jupyter: this.baseJupyterPort + offset,
      dev: this.baseDevPort + offset
    };
  }

  private async checkContainerStatus(jobId: string): Promise<void> {
    const container = this.containers.get(jobId);
    if (!container) return;

    try {
      const { stdout } = await execAsync(`docker ps --filter name=sandbox-${jobId} --format "{{.Status}}"`);
      
      if (stdout.includes('Up')) {
        container.status = 'running';
        container.logs.push('Container is running and ready');
      } else {
        container.status = 'error';
        container.logs.push('Container failed to start');
      }
      
      this.containers.set(jobId, container);
    } catch (error) {
      container.status = 'error';
      container.logs.push(`Error checking status: ${(error as Error).message}`);
      this.containers.set(jobId, container);
    }
  }

  async getContainerLogs(jobId: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`docker logs sandbox-${jobId}`);
      return stdout.split('\n').filter(line => line.trim());
    } catch (error) {
      return [`Error getting logs: ${(error as Error).message}`];
    }
  }

  async listRunningContainers(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('docker ps --filter name=sandbox- --format "{{.Names}}"');
      return stdout.split('\n').filter(name => name.trim()).map(name => name.replace('sandbox-', ''));
    } catch (error) {
      return [];
    }
  }

  async cleanupAllContainers(): Promise<void> {
    try {
      await execAsync('docker stop $(docker ps --filter name=sandbox- -q) || true');
      await execAsync('docker rm $(docker ps --filter name=sandbox- -aq) || true');
    } catch (error) {
      console.error('Error cleaning up containers:', error);
    }
  }
}
