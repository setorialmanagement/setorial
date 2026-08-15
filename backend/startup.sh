#!/bin/sh
set -e

echo "Running Prisma migrations..."
NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma migrate deploy

echo "Starting application..."
exec node dist/src/main
