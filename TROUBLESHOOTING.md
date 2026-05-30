# GovRecover360 - Troubleshooting Guide

## General Diagnostics

Check all service statuses:

```bash
docker compose ps
```

View all logs:

```bash
docker compose logs
```

Follow a specific service's logs:

```bash
docker compose logs -f <service-name>
```

---

## Docker Compose Issues

### Port Conflicts

**Error**: `port is already allocated` or `address already in use`

**Cause**: One or more required ports (80, 3000, 5432, 6379, 8000, 8050, 8069, 8088) is already in use by another process.

**Solution**:
1. Identify the process using the port:
   ```bash
   lsof -i :<PORT>
   ```
2. Stop the conflicting process, or change port mappings in `docker-compose.yml`.
3. Alternatively, stop all Docker containers and restart:
   ```bash
   docker compose down
   docker compose up -d
   ```

### Volume Permissions

**Error**: `Permission denied` when services try to write to mounted volumes

**Cause**: Docker containers run as non-root users that cannot write to host-mounted directories.

**Solution**:
1. Ensure mounted directories exist:
   ```bash
   mkdir -p data/postgres data/odoo data/superset data/geonode
   ```
2. Fix permissions:
   ```bash
   sudo chown -R 1000:1000 data/  # For PostgreSQL
   sudo chown -R 999:999 data/odoo/  # For Odoo
   ```

### Docker Compose Version

**Error**: `unsupported Compose file version`

**Cause**: Docker Compose version is too old.

**Solution**: Upgrade Docker Compose:
```bash
sudo apt update && sudo apt install docker-compose-plugin
# Or
pip install --upgrade docker-compose
```

---

## Database Connection Issues

### Backend Cannot Connect to PostgreSQL

**Error**: `could not connect to server: Connection refused` or `FATAL: password authentication failed`

**Cause**: PostgreSQL container not ready or credentials mismatch.

**Solution**:
1. Check PostgreSQL is running:
   ```bash
   docker compose ps postgres
   ```
2. Check PostgreSQL logs:
   ```bash
   docker compose logs postgres
   ```
3. Verify credentials in `.env` match `docker-compose.yml`:
   ```bash
   grep DB_PASSWORD .env
   ```
4. Wait for health check to pass (backend waits for healthy postgres):
   ```bash
   docker compose exec postgres pg_isready -U govrecover
   ```

### PostgreSQL Health Check Fails

**Error**: `healthcheck: unhealthy`

**Solution**:
1. Restart PostgreSQL:
   ```bash
   docker compose restart postgres
   ```
2. If data is corrupted, reset the volume:
   ```bash
   docker compose down -v
   docker compose up -d
   ```
   Warning: This deletes all data.

---

## Backend Won't Start

### Seed Data Fails

**Error**: `Error during seeding: ...` in backend logs

**Cause**: Database tables already exist with conflicting data, or a database error.

**Solution**:
1. Check the full error in logs:
   ```bash
   docker compose logs backend
   ```
2. Reset the database and restart:
   ```bash
   docker compose down -v
   docker compose up -d
   ```

### Module Import Errors

**Error**: `ModuleNotFoundError: No module named 'app'`

**Cause**: Working directory or Python path issue.

**Solution**: Ensure backend container is running from the correct directory. Rebuild the image:
```bash
docker compose build backend
docker compose up -d
```

### Dependency Issues

**Error**: `pkg_resources.DistributionNotFound` or import errors in logs

**Solution**: Rebuild the backend image to reinstall dependencies:
```bash
docker compose build --no-cache backend
docker compose up -d
```

---

## Frontend Shows Blank Page

### Browser Console Shows 404 or API Errors

**Cause**: Backend API not accessible from frontend.

**Solution**:
1. Check that backend is running and healthy:
   ```bash
   curl http://localhost:8000/api/health
   ```
2. Check Nginx configuration is correct:
   ```bash
   docker compose logs nginx
   ```
