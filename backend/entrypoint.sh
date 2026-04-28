#!/bin/sh
set -e

echo ">>> Waiting for database..."
python << 'EOF'
import os, time, psycopg2

for attempt in range(30):
    try:
        psycopg2.connect(
            dbname=os.environ["POSTGRES_DB"],
            user=os.environ["POSTGRES_USER"],
            password=os.environ["POSTGRES_PASSWORD"],
            host=os.environ["POSTGRES_HOST"],
            port=os.environ.get("POSTGRES_PORT", "5432"),
        )
        print(f"Database ready after {attempt + 1} attempt(s).")
        break
    except psycopg2.OperationalError:
        print(f"Attempt {attempt + 1}/30 — database not ready yet, retrying in 2s...")
        time.sleep(2)
else:
    print("ERROR: Could not connect to database after 30 attempts. Exiting.")
    exit(1)
EOF

echo ">>> Applying migrations..."
python manage.py migrate --noinput

echo ">>> Creating superuser (skipped if already exists)..."
python manage.py createsuperuser --noinput 2>/dev/null || true

echo ">>> Starting server..."
exec "$@"
