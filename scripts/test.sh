#!/usr/bin/env bash
# Runs the licence-seat suite against a throwaway Postgres database, built from
# the migration files so each run also proves they produce a working schema.
set -euo pipefail
cd "$(dirname "$0")/.."

DB_NAME="${TEST_DB_NAME:-admin_saas_test}"
PG_USER="${TEST_PG_USER:-postgres}"
export DATABASE_URL="postgresql://${PG_USER}:${TEST_PG_PASSWORD:-postgres}@localhost:5432/${DB_NAME}?schema=public"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found on PATH — install PostgreSQL client tools to run the tests." >&2
  exit 1
fi

echo "▸ recreating scratch database ${DB_NAME}"
psql -U "$PG_USER" -q -c "DROP DATABASE IF EXISTS ${DB_NAME};" -c "CREATE DATABASE ${DB_NAME};"

echo "▸ applying migrations"
npx prisma migrate deploy >/dev/null

echo "▸ running tests"
node test/seats.test.cjs

echo "▸ dropping scratch database"
psql -U "$PG_USER" -q -c "DROP DATABASE IF EXISTS ${DB_NAME};"
