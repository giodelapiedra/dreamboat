# Dreamboat — Ubuntu VPS Deployment Guide

Complete guide to deploy Dreamboat (server + client) on an Ubuntu VPS with PostgreSQL, Nginx, and PM2.

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

Update the system and install core dependencies.

```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should print v22.x.x
```

### Install pnpm

```bash
npm install -g pnpm@10.17.1
pnpm -v   # should print 10.17.1
```

### Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### Install PM2 (process manager)

```bash
npm install -g pm2
```

---

## 2. Database Setup

Create a PostgreSQL user and database.

```bash
sudo -u postgres psql
```

Run the following SQL inside the `psql` prompt:

```sql
CREATE USER dreamboat WITH PASSWORD 'your_strong_db_password';
CREATE DATABASE dreamboat OWNER dreamboat;
GRANT ALL PRIVILEGES ON DATABASE dreamboat TO dreamboat;
\q
```

> Replace `your_strong_db_password` with a strong password. You will use this in the `DATABASE_URL` later.

---

## 3. Clone the Repository

```bash
cd /var/www
sudo git clone https://github.com/giodelapiedra/dreamboat.git
sudo chown -R $USER:$USER dreamboat
cd dreamboat
```

Install all dependencies:

```bash
pnpm install
```

---

## 4. Environment Configuration

### Generate JWT secrets

Run this twice to generate two separate secrets:

```bash
openssl rand -hex 32
```

Save both outputs — one for `JWT_ACCESS_SECRET`, one for `JWT_REFRESH_SECRET`.

### Server environment file

Create `/var/www/dreamboat/server/.env`:

```bash
nano server/.env
```

Paste the following (replace all placeholder values):

```env
# ── App ──
PORT=3000
NODE_ENV=production

# ── URLs ──
# Set this to your actual domain or VPS IP
CLIENT_URL=https://yourdomain.com

# ── Database ──
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://dreamboat:your_strong_db_password@localhost:5432/dreamboat

# ── JWT Authentication ──
# Paste the two secrets you generated above
JWT_ACCESS_SECRET=paste_first_64_char_secret_here
JWT_REFRESH_SECRET=paste_second_64_char_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── Shopify (optional, leave empty if not using webhooks yet) ──
# SHOPIFY_WEBHOOK_SECRET=
```

### Client environment file

Create `/var/www/dreamboat/client/.env`:

```bash
nano client/.env
```

Paste the following:

```env
VITE_API_URL=https://yourdomain.com/api
VITE_APP_NAME=Dreamboat
VITE_ENABLE_FORM_FALLBACK=false
```

> If you don't have a domain yet, use your VPS IP instead:
> `CLIENT_URL=http://YOUR_VPS_IP` and `VITE_API_URL=http://YOUR_VPS_IP/api`

---

## 5. Build the Project

Run these commands in order from `/var/www/dreamboat`:

```bash
# 1. Generate Prisma client
pnpm db:generate

# 2. Push database schema to PostgreSQL
pnpm db:push

# 3. Seed the database (creates admin account + sample data)
cd server && pnpm db:seed && cd ..

# 4. Build both client and server
pnpm build
```

### Verify the build

```bash
# Server build output should exist
ls server/dist/server.js

# Client build output should exist
ls client/dist/index.html
```

---

## 6. Start the Server with PM2

```bash
# Start the API server
pm2 start server/dist/server.js --name dreamboat-api --cwd /var/www/dreamboat/server

# Verify it is running
pm2 status

# Quick health check
curl http://localhost:3000/api/health
```

Set PM2 to auto-start on reboot:

```bash
pm2 startup
# Follow the printed command (copy-paste and run it)

pm2 save
```

---

## 7. Configure Nginx

### Create the Nginx config

```bash
sudo nano /etc/nginx/sites-available/dreamboat
```

Paste the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # ── Client (static files from Vite build) ──
    root /var/www/dreamboat/client/dist;
    index index.html;

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

    # ── Confirmation links (public, no auth) ──
    location /confirm/ {
        try_files $uri /index.html;
    }

    # ── SPA fallback (all other routes go to index.html) ──
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ── Cache static assets ──
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

> Replace `yourdomain.com` with your actual domain or VPS IP address.

### Enable the config

```bash
sudo ln -s /etc/nginx/sites-available/dreamboat /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t          # test config — should say "ok"
sudo systemctl restart nginx
```

---

## 8. SSL with Let's Encrypt (Recommended)

If you have a domain name pointed to your VPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Certbot will automatically:
- Obtain a free SSL certificate
- Update the Nginx config to use HTTPS
- Set up auto-renewal

Test auto-renewal:

```bash
sudo certbot renew --dry-run
```

---

## 9. Firewall Setup

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 10. Verify Everything

### Check all services

```bash
# PM2 is running
pm2 status

# Nginx is running
sudo systemctl status nginx

# PostgreSQL is running
sudo systemctl status postgresql
```

### Test the endpoints

```bash
# API health check
curl http://localhost:3000/api/health

# Client loads (via Nginx)
curl -I http://yourdomain.com
```

### Login credentials

After seeding, you can log in at `https://yourdomain.com/login` with:

| Field | Value |
|-------|-------|
| Email | `admin@dreamboat.local` |
| Password | `Dreamboat123!` |

---

## Common Operations

### Update to latest code

```bash
cd /var/www/dreamboat
git pull origin main
pnpm install
pnpm db:generate
pnpm db:push
pnpm build
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

```bash
# Check if PM2 process is running
pm2 status

# Check logs for errors
pm2 logs dreamboat-api --lines 50

# Make sure port 3000 is not used by something else
sudo lsof -i :3000
```

### Database connection error

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test the connection manually
psql -U dreamboat -h localhost -d dreamboat
```

### Nginx 502 Bad Gateway

This means Nginx cannot reach the API server.

```bash
# Make sure PM2 is running the server
pm2 status

# Check if the server is actually listening on port 3000
curl http://localhost:3000/api/health

# Check Nginx error logs
sudo tail -20 /var/log/nginx/error.log
```

### Client shows blank page

```bash
# Check if the build output exists
ls /var/www/dreamboat/client/dist/index.html

# Rebuild if needed
cd /var/www/dreamboat && pnpm build

# Check browser console for VITE_API_URL errors
# Make sure client/.env has the correct API URL
```

### Permission issues

```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/dreamboat

# Nginx needs read access to client/dist
sudo chmod -R 755 /var/www/dreamboat/client/dist
```

---

## Architecture Overview

```
Browser
  |
  v
Nginx (:80/:443)
  |
  |-- /api/*  -->  PM2 / Node.js (:3000)  -->  PostgreSQL (:5432)
  |
  |-- /*      -->  client/dist/index.html (static SPA)
```

| Component | Role |
|-----------|------|
| **Nginx** | Reverse proxy, serves static client files, handles SSL |
| **PM2** | Keeps the Node.js API server alive, auto-restarts on crash |
| **Node.js** | Runs the Fastify/Express API server |
| **PostgreSQL** | Stores users, bookings, submissions, forms |
| **Client (Vite)** | Pre-built static files served by Nginx |
