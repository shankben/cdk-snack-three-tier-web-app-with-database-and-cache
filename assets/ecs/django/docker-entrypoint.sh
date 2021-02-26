#!/bin/bash

DJANGO_VARS=(
  DB_CONNECTION \
  DB_HOST \
  DB_PORT \
  DB_DATABASE \
  DB_USERNAME \
  DB_PASSWORD \
  REDIS_HOST \
  REDIS_PASSWORD \
  REDIS_PORT \
  REDIS_CLIENT \
)

for v in ${DJANGO_VARS[@]}; do
  echo "$v=${!v}" >> /django/app/.env
done

DJANGO_SECRET_KEY=$(cat /dev/urandom | base64 | head -c 64)
echo "DJANGO_SECRET_KEY=$DJANGO_SECRET_KEY" >> /django/app/.env

cat /django/app/.env

sleep 30s && python /django/app/manage.py migrate

exec "$@"
