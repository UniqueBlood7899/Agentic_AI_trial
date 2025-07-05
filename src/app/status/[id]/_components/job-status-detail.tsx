"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getJobStatus } from "@/lib/actions";
import type { Job, LogEntry, JobStatus } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import {
  Download,
  Terminal,
  MousePointer,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  AlertTriangle,
  FileCode,
  Folder,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const statusConfig: Record<
  JobStatus,
  { variant: VariantProps<typeof badgeVariants>["variant"]; icon: JSX.Element }
> = {
  Queued: { variant: "secondary", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
  Provisioning: { variant: "default", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
  Running: { variant: "secondary", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
  Completed: { variant: "success", icon: <CheckCircle2 className="h-4 w-4" /> },
  Failed: { variant: "destructive", icon: <XCircle className="h-4 w-4" /> },
  Canceled: { variant: "outline", icon: <XCircle className="h-4 w-4" /> },
};

const logIconConfig: Record<LogEntry["type"], React.ReactNode> = {
  info: <Info className="h-4 w-4 text-primary" />,
  error: <XCircle className="h-4 w-4 text-destructive" />,
  warn: <AlertTriangle className="h-4 w-4 text-muted-foreground" />,
  success: <CheckCircle2 className="h-4 w-4 text-success" />,
};

export function JobStatusDetail({ initialJob }: { initialJob: Job }) {
  const [job, setJob] = useState<Job>(initialJob);

  useEffect(() => {
    if (
      job.status === "Completed" ||
      job.status === "Failed" ||
      job.status === "Canceled"
    ) {
      return;
    }

    const interval = setInterval(async () => {
      const updatedJob = await getJobStatus(job.id);
      if (updatedJob) {
        setJob(updatedJob);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [job.id, job.status]);

  const currentStatus = statusConfig[job.status];

  const renderToolTrigger = (icon: React.ReactNode, name: string) => (
    <div className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:-translate-y-1 hover:shadow-lg">
      {icon}
      <span className="text-sm font-semibold">{name}</span>
      <Badge variant="success" className="gap-1">
        <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
        Active
      </Badge>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Agent Log</CardTitle>
            <CardDescription>
              Live stream of the agent's operations and thoughts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full border rounded-md p-4 bg-muted/20">
              <div className="space-y-4 font-code text-sm">
                {job.logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {logIconConfig[log.type]}
                    </div>
                    <div className="flex-grow">
                      <p className="text-muted-foreground text-xs">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                      <p>{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Tools</CardTitle>
            <CardDescription>
              Tools available to the agent in the sandboxed environment.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Shell Tool */}
            <Dialog>
              <DialogTrigger asChild>
                {renderToolTrigger(
                  <Terminal className="h-8 w-8 text-primary" />,
                  "Shell"
                )}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Simulated Shell</DialogTitle>
                  <DialogDescription>
                    Execute commands in the sandboxed environment.
                  </DialogDescription>
                </DialogHeader>
                <div className="h-64 rounded-md bg-black p-4 font-mono text-sm text-green-400 overflow-y-auto">
                  <p>agent@sandbox:~$ ls -l</p>
                  <p>total 4</p>
                  <p>-rw-r--r-- 1 agent agent 1024 Jul 1 10:00 package.json</p>
                  <p>-rw-r--r-- 1 agent agent  512 Jul 1 10:01 app.js</p>
                  <p>agent@sandbox:~$ <span className="animate-pulse bg-green-400">&nbsp;</span></p>
                </div>
              </DialogContent>
            </Dialog>

            {/* Code Exec Tool */}
            <Dialog>
              <DialogTrigger asChild>
                {renderToolTrigger(
                  <FileCode className="h-8 w-8 text-primary" />,
                  "Code Exec"
                )}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Simulated Code Execution</DialogTitle>
                  <DialogDescription>
                    Run code snippets and scripts.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea 
                    className="font-code"
                    defaultValue={`console.log("Hello from the sandbox!");`}
                  />
                  <Button>Execute</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* GUI Control Tool */}
            <Dialog>
              <DialogTrigger asChild>
                {renderToolTrigger(
                  <MousePointer className="h-8 w-8 text-primary" />,
                  "GUI Control"
                )}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Simulated GUI Control</DialogTitle>
                  <DialogDescription>
                    Programmatically control the mouse and keyboard.
                  </DialogDescription>
                </DialogHeader>
                <div className="text-center text-muted-foreground p-8">
                  <p>GUI control actions would appear here.</p>
                  <p className="font-mono text-sm mt-2">e.g., click(x: 250, y: 400)</p>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Filesystem Tool */}
            <Dialog>
              <DialogTrigger asChild>
                {renderToolTrigger(
                  <Folder className="h-8 w-8 text-primary" />,
                  "Filesystem"
                )}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Simulated Filesystem</DialogTitle>
                  <DialogDescription>
                    Browse and manage files in the project directory.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 font-mono text-sm p-4 border rounded-md">
                    <p className="flex items-center gap-2"><Folder size={16} /> /src</p>
                    <p className="flex items-center gap-2 pl-4"><FileCode size={16} /> page.tsx</p>
                    <p className="flex items-center gap-2 pl-4"><FileCode size={16} /> layout.tsx</p>
                    <p className="flex items-center gap-2"><FileCode size={16} /> package.json</p>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={currentStatus.variant} className="gap-2">
                {currentStatus.icon}
                <span>{job.status}</span>
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">
                {new Date(job.createdAt).toLocaleString()}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Last Update</span>
              <span className="font-medium">
                {new Date(job.updatedAt).toLocaleString()}
              </span>
            </div>
          </CardContent>
          {job.status === "Completed" && job.downloadUrl && (
            <CardFooter>
              <Button asChild className="w-full bg-accent hover:bg-accent/90">
                <a href={job.downloadUrl} download>
                  <Download className="mr-2 h-4 w-4" />
                  Download Project
                </a>
              </Button>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>VNC Viewer</CardTitle>
            <CardDescription>
              Observe the agent's screen in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
              <Image
                src="https://placehold.co/640x360.png"
                alt="VNC Viewer feed"
                width={640}
                height={360}
                className="w-full h-full object-cover"
                data-ai-hint="desktop interface"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <span className="relative flex h-3 w-3 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                  </span>
                  Connect to VNC
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Live VNC Feed</DialogTitle>
                    <DialogDescription>
                        This is a simulated view of the agent's desktop.
                    </DialogDescription>
                </DialogHeader>
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                    <Image
                        src="https://placehold.co/1280x720.png"
                        alt="VNC Viewer feed"
                        width={1280}
                        height={720}
                        className="w-full h-full object-cover"
                        data-ai-hint="desktop interface code"
                    />
                </div>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
