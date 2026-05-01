#!/bin/sh
set -e

echo "==> Pushing database schema..."
npx drizzle-kit push --force

echo "==> Starting dev server..."
exec npx vinxi dev --host --port 3000
