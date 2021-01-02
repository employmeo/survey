#!/usr/bin/env bash
upload_dir=/opt/talytica/application/install
build_dir=/opt/talytica/application/builds
upload_jar=$(ls -rt1 ${upload_dir}/*.jar | tail -n1)
RUNNING_PROCESS=$(ps -ef | grep 'sudo nohup java -jar ' | grep -v grep | awk '{print $2}')

if [ "${upload_jar}" = null ]; then
    echo "no files in upload dir"
else
    echo "Copying ${upload_jar} to builds"
    sudo cp ${upload_jar} ${build_dir}/	
    sudo rm ${upload_dir}/*.jar
fi

if [ "${RUNNING_PROCESS:-null}" = null ]; then
    echo "No Server currently running"
else
    echo "Currently running server processes:"
    echo $RUNNING_PROCESS
    sudo kill $RUNNING_PROCESS
    tail --pid=$RUNNING_PROCESS -f /dev/null
    echo "Server stop complete"
fi
