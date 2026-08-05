#!/bin/sh
# Railway mounts /app/data as root; the app must run as user `web`.
# Fix ownership on every start, then drop privileges.
set -eu

mkdir -p /app/data/uploads/heroes
# Volume may be empty or root-owned on first attach.
chown -R web:web /app/data || {
  echo "[web] WARN: chown /app/data failed — uploads may be read-only" >&2
}

exec gosu web "$@"
