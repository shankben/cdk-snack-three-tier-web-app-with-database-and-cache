#!/bin/bash

docker run \
  --name mysql \
  -e TZ=UTC \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=My:password \
  public.ecr.aws/ubuntu/mysql:8.0-20.04_beta

