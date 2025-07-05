#!/bin/bash

# Start X virtual framebuffer
Xvfb :1 -screen 0 1024x768x16 &
export DISPLAY=:1

# Start window manager
fluxbox &

# Start VNC server
x11vnc -display :1 -nopw -listen localhost -xkb -ncache 10 -ncache_cr -forever &

# Start noVNC web client
/opt/novnc/utils/novnc_proxy --vnc localhost:5900 --listen 0.0.0.0:6080 &

# Start Jupyter notebook
cd /home/agent/workspace
jupyter notebook --ip=0.0.0.0 --port=8888 --no-browser --allow-root &

# Keep container running
tail -f /dev/null