3. Verify VITE_API_URL in frontend environment:
   ```bash
   docker compose exec frontend env | grep VITE
   ```

### JavaScript Errors

**Cause**: Frontend build failed or TypeScript compilation errors.

**Solution**:
1. Check frontend logs:
   ```bash
   docker compose logs frontend
   ```
2. Rebuild the frontend:
   ```bash
   docker compose build frontend
   docker compose up -d
   ```

---

## Odoo Module Not Loading

### Module Not Found in Odoo Apps List

**Error**: Custom Odoo modules not visible in the Apps menu.

**Cause**: Modules not in the addons path or not installed.

**Solution**:
1. Verify custom modules exist in `./odoo/addons/`
2. Check Odoo logs:
   ```bash
   docker compose logs odoo
   ```
3. Enable developer mode in Odoo, then go to Apps -> Update Apps List
4. Search for the module and click Install
5. If modules are in a subdirectory, update the addons path in `odoo/config/odoo.conf`

### Database Connection Error

**Error**: `FATAL: database "postgres" does not exist`

**Solution**: The Odoo database container should create the default database automatically. Check Odoo DB logs:
```bash
docker compose logs odoo-db
```
Restart Odoo DB if needed:
```bash
docker compose restart odoo-db
```

---

## Superset Connection Issues

### Cannot Log In

**Error**: Invalid login credentials for Superset.

**Solution**: Default credentials are `admin` / `admin`. If the password was changed, check `.env`:
```bash
grep SUPERSET_ADMIN_PASSWORD .env
```
Reset Superset:
```bash
docker compose down superset
docker compose up -d superset
```

### Superset Cannot Connect to Database

**Error**: `Database connection failed` when adding the GovRecover database.

**Solution**:
1. Verify PostgreSQL is running:
   ```bash
   docker compose ps postgres
   ```
2. Check the database URI. In Superset SQL Lab, use:
   ```
   postgresql://govrecover:govrecover@2026@postgres:5432/govrecover
   ```
3. Note: Superset runs inside Docker, so `localhost` refers to the container, not the host. Use the Docker service name `postgres`.

---

## WSO2 API Manager Issues

### WSO2 Not Running

**Error**: WSO2 API Manager is not included in the default `docker-compose.yml`.

**Solution**: WSO2 requires a separate setup. See [docs/wso2/WSO2_GUIDE.md](docs/wso2/WSO2_GUIDE.md) for instructions. A standalone Docker Compose option is available.

### Token Validation Fails

**Error**: `401 Unauthorized` or `Invalid OAuth2 token`

**Solution**:
1. Verify the WSO2 gateway is running
2. Check that the API is published and subscribed
3. Ensure the token has the correct scopes
4. Verify the JWT assertion is correctly configured

---

## AI Service Not Responding

### Connection Refused

**Error**: `Connection refused` when backend tries to reach AI service on port 8050.

**Solution**:
1. Check AI service is running:
   ```bash
   docker compose ps ai-service
   ```
2. Check AI service logs:
   ```bash
   docker compose logs ai-service
   ```
3. Verify the AI service is healthy:
   ```bash
   curl http://localhost:8050/health
   ```

### AI Provider Errors

**Error**: `OpenAI API key not configured` or similar provider errors.

**Solution**:
1. Set the AI provider to `mock` for development (default):
   ```
   AI_PROVIDER=mock
   ```
2. To use a real provider, set the corresponding API key in `.env`:
   ```
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-...
   ```
3. Restart the AI service after changing environment variables:
   ```bash
   docker compose restart ai-service
   ```

---

## GeoNode Issues

### GeoNode Not Running

**Note**: GeoNode is not included in the default `docker-compose.yml`. It is expected to run separately or be integrated as a GIS layer service.

**Solution**: If GeoNode is required, add a GeoNode service to `docker-compose.yml` or run it separately. The PostGIS database is already configured to support GeoNode data.

### PostGIS Extension Missing

**Error**: `function st_geomfromtext does not exist`

