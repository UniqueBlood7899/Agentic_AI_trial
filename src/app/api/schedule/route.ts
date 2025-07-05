import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { mockDb } from '@/lib/mockDb';
import { AgentRunner } from '@/lib/agent/runner';
import type { Job } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { task } = await request.json();
    
    if (!task || typeof task !== 'string') {
      return NextResponse.json(
        { error: 'Task is required and must be a string' },
        { status: 400 }
      );
    }

    const jobId = `job_${uuidv4()}`;
    const job: Job = {
      id: jobId,
      description: task,
      status: 'Queued',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: [
        {
          timestamp: new Date().toISOString(),
          message: 'Job scheduled successfully',
          type: 'info'
        }
      ]
    };

    mockDb.jobs.set(jobId, job);

    // Start real background job processing
    processJobInBackground(jobId, task);

    return NextResponse.json({ 
      jobId, 
      status: job.status,
      message: 'Job scheduled successfully'
    });
  } catch (error) {
    console.error('Error scheduling job:', error);
    return NextResponse.json(
      { error: 'Failed to schedule job' },
      { status: 500 }
    );
  }
}

async function processJobInBackground(jobId: string, task: string) {
  const job = mockDb.jobs.get(jobId);
  if (!job) return;

  try {
    // Update status to provisioning
    job.status = 'Provisioning';
    job.logs.push({
      timestamp: new Date().toISOString(),
      message: 'Initializing agent workspace...',
      type: 'info'
    });
    mockDb.jobs.set(jobId, job);

    // Wait a bit to simulate provisioning
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update status to running
    job.status = 'Running';
    job.logs.push({
      timestamp: new Date().toISOString(),
      message: 'Agent started, analyzing task requirements...',
      type: 'info'
    });
    mockDb.jobs.set(jobId, job);

    // Create agent runner and execute task
    const agent = new AgentRunner(jobId);
    
    job.logs.push({
      timestamp: new Date().toISOString(),
      message: 'Generating project structure...',
      type: 'info'
    });
    mockDb.jobs.set(jobId, job);

    await agent.executeTask(task);

    job.logs.push({
      timestamp: new Date().toISOString(),
      message: 'Project generated, packaging files...',
      type: 'info'
    });
    mockDb.jobs.set(jobId, job);

    // Package the project
    const zipPath = await agent.packageProject(jobId);

    // Update job as completed
    job.status = 'Completed';
    job.downloadUrl = `/api/download/${jobId}`;
    job.logs.push({
      timestamp: new Date().toISOString(),
      message: 'Task completed successfully! Project ready for download.',
      type: 'success'
    });
    mockDb.jobs.set(jobId, job);

  } catch (error) {
    console.error('Error processing job:', error);
    
    job.status = 'Failed';
    job.logs.push({
      timestamp: new Date().toISOString(),
      message: `Task failed: ${(error as Error).message}`,
      type: 'error'
    });
    mockDb.jobs.set(jobId, job);
  }
}
