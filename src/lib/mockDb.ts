import type { Job, JobStatus, LogEntry } from "./types";

declare global {
  var jobStore: Map<string, Job> | undefined;
}

const jobStore = globalThis.jobStore || new Map<string, Job>();
if (process.env.NODE_ENV !== 'production') {
  globalThis.jobStore = jobStore;
}

export const mockDb = {
  jobs: jobStore,
  
  updateJobStatus(id: string): Job | undefined {
    // This method is now primarily used for backward compatibility
    // Real job updates happen through the CodingAgent's onLog callback
    const job = jobStore.get(id);
    if (!job) {
      return undefined;
    }
    
    // Just return the job as-is since real updates happen in the agent
    return job;
  },

  // New method for real-time job updates
  addLogEntry(jobId: string, logEntry: LogEntry): void {
    const job = jobStore.get(jobId);
    if (job) {
      job.logs.push(logEntry);
      job.updatedAt = new Date().toISOString();
      jobStore.set(jobId, job);
    }
  },

  // Update job status directly
  setJobStatus(jobId: string, status: JobStatus): void {
    const job = jobStore.get(jobId);
    if (job) {
      job.status = status;
      job.updatedAt = new Date().toISOString();
      jobStore.set(jobId, job);
    }
  },

  // Set download URL when job completes
  setDownloadUrl(jobId: string, downloadUrl: string): void {
    const job = jobStore.get(jobId);
    if (job) {
      job.downloadUrl = downloadUrl;
      job.updatedAt = new Date().toISOString();
      jobStore.set(jobId, job);
    }
  }
};