**Solution**: The postgis extension must be enabled:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```
Connect to the database and run:
```bash
docker compose exec postgres psql -U govrecover -d govrecover -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

---

## Seed Data Not Loading

### Seed Script Fails Silently

**Error**: No seed data appears in the database.

**Cause**: The seed script may have run previously and skipped seeding because data already exists.

**Solution**:
1. Force reseed by clearing the database:
   ```bash
   docker compose down -v
   docker compose up -d
   ```
2. Check backend logs to confirm seed ran:
   ```bash
   docker compose logs backend | grep Seed
   ```
3. Manually run the seed script:
   ```bash
   docker compose exec backend python app/seed.py
   ```

### Demo Users Not Created

**Error**: Cannot log in with demo credentials.

**Solution**:
1. Check the users table:
   ```bash
   docker compose exec postgres psql -U govrecover -d govrecover -c "SELECT email, role FROM users;"
   ```
2. If users exist but password is wrong, the password in .env may have changed after seeding. Clear data and restart:
   ```bash
   docker compose down -v
   docker compose up -d
   ```

---

## JWT Auth Issues

### Invalid Token

**Error**: `401 Unauthorized - Could not validate credentials`

**Cause**: Token expired, invalid signature, or SECRET_KEY mismatch.

**Solution**:
1. Log out and log in again to get a fresh token
2. Ensure SECRET_KEY is consistent across backend restarts
3. Check token expiry (default 60 minutes):
   ```bash
   # Decode JWT to check expiry
   python -c "import jwt; print(jwt.decode('YOUR_TOKEN', options={'verify_signature': False}))"
   ```
4. If SECRET_KEY was changed, all existing tokens are invalid. Restart and re-login:
   ```bash
   docker compose restart backend
   ```

### Token Not Sent

**Error**: `403 Forbidden` even with valid login.

**Cause**: Frontend not sending Bearer token in Authorization header.

**Solution**:
1. Check browser localStorage for the token:
   - Open DevTools -> Application -> Local Storage
   - Look for key like `auth_token` or `access_token`
2. Clear localStorage and re-login
3. Check the API client (axios/fetch) is attaching the Authorization header

---

## CORS Errors

### Browser Console: CORS Error

**Error**: `Access to fetch at 'http://localhost:8000/...' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Cause**: CORS configuration mismatch between frontend and backend.

**Solution**:
1. Verify backend CORS middleware allows the frontend origin:
   ```python
   # In backend/app/main.py
   allow_origins=["http://localhost:3000"]
   ```
2. Check Nginx is not stripping CORS headers
3. If using a custom port or domain, update both:
   - Backend CORS middleware `allow_origins`
   - Nginx `Access-Control-Allow-Origin` header
4. Restart backend after changes:
   ```bash
   docker compose restart backend
   ```

---

## Logs Location for Each Service

| Service | Log Access Command |
|---|---|
| All services | `docker compose logs` |
| Backend | `docker compose logs backend` |
| Frontend | `docker compose logs frontend` |
| PostgreSQL | `docker compose logs postgres` |
| Redis | `docker compose logs redis` |
| Odoo | `docker compose logs odoo` |
| Odoo DB | `docker compose logs odoo-db` |
| Superset | `docker compose logs superset` |
| AI Service | `docker compose logs ai-service` |
| Nginx | `docker compose logs nginx` |

Follow logs in real-time with the `-f` flag, e.g., `docker compose logs -f backend`.

To see only the last N lines: `docker compose logs --tail=100 backend`

## Reset Everything

To completely reset the environment and start fresh:

```bash
# Stop and remove all containers and volumes
docker compose down -v

# Remove any orphaned containers
docker compose rm -f

# Rebuild all images
docker compose build --no-cache

# Start fresh
docker compose up -d

# Check all services are healthy
docker compose ps
```

Warning: `docker compose down -v` deletes all database data, including seeded data. Volumes will be recreated on next startup.
