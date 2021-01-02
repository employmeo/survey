#!/usr/bin/env bash

build_dir=/opt/talytica/application/builds
deploy_dir=/opt/talytica/application/deploy

release_build=$(ls -rt1 ${build_dir}/*.jar | tail -n1)
file_name=$(echo $release_build | awk -F" +|/" '{print $NF}')
application_name=$(echo $file_name | awk -F'-' '{print $1}')

echo deploying $release_build for $application_name 
rm -f ${deploy_dir}/*.jar
ln -s ${release_build} ${deploy_dir}/${application_name}.jar