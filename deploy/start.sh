#!/usr/bin/env bash

DEPLOYMENT_PATH='/opt/talytica/application/deploy'
BINARY=$(ls -t $DEPLOYMENT_PATH/*.jar | head -n 1)
RUNNING_PROCESS=$(ps aux | grep 'sudo nohup java -jar ' | grep -v grep | awk '{print $2}')

if [ "${RUNNING_PROCESS:-null}" = null ]; then
    echo "Starting Server with: $BINARY"
    sudo nohup java -jar $BINARY >/dev/null 2>&1 &

else
    echo "Server is already running. PID: $RUNNING_PROCESS"
fi