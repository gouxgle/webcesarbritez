#!/bin/bash
# Ejecutar en la VPS como root o con sudo
# bash setup-vps.sh

set -e

echo "=== 1. Directorios ==="
mkdir -p /opt/docker/cesarbritez
mkdir -p /var/lib/docker-data/aberturas/db
mkdir -p /var/lib/docker-data/aberturas/uploads

echo "=== 2. Clonar repos ==="
cd /opt/docker/cesarbritez

# Aberturas CRM
if [ ! -d "aberturas/.git" ]; then
    git clone git@github.com:gouxgle/averturas.git aberturas
else
    echo "aberturas ya existe, haciendo pull..."
    git -C aberturas pull origin main
fi

# Sitio web
if [ ! -d "web/.git" ]; then
    git clone git@github.com:gouxgle/webcesarbritez.git web
else
    echo "web ya existe, haciendo pull..."
    git -C web pull origin main
fi

echo "=== 3. Archivos de configuración ==="
# Copiar docker-compose y .env.example si no existen
[ ! -f docker-compose.yml ] && echo "ERROR: copiar docker-compose.yml manualmente" && exit 1
[ ! -f .env ] && cp .env.example .env && echo ">>> EDITAR .env antes de continuar <<<"

echo "=== 4. Nginx ==="
cp nginx/*.conf /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/cesarbritez.com.ar.conf        /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/aberturas.cesarbritez.com.ar.conf /etc/nginx/sites-enabled/
nginx -t

echo "=== 5. SSL con Certbot ==="
echo "Ejecutar manualmente cuando DNS esté propagado:"
echo "  certbot --nginx -d cesarbritez.com.ar -d www.cesarbritez.com.ar"
echo "  certbot --nginx -d aberturas.cesarbritez.com.ar"

echo "=== 6. Levantar servicios ==="
echo "Ejecutar cuando .env esté completo:"
echo "  cd /opt/docker/cesarbritez && docker compose up -d --build"

echo "=== LISTO ==="
