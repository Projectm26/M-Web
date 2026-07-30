#!/bin/sh
# Railway mounts /app/data as root; the app runs as user `web`.
# Fix ownership on every start, then drop privileges.
set -eu

mkdir -p /app/data/uploads/heroes
chown -R web:web /app/data

exec su-exec web "$@"
