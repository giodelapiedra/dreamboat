# Dreamboat — Ubuntu VPS Deployment Guide (Backend Only)

Complete guide to deploy the Dreamboat API server and PostgreSQL on an Ubuntu VPS with Nginx and PM2.

> This guide covers **backend only** (server + database). The client/frontend is deployed separately.

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Ubuntu | 22.04 / 24.04 LTS |
| Node.js | 22+ |
| pnpm | 10.17.1 |
| PostgreSQL | 15+ |
| Nginx | latest |
| Domain name | optional (can use IP) |

---

## 1. System Setup

**Step 1.1** — Update the system:

```bash
sudo apt update && sudo apt upgrade -y
```

> If you see a "Newer kernel available" message, reboot first: `sudo reboot`, then reconnect via SSH and continue.

**Step 1.2** — Install Node.js 22:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

**Step 1.3** — Verify Node.js:

```bash
node -v   # should print v22.x.x
```

**Step 1.4** — Install pnpm:

```bash
npm install -g pnpm@10.17.1
```

**Step 1.5** — Verify pnpm:

```bash
pnpm -v   # should print 10.17.1
```

**Step 1.6** — Install PostgreSQL:

```bash
sudo apt install -y postgresql postgresql-contrib
```

**Step 1.7** — Enable and start PostgreSQL:

```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

**Step 1.8** — Install Nginx:

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

**Step 1.9** — Install PM2 (process manager):

```bash
npm install -g pm2
```

---

## 2. Database Setup

**Step 2.1** — Open the PostgreSQL prompt:

```bash
cd /tmp && sudo -u postgres psql
```

> We `cd /tmp` first to avoid a "could not change directory" warning.

**Step 2.2** — Create the database user (run inside the `postgres=#` prompt):

```sql
CREATE USER dreamboat WITH PASSWORD 'your_strong_db_password';
```

> Replace `your_strong_db_password` with a strong password. You will use this in the `DATABASE_URL` later.

**Step 2.3** — Create the database:

```sql
CREATE DATABASE dreamboat OWNER dreamboat;
```

**Step 2.4** — Grant privileges:

```sql
GRANT ALL PRIVILEGES ON DATABASE dreamboat TO dreamboat;
```

**Step 2.5** — Exit the prompt:

```sql
\q
```

---

## 3. Upload the Project

**Step 3.1** — Navigate to the web directory:

```bash
cd /var/www
```

**Step 3.2** — Create the project directory:

```bash
sudo mkdir -p dreamboat
sudo chown -R $USER:$USER dreamboat
```

**Step 3.3** — Upload the following files/folders from your local machine to `/var/www/dreamboat/` on the VPS using SCP, SFTP, or your preferred method:

```
dreamboat/
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── server/          (entire folder)
└── shared/          (entire folder)
```

> The `shared/` folder is required because the server depends on `@dreamboat/shared`.
> Do NOT upload `node_modules/` — we will install dependencies on the VPS.

**Example using SCP** (run from your local machine):

```bash
scp -r package.json pnpm-lock.yaml pnpm-workspace.yaml server/ shared/ root@YOUR_VPS_IP:/var/www/dreamboat/
```

**Step 3.4** — Enter the project directory on the VPS:

```bash
cd /var/www/dreamboat
```

**Step 3.5** — Install dependencies:

```bash
pnpm install
```

---

## 4. Environment Configuration

**Step 4.1** — Generate JWT secrets. Run this command **twice** to get two separate secrets:

```bash
openssl rand -hex 32
```

Save both outputs — one for `JWT_ACCESS_SECRET`, one for `JWT_REFRESH_SECRET`.

**Step 4.2** — Create the server environment file:

```bash
nano server/.env
```

**Step 4.3** — Paste the following into `server/.env` (replace all placeholder values):

```env
# ── App ──
PORT=3000
NODE_ENV=production

# ── URLs ──
# Set this to the URL where your frontend is hosted, or your VPS IP
CLIENT_URL=https://yourdomain.com

# ── Database ──
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://dreamboat:your_strong_db_password@localhost:5432/dreamboat

# ── JWT Authentication ──
# Paste the two secrets you generated in Step 4.1
JWT_ACCESS_SECRET=paste_first_64_char_secret_here
JWT_REFRESH_SECRET=paste_second_64_char_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── Shopify (optional, leave empty if not using webhooks yet) ──
# SHOPIFY_WEBHOOK_SECRET=
```

---

## 5. Build the Project

Run all commands from `/var/www/dreamboat`.

**Step 5.1** — Generate the Prisma client:

```bash
pnpm db:generate
```

**Step 5.2** — Push the database schema to PostgreSQL:

```bash
pnpm db:push
```

**Step 5.3** — Seed the database (creates admin account + sample data):

```bash
cd server && pnpm db:seed && cd ..
```

**Step 5.4** — Build shared and server packages:

```bash
pnpm --filter shared build && pnpm --filter server build
```

**Step 5.5** — Verify the build output exists:

```bash
ls server/dist/server.js
```

If the file is missing, re-run the build command in Step 5.4.

---

## 6. Start the Server with PM2

**Step 6.1** — Start the API server:

```bash
pm2 start dist/server.js --name dreamboat-api --cwd /var/www/dreamboat/server
```

**Step 6.2** — Verify it is running:

```bash
pm2 status
```

You should see `dreamboat-api` with status `online`.

**Step 6.3** — Quick health check:

