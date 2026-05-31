#!/bin/sh
# GovRecover360 backend entrypoint
# Runs seed.py but treats failure as a non-fatal warning so uvicorn always starts.

set -e

echo "==> Running database seed/migration..."
python app/seed.py && echo "==> Seed completed successfully." || echo "[WARN] Seed failed (may already be seeded or DB not yet ready). Continuing..."

echo "==> Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
