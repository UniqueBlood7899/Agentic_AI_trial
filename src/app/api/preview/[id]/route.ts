import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mockDb';
import { AgentRunner } from '@/lib/agent/runner';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

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
    const previewUrl = await agent.startPreviewServer();

    // Update job with preview URL
    job.previewUrl = previewUrl;
    job.isInteractive = true;
    job.logs.push({
      timestamp: new Date().toISOString(),
      message: `Preview server started at ${previewUrl}`,
      type: 'success'
    });

    job.updatedAt = new Date().toISOString();
    mockDb.jobs.set(jobId, job);

    return NextResponse.json({ 
      previewUrl,
      success: true 
    });

  } catch (error) {
    console.error('Error starting preview:', error);
    return NextResponse.json(
      { error: 'Failed to start preview server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    const job = mockDb.jobs.get(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const agent = new AgentRunner(jobId);
    await agent.stopPreviewServer();

    // Update job
    job.previewUrl = undefined;
    job.isInteractive = false;
    job.logs.push({
      timestamp: new Date().toISOString(),
      message: 'Preview server stopped',
      type: 'info'
    });

    job.updatedAt = new Date().toISOString();
    mockDb.jobs.set(jobId, job);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error stopping preview:', error);
    return NextResponse.json(
      { error: 'Failed to stop preview server' },
      { status: 500 }
    );
  }
}
