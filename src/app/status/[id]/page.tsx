import { getJobStatus } from "@/lib/actions";
import { notFound } from "next/navigation";
import { JobStatusDetail } from "./_components/job-status-detail";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type JobStatusPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function JobStatusPage({ params }: JobStatusPageProps) {
  const { id } = await params; // Await params before accessing properties
  const job = await getJobStatus(id);

  if (!job) {
    notFound();
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
       <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-headline text-2xl md:text-3xl">Job Status</CardTitle>
          <CardDescription className="font-mono text-sm">ID: {job.id}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{job.description}</p>
        </CardContent>
      </Card>
      
      <JobStatusDetail initialJob={job} />
    </div>
  );
}
