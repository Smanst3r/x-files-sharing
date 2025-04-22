#!/bin/sh

DB_PATH="/app/server/db-data/app.db"

# If the database file is missing, initialize it from the SQL file
if [ ! -f "$DB_PATH" ]; then
  echo "Initializing SQLite DB from app.db.sql..."
  sqlite3 "$DB_PATH" < /app/server/app.db.sql
else
  echo "SQLite DB already exists at $DB_PATH. Skipping init."
fi

# Run the app (the original command passed to CMD)
exec "$@"