import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mockDb';
import { AgentRunner } from '@/lib/agent/runner';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; path: string }> }
) {
  try {
    const { id: jobId, path: filePath } = await params;

    const job = mockDb.jobs.get(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const agent = new AgentRunner(jobId);
    const content = await agent.getFileContent(decodeURIComponent(filePath));

    return NextResponse.json({ content });

  } catch (error) {
    console.error('Error getting file content:', error);
    return NextResponse.json(
      { error: 'Failed to get file content' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; path: string }> }
) {
  try {
    const { id: jobId, path: filePath } = await params;
    const { content } = await request.json();

    const job = mockDb.jobs.get(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const agent = new AgentRunner(jobId);
    await agent.updateFileContent(decodeURIComponent(filePath), content);

    // Update job logs
    job.logs.push({
      timestamp: new Date().toISOString(),
      message: `File updated: ${decodeURIComponent(filePath)}`,
      type: 'info'
    });

    job.updatedAt = new Date().toISOString();
    mockDb.jobs.set(jobId, job);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating file:', error);
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    );
  }
}
