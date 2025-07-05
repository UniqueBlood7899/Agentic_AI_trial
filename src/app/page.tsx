import { TaskForm } from "@/components/task-form";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-center mb-4 text-primary">
          Sandbox AI
        </h1>
        <p className="text-lg text-muted-foreground text-center mb-10">
          Your personal coding agent. Describe a task, and let our AI handle the
          rest in a secure, sandboxed environment.
        </p>
        <TaskForm />
      </div>
    </div>
  );
}
