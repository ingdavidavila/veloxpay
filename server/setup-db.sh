#!/usr/bin/env bash
# One-shot database setup for VeloxPay.
# Run AFTER installing Postgres.app and clicking Initialize:
#   bash server/setup-db.sh
set -euo pipefail

DB_NAME="veloxpay"
PGAPP_BIN="/Applications/Postgres.app/Contents/Versions/latest/bin"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- locate psql -------------------------------------------------------
# Prefer whatever is on PATH; fall back to the Postgres.app bundle so this
# works even before ~/.zshrc has been updated.
if command -v psql >/dev/null 2>&1; then
  PSQL="$(command -v psql)"
  CREATEDB="$(command -v createdb)"
elif [ -x "$PGAPP_BIN/psql" ]; then
  PSQL="$PGAPP_BIN/psql"
  CREATEDB="$PGAPP_BIN/createdb"
else
  echo "❌ psql not found."
  echo "   Install Postgres.app from https://postgresapp.com, open it,"
  echo "   and click Initialize. Then re-run this script."
  exit 1
fi
echo "✅ psql: $PSQL"

# --- check the server is actually accepting connections ----------------
if ! "$PSQL" -d postgres -c 'SELECT 1' >/dev/null 2>&1; then
  echo "❌ Postgres is installed but not accepting connections on :5432."
  echo "   Open Postgres.app and make sure the server is started (green light)."
  exit 1
fi
echo "✅ Postgres is running"

# --- create the database (idempotent) ----------------------------------
if "$PSQL" -lqt | cut -d '|' -f1 | grep -qw "$DB_NAME"; then
  echo "ℹ️  database '$DB_NAME' already exists, leaving it alone"
else
  "$CREATEDB" "$DB_NAME"
  echo "✅ created database '$DB_NAME'"
fi

# --- load the schema (schema.sql is idempotent) ------------------------
echo "→ loading schema..."
"$PSQL" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/schema.sql"
echo "✅ schema loaded"

# --- verify ------------------------------------------------------------
echo
echo "=== tables ==="
"$PSQL" -d "$DB_NAME" -c '\dt'

echo "=== users columns ==="
"$PSQL" -d "$DB_NAME" -c '\d users'

echo
echo "🎉 Database '$DB_NAME' is ready and the schema is up to date."
echo "   Start the API with:  npm run server"
