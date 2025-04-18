#!/bin/sh

cd /app/server

# If database file is missing, create it from SQL
if [ ! -f ./app.db ]; then
  echo "Initializing SQLite DB from app.db.sql..."
  sqlite3 app.db < app.db.sql
else
  echo "SQLite DB already exists. Skipping init."
fi

exec "$@"