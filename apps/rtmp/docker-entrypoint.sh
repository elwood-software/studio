#!/bin/sh

set -e

trap "exit 0" TERM

/usr/local/nginx/sbin/nginx

cd /app

exec npm start
