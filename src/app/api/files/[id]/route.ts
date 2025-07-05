import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mockDb';
import { AgentRunner } from '@/lib/agent/runner';

export async function GET(
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
    const fileTree = await agent.getFileTree();

    return NextResponse.json({ fileTree });

  } catch (error) {
    console.error('Error getting file tree:', error);
    return NextResponse.json(
      { error: 'Failed to get file tree' },
      { status: 500 }
    );
  }
}
