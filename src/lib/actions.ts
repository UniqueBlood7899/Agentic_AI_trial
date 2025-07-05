"use server";

import { revalidatePath } from "next/cache";
import { mockDb } from "./mockDb";
import type { Job } from "./types";

// Simulate the /schedule endpoint
export async function scheduleTask(description: string): Promise<Pick<Job, 'id'>> {
  try {
    // Call the actual API endpoint instead of direct DB manipulation
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task: description }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to schedule task';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If JSON parsing fails, use the status text
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    revalidatePath(`/status/${data.jobId}`);
    return { id: data.jobId };
  } catch (error) {
    console.error('Error in scheduleTask:', error);
    throw error;
  }
}

// Simulate the /status/:id endpoint
export async function getJobStatus(id: string): Promise<Job | null> {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency
  
  if (!mockDb.jobs.has(id)) {
    return null;
  }
  
  // This function simulates the agent making progress
  const job = mockDb.updateJobStatus(id);

  return job || null;
}
