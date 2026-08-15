#!/bin/sh
set -e

echo "Running Prisma db push..."
NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma db push --accept-data-loss

echo "Starting application..."
exec node dist/src/main
