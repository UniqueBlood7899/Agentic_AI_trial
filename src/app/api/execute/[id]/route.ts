import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mockDb';
import { AgentRunner } from '@/lib/agent/runner';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const { command, sessionId } = await request.json();

    const job = mockDb.jobs.get(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'Completed') {
      return NextResponse.json(
        { error: 'Job not completed yet' },
        { status: 400 }
      );
    }

    const agent = new AgentRunner(jobId);
    const execution = await agent.executeInteractiveCommand(command, sessionId);

    // Update job logs
    job.logs.push({
      timestamp: new Date().toISOString(),
      message: `Command executed: ${command}`,
      type: 'command'
    });

    if (execution.output) {
      job.logs.push({
        timestamp: new Date().toISOString(),
        message: execution.output,
        type: 'output'
      });
    }

    job.updatedAt = new Date().toISOString();
    mockDb.jobs.set(jobId, job);

    return NextResponse.json({
      execution,
      success: execution.exitCode === 0
    });

  } catch (error) {
    console.error('Error executing command:', error);
    return NextResponse.json(
      { error: 'Failed to execute command' },
      { status: 500 }
    );
  }
}
