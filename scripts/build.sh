#!/bin/bash

set -e

mkdir -p dist/assets
mkdir -p dist/secrets

npx tsc

rsync -azr --delete secrets/ dist/secrets/
rsync -azr --delete assets/ dist/assets/
