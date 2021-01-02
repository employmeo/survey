#!/usr/bin/env bash
RUNNING_PROCESS=$(ps -ef | grep 'sudo nohup java -jar ' | grep -v grep | awk '{print $2}')

if [ "${RUNNING_PROCESS:-null}" = null ]; then
    echo "No Server currently running"
    exit 1
else
    echo "Currently running server processes:"
    echo $RUNNING_PROCESS
    exit 0
fi