```bash
curl http://localhost:3000/api/health
```

You should get a JSON response back.

**Step 6.4** — Set PM2 to auto-start on reboot:

```bash
pm2 startup
```

**Step 6.5** — Copy and run the command that `pm2 startup` printed (it looks like `sudo env PATH=... pm2 startup ...`).

**Step 6.6** — Save the current PM2 process list:

```bash
pm2 save
```

---

## 7. Configure Nginx

**Step 7.1** — Create the Nginx config file:

```bash
sudo nano /etc/nginx/sites-available/dreamboat
```

**Step 7.2** — Paste the following configuration (replace `yourdomain.com` with your actual domain or VPS IP):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # ── API reverse proxy ──
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # ── Default response for non-API routes ──
    location / {
        return 404;
    }
}
```

**Step 7.3** — Save and close the file (`Ctrl+O`, `Enter`, `Ctrl+X` in nano).

**Step 7.4** — Enable the config by creating a symlink:

```bash
sudo ln -s /etc/nginx/sites-available/dreamboat /etc/nginx/sites-enabled/
```

**Step 7.5** — Remove the default Nginx site:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

**Step 7.6** — Test the Nginx config:

```bash
sudo nginx -t
```

You should see `syntax is ok` and `test is successful`.

**Step 7.7** — Restart Nginx:

```bash
sudo systemctl restart nginx
```

---

## 8. SSL with Let's Encrypt (Recommended)

> Skip this section if you don't have a domain name yet.

**Step 8.1** — Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

**Step 8.2** — Obtain an SSL certificate (replace `yourdomain.com`):

```bash
sudo certbot --nginx -d yourdomain.com
```

Certbot will automatically:
- Obtain a free SSL certificate
- Update the Nginx config to use HTTPS
- Set up auto-renewal

**Step 8.3** — Test auto-renewal:

```bash
sudo certbot renew --dry-run
```

---

## 9. Firewall Setup

**Step 9.1** — Allow SSH connections (so you don't lock yourself out):

```bash
sudo ufw allow OpenSSH
```

**Step 9.2** — Allow Nginx traffic (HTTP + HTTPS):

```bash
sudo ufw allow 'Nginx Full'
```

**Step 9.3** — Enable the firewall:

```bash
sudo ufw enable
```

**Step 9.4** — Verify the rules:

```bash
sudo ufw status
```

You should see OpenSSH and Nginx Full listed as ALLOW.

---

## 10. Verify Everything

**Step 10.1** — Check PM2 is running:

```bash
pm2 status
```

`dreamboat-api` should show status `online`.

**Step 10.2** — Check Nginx is running:

```bash
sudo systemctl status nginx
```

Should show `active (running)`.

**Step 10.3** — Check PostgreSQL is running:

```bash
sudo systemctl status postgresql
```

Should show `active (running)`.

**Step 10.4** — Test the API health endpoint directly:

```bash
curl http://localhost:3000/api/health
```

**Step 10.5** — Test the API through Nginx:

```bash
curl http://yourdomain.com/api/health
```

Both should return a JSON response.

---

## Common Operations

### Update the server code

Upload the updated `server/` and `shared/` folders to the VPS, then:

```bash
cd /var/www/dreamboat
pnpm install
pnpm db:generate
pnpm db:push
pnpm --filter shared build && pnpm --filter server build
pm2 restart dreamboat-api
```

### View server logs

```bash
# Live logs
pm2 logs dreamboat-api

# Last 100 lines
pm2 logs dreamboat-api --lines 100
```

### Restart services

```bash
pm2 restart dreamboat-api     # restart API
sudo systemctl restart nginx   # restart Nginx
sudo systemctl restart postgresql  # restart DB
```

### Re-seed the database

```bash
cd /var/www/dreamboat/server
pnpm db:seed
```

### Check disk usage

```bash
du -sh /var/www/dreamboat
df -h
```

---

## Troubleshooting

### API not responding

**1.** Check if PM2 process is running:

```bash
pm2 status
```

**2.** Check logs for errors:

```bash
pm2 logs dreamboat-api --lines 50
```

**3.** Make sure port 3000 is not used by something else:

```bash
sudo lsof -i :3000
```

### Database connection error

**1.** Check if PostgreSQL is running:

```bash
sudo systemctl status postgresql
```

**2.** Test the connection manually:

```bash
psql -U dreamboat -h localhost -d dreamboat
```

### Nginx 502 Bad Gateway

This means Nginx cannot reach the API server.

**1.** Make sure PM2 is running the server:

```bash
pm2 status
```

**2.** Check if the server is actually listening on port 3000:

```bash
curl http://localhost:3000/api/health
```

**3.** Check Nginx error logs:

```bash
sudo tail -20 /var/log/nginx/error.log
```

### Permission issues

**1.** Fix ownership:

```bash
sudo chown -R $USER:$USER /var/www/dreamboat
```

---

## Architecture Overview

```
Client (hosted separately)
  |
  v
Nginx (:80/:443)
  |
  |-- /api/*  -->  PM2 / Node.js (:3000)  -->  PostgreSQL (:5432)
```

| Component | Role |
|-----------|------|
| **Nginx** | Reverse proxy for the API, handles SSL |
| **PM2** | Keeps the Node.js API server alive, auto-restarts on crash |
| **Node.js** | Runs the Express API server |
| **PostgreSQL** | Stores users, bookings, submissions, forms |
