import { FilesystemTool } from '../tools/filesystem';

export interface ContextEntry {
  id: string;
  timestamp: number;
  type: 'task' | 'tool_result' | 'file_change' | 'thought';
  content: string;
  metadata?: Record<string, any>;
}

export interface ContextState {
  entries: ContextEntry[];
  totalTokens: number;
  maxTokens: number;
}

export class ContextManager {
  private fs: FilesystemTool;
  private contextFile: string;
  private maxTokens: number;
  private currentState: ContextState;

  constructor(workspacePath: string, maxTokens: number = 900000) {
    this.fs = new FilesystemTool(workspacePath);
    this.contextFile = '.agent_context.json';
    this.maxTokens = maxTokens;
    this.currentState = {
      entries: [],
      totalTokens: 0,
      maxTokens
    };
  }

  async initialize(): Promise<void> {
    try {
      const result = await this.fs.execute({
        type: 'read',
        path: this.contextFile
      });
      this.currentState = JSON.parse(result.content);
    } catch (error) {
      await this.save();
    }
  }

  async addEntry(entry: Omit<ContextEntry, 'id' | 'timestamp'>): Promise<void> {
    const contextEntry: ContextEntry = {
      ...entry,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    this.currentState.entries.push(contextEntry);
    this.currentState.totalTokens += this.estimateTokens(entry.content);

    if (this.currentState.totalTokens > this.maxTokens) {
      await this.pruneContext();
    }

    await this.save();
  }

  async getRelevantContext(query: string, maxEntries: number = 20): Promise<ContextEntry[]> {
    const keywords = query.toLowerCase().split(' ');
    
    const scoredEntries = this.currentState.entries.map(entry => {
      const content = entry.content.toLowerCase();
      const score = keywords.reduce((acc, keyword) => {
        const matches = (content.match(new RegExp(keyword, 'g')) || []).length;
        return acc + matches;
      }, 0);
      
      return { entry, score };
    });

    return scoredEntries
      .sort((a, b) => {
        if (a.score === b.score) {
          return b.entry.timestamp - a.entry.timestamp;
        }
        return b.score - a.score;
      })
      .slice(0, maxEntries)
      .map(item => item.entry);
  }

  private async pruneContext(): Promise<void> {
    const sortedByTime = [...this.currentState.entries].sort((a, b) => b.timestamp - a.timestamp);
    const recentEntries = sortedByTime.slice(0, 10);
    const importantEntries = this.currentState.entries.filter(entry => 
      entry.type === 'task' || entry.type === 'file_change'
    );

    const keptEntries = [...recentEntries];
    importantEntries.forEach(entry => {
      if (!keptEntries.find(kept => kept.id === entry.id)) {
        keptEntries.push(entry);
      }
    });

    this.currentState.entries = keptEntries;
    this.currentState.totalTokens = keptEntries.reduce((acc, entry) => 
      acc + this.estimateTokens(entry.content), 0
    );
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private async save(): Promise<void> {
    await this.fs.execute({
      type: 'write',
      path: this.contextFile,
      content: JSON.stringify(this.currentState, null, 2)
    });
  }
}
