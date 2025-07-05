# **App Name**: Sandbox AI

## Core Features:

- Sandboxed Environment: Docker container setup for sandboxed environment: Includes a display server, xdot for GUI control, live VNC for remote viewing, Jupyter notebook for code execution, and necessary development tools.
- Orchestration Server: Orchestration server: A simple server with two endpoints: `/schedule` (accepts a plain-text task, returns a job ID, and spins up a Firecracker VM) and `/status/:id` (returns the status of the job and a download link upon completion).
- Shell Execution: Shell tool: Executes shell commands within the sandboxed environment.
- Code Execution: Code Execution tool: Runs TypeScript, Python, and other languages, with context management. Utilizes Jupyter within the container.
- GUI Control: Xdot GUI Control tool: Allows for GUI control within the sandboxed environment via xdot.
- Filesystem Access: Filesystem tool:  Permits creation, editing, and moving of files within the isolated filesystem.  LLM uses reasoning tool to choose what files to use, update, move, or create as necessary for accomplishing tasks.
- Context Persistence: Context management: Uses a file-based state, with intelligent pruning, to persist and recall context beyond the 1M token limit.

## Style Guidelines:

- Primary color:  Deep indigo (#4B0082). Inspired by the concept of isolated computation, it evokes a sense of focus, depth, and security in digital spaces.
- Background color: Light gray (#F0F0F0). Provides a neutral backdrop that ensures readability and minimizes distractions, allowing the primary color to stand out without overwhelming the interface.
- Accent color: Electric violet (#8F00FF). Placed at the other end of the analogous range, it injects a modern, forward-looking touch, representative of innovation and technical capability.
- Font pairing: 'Space Grotesk' (sans-serif) for headlines, 'Inter' (sans-serif) for body text
- Code font: 'Source Code Pro' (monospace) for code display
- Use flat, geometric icons with a line-art style to maintain a clean and modern aesthetic.
- Subtle animations and transitions should be used to enhance user experience without being distracting. For example, loading indicators or file operation confirmations.