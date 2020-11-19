#!/bin/bash

isCommand() {
  if [ "$1" = "sh" ]; then
    return 1
  fi
  composer help "$1" > /dev/null 2>&1
}

LARAVEL_VARS=(
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

for v in ${LARAVEL_VARS[@]}; do
  echo "$v=${!v}" >> /laravel/app/.env
done

if [ "${1#-}" != "$1" ]; then
  set -- /sbin/tini -- composer "$@"
elif [ "$1" = 'composer' ]; then
  set -- /sbin/tini -- "$@"
elif isCommand "$1"; then
  set -- /sbin/tini -- composer "$@"
fi

exec "$@"
