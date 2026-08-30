#!/bin/sh
set -e

# By default, avoid running prisma db push at container start in Cloud Run
# as it may block startup if the database is unreachable. To enable, set
# RUN_PRISMA_PUSH=true in the environment.
if [ "${RUN_PRISMA_PUSH}" = "true" ]; then
	echo "Running Prisma db push..."
	NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma db push --accept-data-loss
else
	echo "Skipping Prisma db push (set RUN_PRISMA_PUSH=true to enable)"
fi

echo "Starting application..."
exec node dist/src/main
