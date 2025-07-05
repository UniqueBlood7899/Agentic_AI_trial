FROM ubuntu:22.04

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    nodejs \
    npm \
    xvfb \
    x11vnc \
    fluxbox \
    xdotool \
    websockify \
    curl \
    git \
    vim \
    nano \
    wget \
    unzip \
    imagemagick \
    build-essential \
    firefox \
    chromium-browser \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install TypeScript globally
RUN npm install -g typescript ts-node

# Install Python packages including Jupyter
RUN pip3 install \
    jupyter \
    notebook \
    ipywidgets \
    matplotlib \
    numpy \
    pandas \
    requests \
    flask \
    fastapi \
    uvicorn

# Create agent user
RUN useradd -m -s /bin/bash agent
RUN mkdir -p /home/agent/workspace
RUN chown -R agent:agent /home/agent

# Set up VNC and noVNC
RUN wget -qO- https://github.com/novnc/noVNC/archive/v1.4.0.tar.gz | tar xz -C /opt
RUN mv /opt/noVNC-1.4.0 /opt/novnc
RUN ln -s /opt/novnc/vnc.html /opt/novnc/index.html

# Set up supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose ports
EXPOSE 5900 6080 8888 3000

# Switch to agent user
USER agent
WORKDIR /home/agent/workspace

# Set environment variables
ENV DISPLAY=:1
ENV VNC_PORT=5900
ENV NOVNC_PORT=6080
ENV JUPYTER_PORT=8888

# Start services using supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
