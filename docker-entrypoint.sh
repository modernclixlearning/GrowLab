#!/bin/sh
set -e

echo "==> Pushing database schema..."
npx drizzle-kit push --force

echo "==> Starting dev server..."
exec npm run dev
