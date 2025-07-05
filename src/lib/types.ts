export type JobStatus =
  | "Queued"
  | "Provisioning"
  | "Running"
  | "Completed"
  | "Failed"
  | "Canceled";

export interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "error" | "warn" | "success" | "command" | "output";
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: string;
  children?: FileNode[];
  content?: string; // For file preview
}

export interface TerminalSession {
  id: string;
  createdAt: string;
  commands: CommandExecution[];
  isActive: boolean;
}

export interface CommandExecution {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  timestamp: string;
  duration: number;
}

export interface Job {
  id: string;
  description: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  logs: LogEntry[];
  downloadUrl?: string;
  previewUrl?: string;
  isInteractive?: boolean;
  fileTree?: FileNode[];
  terminalSessions?: TerminalSession[];
}
