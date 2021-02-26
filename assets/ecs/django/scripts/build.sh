#!/bin/bash

docker build -t django . && \
docker run \
  --rm \
  -it \
  -p 8000:8000 \
  -e DB_CONNECTION= \
  -e DB_HOST=
  -e DB_PORT=
  -e DB_DATABASE=
  -e DB_USERNAME=
  -e DB_PASSWORD=

  django
