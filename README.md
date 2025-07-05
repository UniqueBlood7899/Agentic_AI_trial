# Sandbox AI Coding Agent

A comprehensive coding agent platform with full sandboxing, VNC desktop environment, and orchestration layer. Create, modify, and interact with applications in isolated Docker containers with full GUI support.

## Features

- **🏗️ Interactive Project Generation**: AI-powered project creation with real-time editing
- **🖥️ VNC Desktop Environment**: Full Ubuntu desktop with GUI applications via web browser
- **📊 Jupyter Integration**: Built-in Jupyter notebooks for data science and Python development
- **⚡ Live Preview**: Real-time application preview with hot reloading
- **💻 Interactive Terminal**: Execute commands and see output in real-time
- **📁 File Tree Explorer**: Browse and edit project files with syntax highlighting
- **🐳 Secure Sandboxing**: Docker containers with restricted access and command filtering
- **🔧 Development Tools**: Pre-installed Node.js, Python, TypeScript, and build tools
- **📈 Real-time Updates**: Live status updates, logs, and automatic re-packaging
- **☁️ Scalable Orchestration**: Kubernetes deployment for horizontal scaling

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Docker Container

```bash
npm run docker:build
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Create Your First Project

1. Navigate to `http://localhost:3000`
2. Enter a project description (e.g., "Build a todo app in React")
3. Click "Create Job" and wait for completion
4. Access your interactive development environment


## API Endpoints

### POST /api/schedule
Accepts a plain-text task and returns a job ID. Spins up AI generation and optionally a sandboxed container.

### GET /api/status/:id
Returns job status, logs, and download link when complete.

### GET/PUT /api/files/:id/*
Browse and edit project files in real-time.

### POST /api/execute/:id
Execute commands in the project workspace.

### POST/GET/DELETE /api/sandbox/:id
Manage VNC-enabled Docker containers for each project.

### POST/DELETE /api/preview/:id
Start/stop live preview servers for applications.


## Architecture

### Tools
1. **ShellTool** - Execute shell commands with security isolation
2. **FilesystemTool** - Create, edit, move files with path restrictions
3. **CodeExecutionTool** - Run TypeScript/Python with context management
4. **XdotTool** - GUI control via xdotool

### Context Management
The agent uses file-based context persistence that intelligently prunes content to stay under 1M tokens while preserving:
- Recent entries (last 10)
- Important entries (tasks and file changes)
- Relevant context based on keyword matching

### Container Setup
The Docker image includes:
- Ubuntu 22.04 base
- Node.js, TypeScript, Python 3
- Xvfb (virtual display server)
- x11vnc (VNC server)
- noVNC (web-based VNC client)
- Jupyter Notebook
- Development tools

### VNC Access
When a container is running, you can access the GUI via:
- VNC: `localhost:5900`
- Web VNC: `http://localhost:6080`
- Jupyter: `http://localhost:8888`

## Deployment

### Kubernetes
```bash
kubectl apply -f k8s/deployment.yaml
```

This creates:
- 3 replicas with horizontal pod autoscaling (3-10 pods)
- Load balancer service
- Resource limits and requests
- Volume mounts for workspace storage

### Local Docker
```bash
npm run docker:start
```

## Security

- Commands are blacklisted for system safety
- File operations are restricted to workspace directories
- Containers run with limited privileges
- Network isolation between jobs

## Development

### Project Structure
```
src/
├── lib/
│   ├── agent/
│   │   ├── tools/          # Agent tools (shell, filesystem, etc.)
│   │   ├── context/        # Context management
│   │   └── coding-agent.ts # Main agent orchestrator
│   ├── types.ts           # TypeScript definitions
│   └── mockDb.ts          # Job storage
├── app/
│   ├── api/               # REST API endpoints
│   └── status/            # Job status UI
└── components/            # React components
```

### Adding New Tools
1. Create a new tool class in `src/lib/agent/tools/`
2. Implement the tool interface
3. Add security restrictions as needed
4. Integrate with the main `CodingAgent` class

### Testing
The system can be tested with various task types:
- "Build me a todo app in React"
- "Create a Python web scraper"
- "Set up a Node.js API server"

## Interactive Development Features

### 🖥️ VNC Desktop Environment
- **Full Ubuntu Desktop**: Complete Linux desktop environment accessible via web browser
- **GUI Applications**: Firefox, text editors, IDEs, and development tools
- **Mouse & Keyboard Support**: Full interaction through noVNC web interface
- **Multiple Workspaces**: Isolated environments for each project

### 📊 Jupyter Notebooks
- **Data Science Ready**: Pre-installed with NumPy, Pandas, Matplotlib
- **Interactive Development**: Create and run Python notebooks
- **Machine Learning**: Built-in support for ML libraries
- **Visualization**: Interactive charts and plots

### ⚡ Live Development
- **Hot Reloading**: Instant preview of code changes
- **Multiple Ports**: Separate ports for VNC (6080), Jupyter (8888), and dev server (3000)
- **Real-time Terminal**: Execute commands and see output immediately
- **File Synchronization**: Changes reflect instantly across all interfaces

### 📁 File Management
- **Tree Explorer**: Visual file browser with create/edit/delete operations
- **Syntax Highlighting**: Code editor with language-specific highlighting
- **Auto-save**: Automatic file saving and project re-packaging
- **Download Updates**: Get fresh zip files after modifications

## Usage Examples

### Create a React Todo App
```bash
# Example task description
"Build a todo app in React with add, delete, and mark complete features. Include a clean UI with Tailwind CSS."
```

### Create a Python Data Analysis Project
```bash
"Create a Python project that analyzes CSV data and creates interactive charts using Plotly"
```

### Create a Full-Stack Application
```bash
"Build a REST API with Node.js and Express, plus a React frontend that displays data from the API"
```
