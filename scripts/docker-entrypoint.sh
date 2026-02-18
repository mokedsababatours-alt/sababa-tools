#!/bin/sh
set -e

# Ensure data directory exists and is writable by nextjs (uid 1001)
# When a volume is mounted at /app/data, it may have root ownership
mkdir -p /app/data
chown -R nextjs:nodejs /app/data 2>/dev/null || true

exec su-exec nextjs node server.js
