# Deployment Guide – Backend & Frontend to Live Server

Use this when deploying to your main/production server.

---

## 1. Backend (warehouse-monitoring) on server

### 1.1 Server requirements
- Node.js (v18+)
- MySQL (same version you use locally)
- Git (to clone/pull)

### 1.2 Deploy code
```bash
# On server
git clone https://github.com/LODHILODHI/warehouse-monitoring-backend.git
cd warehouse-monitoring-backend
# Or if already cloned: git pull origin main
npm install --production
```

### 1.3 Backend environment variables (production)

Create `.env` **on the server** (do not commit this file). Replace with your real values.

```env
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=warehouse_monitoring
DB_USER=your_db_user
DB_PASSWORD=your_strong_db_password

JWT_SECRET=use-a-long-random-secret-at-least-32-chars

ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

**Important:**
- **JWT_SECRET:** Change from `your-secret-key` to a long random string (e.g. 32+ chars). Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **DB_***:** Use the MySQL user/password/host that your server’s MySQL uses. If DB is on same machine, `DB_HOST=localhost` is fine.
- **ALLOWED_ORIGINS:** Comma-separated list of your frontend URLs (no trailing slash). Backend will reject requests from other origins in production.

### 1.4 Database on server
- Create MySQL database: `warehouse_monitoring` (or name in `DB_NAME`).
- Create a MySQL user with access to that DB.
- Run the app once so it creates tables (Sequelize sync), or run migrations if you add them later.

### 1.5 Run backend (keep it running)
**Option A – PM2 (recommended)**
```bash
npm install -g pm2
pm2 start server.js --name warehouse-api
pm2 save
pm2 startup
```

**Option B – Simple**
```bash
node server.js
# Or: nohup node server.js &
```

Backend will listen on `PORT` (e.g. 3000). You can put Nginx in front later and use `PORT=3000` only internally.

---

## 2. Frontend (WAREHOUSE-FRONTEND) – env and deploy

### 2.1 Frontend needs one thing: API base URL

The frontend must call your **live backend URL**, not `http://localhost:3000`.

**If you use Vite:** only env variables that start with `VITE_` are exposed to the browser.

Create `.env` in the **frontend** project root (do not commit if it has secrets; for API URL you can commit `.env.example` and keep real `.env` only on server):

```env
VITE_API_BASE_URL=https://api.your-domain.com
```

Replace with your real backend URL, e.g.:
- `https://api.your-domain.com` if you use a subdomain for API
- `https://your-domain.com/api` if you proxy API under same domain (no trailing slash usually)

**If your frontend uses a different name** (e.g. `REACT_APP_API_URL`), use that name and point it to the same backend URL.

### 2.2 Use the variable in frontend code
In your API service or axios/fetch setup, use:

```javascript
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
// Then use baseURL for all API calls, e.g. axios.create({ baseURL })
```

### 2.3 Build and deploy frontend on server
```bash
cd WAREHOUSE-FRONTEND
npm install
# Set env for production (on server)
echo "VITE_API_BASE_URL=https://api.your-domain.com" > .env
npm run build
```

Upload the **contents of `dist/`** to your web server (Nginx, Apache, or a static host like Vercel/Netlify). The server must serve `index.html` for client-side routes (SPA).

---

## 3. Checklist before going live

| Item | Backend | Frontend |
|------|---------|----------|
| **.env on server** | Yes – DB, JWT_SECRET, PORT, NODE_ENV=production, ALLOWED_ORIGINS | Yes – VITE_API_BASE_URL = live API URL |
| **JWT_SECRET** | Strong random value, not `your-secret-key` | – |
| **ALLOWED_ORIGINS** | Exact frontend URL(s) | – |
| **NODE_ENV** | `production` | – |
| **DB** | Created + user with password | – |
| **Process manager** | PM2 or similar so API restarts on crash | – |
| **HTTPS** | Prefer HTTPS for API in production | Use HTTPS URL in VITE_API_BASE_URL |

---

## 4. Quick summary

1. **Backend:** On server, create `.env` with production values (DB, JWT_SECRET, ALLOWED_ORIGINS, NODE_ENV=production). Install deps, run with PM2.
2. **Frontend:** Add `.env` with `VITE_API_BASE_URL=https://your-backend-url`. Build with `npm run build`, deploy the `dist/` folder.
3. **CORS:** Backend’s `ALLOWED_ORIGINS` must include the frontend’s full URL (e.g. `https://your-site.com`).
4. **Secrets:** Never commit real `.env` files; use server env or your host’s env/config (e.g. Vercel/Netlify env vars for frontend).

After this, your “main server” will run backend and frontend with the correct env and no localhost references in production.
