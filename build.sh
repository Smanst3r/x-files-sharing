#!/bin/bash

set -eu

# Too verbose :(
# set -x

set -o pipefail

docker build -t gonandriy/simple-file-share:latest -t gonandriy/simple-file-share:1.3 .

PUSH=
DEPLOY=

for i in "$@"; do
  case $i in
    --push*)
      PUSH=1
      shift
      ;;
    --deploy*)
      DEPLOY=1
      shift
      ;;
    *)
      ;;
  esac
done;

if [[ -n $PUSH ]]; then
  # docker login docker-repo.tracker-software.com:19548
  docker push -a gonandriy/simple-file-share
fi;

if [[ -n $DEPLOY ]]; then
  echo '@TODO: Jerk watchtower...'
fi
