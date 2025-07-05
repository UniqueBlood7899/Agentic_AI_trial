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
    const containerInfo = await agent.startSandboxEnvironment();

    // Update job with container info
    job.logs.push({
      timestamp: new Date().toISOString(),
      message: `Sandbox environment started - VNC: ${containerInfo.vncUrl}`,
      type: 'success'
    });

    job.updatedAt = new Date().toISOString();
    mockDb.jobs.set(jobId, job);

    return NextResponse.json({
      success: true,
      containerInfo: {
        vncUrl: containerInfo.vncUrl,
        jupyterUrl: containerInfo.jupyterUrl,
        status: containerInfo.status,
        ports: containerInfo.ports
      }
    });

  } catch (error) {
    console.error('Error starting sandbox:', error);
    return NextResponse.json(
      { error: 'Failed to start sandbox environment' },
      { status: 500 }
    );
  }
}

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

    const agent = new AgentRunner(jobId);
    const containerStatus = await agent.getContainerStatus();

    if (!containerStatus) {
      return NextResponse.json(
        { error: 'No sandbox environment running' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      containerInfo: {
        vncUrl: containerStatus.vncUrl,
        jupyterUrl: containerStatus.jupyterUrl,
        status: containerStatus.status,
        ports: containerStatus.ports,
        logs: containerStatus.logs
      }
    });

  } catch (error) {
    console.error('Error getting sandbox status:', error);
    return NextResponse.json(
      { error: 'Failed to get sandbox status' },
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
    await agent.stopSandboxEnvironment();

    // Update job logs
    job.logs.push({
      timestamp: new Date().toISOString(),
      message: 'Sandbox environment stopped',
      type: 'info'
    });

    job.updatedAt = new Date().toISOString();
    mockDb.jobs.set(jobId, job);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error stopping sandbox:', error);
    return NextResponse.json(
      { error: 'Failed to stop sandbox environment' },
      { status: 500 }
    );
  }
}
