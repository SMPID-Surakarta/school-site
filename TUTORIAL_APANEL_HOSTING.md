# Tutorial Hosting Project SvelteKit CMS di aPanel

Panduan lengkap untuk men-deploy Website Sekolah CMS (SvelteKit) ke server dengan aPanel.

## ✅ Persyaratan

Sebelum memulai, pastikan Anda memiliki:

- **Server dengan aPanel** (minimal 2GB RAM, 20GB disk)
- **Akses SSH ke server**
- **Domain atau subdomain** yang sudah pointing ke server
- **File project** dari repository (atau repository URL)
- **Database PostgreSQL** (bisa di server yang sama atau terpisah)

---

## 📋 Daftar Langkah

1. [Setup aPanel dan Environment](#1-setup-apanel-dan-environment)
2. [Instalasi Node.js & Bun](#2-instalasi-nodejs--bun)
3. [Setup PostgreSQL](#3-setup-postgresql)
4. [Clone dan Setup Project](#4-clone-dan-setup-project)
5. [Konfigurasi Environment Variables](#5-konfigurasi-environment-variables)
6. [Build dan Testing](#6-build-dan-testing)
7. [Setup dengan PM2 atau Supervisor](#7-setup-dengan-pm2-atau-supervisor)
8. [Konfigurasi Nginx Reverse Proxy](#8-konfigurasi-nginx-reverse-proxy)
9. [SSL Certificate dengan Let's Encrypt](#9-ssl-certificate-dengan-lets-encrypt)
10. [Monitoring dan Maintenance](#10-monitoring-dan-maintenance)

---

## 1. Setup aPanel dan Environment

### 1.1 Akses SSH ke Server

```bash
ssh root@your.server.ip
```

### 1.2 Update System

```bash
apt update && apt upgrade -y
apt install -y curl wget git build-essential
```

### 1.3 Buat User Non-root (Opsional tapi Recommended)

```bash
useradd -m -s /bin/bash websmk
usermod -aG sudo websmk
su - websmk
```

---

## 2. Instalasi Node.js & Bun

### 2.1 Instalasi Node.js (versi LTS)

```bash
# Install Node.js v20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # verifikasi
npm --version
```

### 2.2 Instalasi Bun (Package Manager Project)

Project ini menggunakan **Bun** sebagai package manager. Install dengan:

```bash
curl -fsSL https://bun.sh/install | bash
# Refresh shell
source ~/.bashrc
bun --version  # verifikasi
```

Atau install via npm:
```bash
npm install -g bun
```

---

## 3. Setup PostgreSQL

### 3.1 Instalasi PostgreSQL (jika belum ada)

```bash
sudo apt install -y postgresql postgresql-contrib
sudo service postgresql start
sudo systemctl enable postgresql  # auto-start
```

### 3.2 Buat Database dan User

```bash
# Akses psql console
sudo -u postgres psql

# Dalam psql:
CREATE USER websmk_user WITH PASSWORD 'secure_password_123';
CREATE DATABASE websmk_db OWNER websmk_user;
ALTER ROLE websmk_user WITH CREATEDB;
\q  # exit
```

### 3.3 Verifikasi Koneksi

```bash
psql -U websmk_user -d websmk_db -h localhost
# Seharusnya bisa masuk, ketik \q untuk exit
```

**Simpan credentials ini** — dibutuhkan untuk environment variables nanti.

---

## 4. Clone dan Setup Project

### 4.1 Clone Repository

```bash
cd /home/websmk  # atau folder pilihan Anda
git clone https://github.com/your-username/websmk.git
cd websmk
```

Atau jika sudah ada `.git`:
```bash
git pull origin main
```

### 4.2 Install Dependencies

```bash
bun install
# Atau gunakan npm:
# npm install
# Atau pnpm:
# pnpm install
```

---

## 5. Konfigurasi Environment Variables

### 5.1 Buat File .env.production

```bash
cp .env.example .env.production
nano .env.production
```

### 5.2 Isi Environment Variables

Minimal configuration yang diperlukan:

```env
# Database
DATABASE_URL="postgresql://websmk_user:secure_password_123@localhost:5432/websmk_db"

# Authentication (Auth.js)
AUTH_SECRET="your-random-secret-key-min-32-chars"  # Generate dengan: openssl rand -base64 32
AUTH_TRUST_HOST="your-domain.com"
AUTH_URL="https://your-domain.com"

# Storage (Local disk)
UPLOAD_DIR="/home/websmk/websmk/uploads"

# Email (optional, untuk notifikasi)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@your-domain.com"

# Mode production
NODE_ENV="production"
```

**⚠️ PENTING:**
- Jangan share `AUTH_SECRET` atau `DATABASE_URL` di repository
- Gunakan password yang strong
- Generate AUTH_SECRET dengan: `openssl rand -base64 32`

### 5.3 Verifikasi File .env

```bash
cat .env.production
# Pastikan DATABASE_URL dan AUTH_SECRET sudah benar
chmod 600 .env.production  # restrict permissions
```

---

## 6. Build dan Testing

### 6.1 Run Database Migration

```bash
bun run db:push
# Atau jika menggunakan npm:
# npm run db:push
```

Perintah ini akan:
- Membaca schema Drizzle dari `src/lib/db/schema/`
- Membuat tabel di PostgreSQL
- Seed data awal (jika ada script seed)

### 6.2 Build Project

```bash
NODE_ENV=production bun run build
# Atau:
# npm run build
# pnpm build
```

Build akan menghasilkan folder `build/` dengan aplikasi siap production.

### 6.3 Testing (Optional)

```bash
bun run test:unit --run
# Atau test e2e:
# bun run test:e2e
```

---

## 7. Setup dengan PM2 atau Supervisor

### Option A: PM2 (Recommended)

#### 7.1 Install PM2

```bash
sudo npm install -g pm2
pm2 startup  # untuk auto-start saat reboot
```

#### 7.2 Buat PM2 Ecosystem File

```bash
cat > /home/websmk/websmk/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'websmk-cms',
      script: './build/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      watch: false,
      ignore_watch: ['node_modules', 'uploads', '.next', 'logs'],
      max_memory_restart: '1G',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF
```

#### 7.3 Start dengan PM2

```bash
cd /home/websmk/websmk
pm2 start ecosystem.config.js --env production
pm2 save           # simpan konfigurasi
pm2 startup        # auto-start saat reboot
pm2 status         # lihat status
pm2 logs           # lihat logs
```

#### 7.4 Monitoring PM2

```bash
pm2 monit        # real-time monitoring
pm2 restart all  # restart aplikasi
pm2 stop all     # stop aplikasi
```

---

### Option B: Supervisor (Alternative)

#### 7.1 Install Supervisor

```bash
sudo apt install -y supervisor
```

#### 7.2 Buat Supervisor Config

```bash
sudo nano /etc/supervisor/conf.d/websmk.conf
```

Isi dengan:

```ini
[program:websmk-cms]
directory=/home/websmk/websmk
command=/home/websmk/.bun/bin/bun run --env-file .env.production /home/websmk/websmk/build/index.js
user=websmk
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/home/websmk/websmk/logs/supervisor.log
environment=NODE_ENV="production",PORT="3000"
```

#### 7.3 Reload Supervisor

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start websmk-cms
sudo supervisorctl status
```

---

## 8. Konfigurasi Nginx Reverse Proxy

### 8.1 Buat Nginx Config

```bash
sudo nano /etc/nginx/sites-available/websmk
```

Isi dengan:

```nginx
upstream websmk_app {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 50M;

    # Redirect HTTP ke HTTPS (setup ini setelah SSL ready)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://websmk_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Static files dengan caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://websmk_app;
    }

    # Uploads folder (local storage)
    location /uploads/ {
        alias /home/websmk/websmk/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

### 8.2 Enable Nginx Config

```bash
sudo ln -s /etc/nginx/sites-available/websmk /etc/nginx/sites-enabled/
sudo nginx -t  # test konfigurasi
sudo systemctl restart nginx
```

### 8.3 Verifikasi

```bash
curl -I http://localhost/
# Seharusnya return status code dari aplikasi
```

---

## 9. SSL Certificate dengan Let's Encrypt

### 9.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 9.2 Generate Certificate

```bash
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

### 9.3 Update Nginx Config untuk HTTPS

Edit `/etc/nginx/sites-available/websmk`:

```nginx
upstream websmk_app {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    keepalive 64;
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    client_max_body_size 50M;

    location / {
        proxy_pass http://websmk_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://websmk_app;
    }

    location /uploads/ {
        alias /home/websmk/websmk/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

### 9.4 Restart Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 9.5 Setup Auto-renewal

```bash
sudo certbot renew --dry-run  # test
# Certbot biasanya auto-setup renewal timer
sudo systemctl status certbot.timer
```

---

## 10. Monitoring dan Maintenance

### 10.1 Monitoring Aplikasi

#### Dengan PM2:
```bash
pm2 monit               # real-time dashboard
pm2 logs                # lihat logs real-time
pm2 logs websmk-cms     # logs spesifik app
pm2 status              # status apps
```

#### Dengan Supervisor:
```bash
sudo supervisorctl tail websmk-cms      # lihat logs
sudo supervisorctl status               # status
```

### 10.2 Monitoring Server

```bash
# CPU, Memory, Disk
top
df -h
free -h

# Network
netstat -tuln | grep 3000
```

### 10.3 Update Project (New Deployment)

```bash
cd /home/websmk/websmk

# Pull latest code
git pull origin main

# Install dependencies
bun install

# Run migrations (jika ada perubahan schema)
NODE_ENV=production bun run db:push

# Build
NODE_ENV=production bun run build

# Restart aplikasi
pm2 restart websmk-cms
# Atau:
# sudo supervisorctl restart websmk-cms
```

### 10.4 Backup Database

```bash
# Backup manual
pg_dump -U websmk_user -d websmk_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore dari backup
psql -U websmk_user -d websmk_db < backup_20240908_120000.sql
```

### 10.5 Cek Disk Usage (Uploads)

```bash
du -sh /home/websmk/websmk/uploads/
# Cleanup old files jika diperlukan
find /home/websmk/websmk/uploads -type f -mtime +90 -delete
```

---

## 🔧 Troubleshooting

### Issue: "Connection refused" ke database

```bash
# Pastikan PostgreSQL running
sudo systemctl status postgresql

# Check PostgreSQL listening
sudo -u postgres psql -c "SELECT 1;"

# Verifikasi DATABASE_URL
grep DATABASE_URL /home/websmk/websmk/.env.production
```

### Issue: Port 3000 sudah terpakai

```bash
# Cek proses yang menggunakan port
lsof -i :3000

# Atau gunakan port lain di ecosystem.config.js
# Dan update Nginx upstream
```

### Issue: 502 Bad Gateway

```bash
# Cek Nginx error log
sudo tail -f /var/log/nginx/error.log

# Cek aplikasi status
pm2 logs websmk-cms

# Restart aplikasi
pm2 restart websmk-cms
```

### Issue: SSL certificate error

```bash
# Renew certificate manual
sudo certbot renew --force-renewal

# Check certificate validity
sudo certbot certificates
```

### Issue: Upload files tidak bisa disimpan

```bash
# Check permissions
ls -la /home/websmk/websmk/uploads/

# Fix permissions jika diperlukan
sudo chown -R websmk:websmk /home/websmk/websmk/uploads
chmod -R 755 /home/websmk/websmk/uploads
```

---

## 📊 Performance Optimization

### 10.1 Enable Compression di Nginx

Tambahkan di `http` block dalam `/etc/nginx/nginx.conf`:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript 
            application/json application/javascript application/xml+rss 
            application/rss+xml font/truetype font/opentype 
            application/vnd.ms-fontobject image/svg+xml;
```

### 10.2 Database Connection Pool

Edit `.env.production`:

```env
DATABASE_URL="postgresql://websmk_user:password@localhost:5432/websmk_db?sslmode=disable&connection_limit=5"
```

### 10.3 Enable PM2 Cluster Mode

Sudah dikonfigurasi di `ecosystem.config.js` dengan `exec_mode: 'cluster'`

---

## ✅ Checklist Deployment

- [ ] Server setup dengan Node.js dan Bun
- [ ] PostgreSQL database dan user sudah dibuat
- [ ] Project di-clone dan dependencies ter-install
- [ ] `.env.production` sudah dikonfigurasi
- [ ] Database migration sudah di-run (`db:push`)
- [ ] Project berhasil di-build
- [ ] PM2/Supervisor sudah start aplikasi
- [ ] Nginx reverse proxy sudah dikonfigurasi
- [ ] SSL certificate dari Let's Encrypt sudah aktif
- [ ] Domain bisa diakses via HTTPS
- [ ] Admin account sudah dibuat (login pertama kali)
- [ ] Upload files bisa disimpan
- [ ] Monitoring setup done

---

## 📞 Additional Resources

- **SvelteKit Docs**: https://kit.svelte.dev/docs/introduction
- **Drizzle ORM**: https://orm.drizzle.team/
- **Auth.js**: https://authjs.dev/
- **Nginx Docs**: https://nginx.org/en/docs/
- **PM2 Docs**: https://pm2.keymetrics.io/docs/usage/

---

## 💡 Tips & Best Practices

1. **Selalu gunakan SSH key** alih-alih password untuk server access
2. **Enable firewall** dan restrict port yang tidak diperlukan
3. **Backup database secara berkala** (daily atau weekly)
4. **Monitor aplikasi logs** untuk error yang tidak tertangani
5. **Update dependencies secara berkala** untuk security patches
6. **Use CDN** untuk static files (gambar, CSS, JS)
7. **Enable rate limiting** di Nginx untuk prevent abuse
8. **Setup email notifications** untuk admin alerts

---

**Last Updated**: 2024-09-08  
**Author**: GitHub Copilot  
**Version**: 1.0
