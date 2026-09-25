# cesarbritez.com.ar — sitio web

Sitio institucional + **catálogo online** de productos (sin precios; cada producto se consulta
por WhatsApp).

```
navegador → nginx (cesarbritez-web)
              ├─ /                     estático (public/)
              ├─ /uploads/productos/*  imágenes del CRM de aberturas, volumen montado :ro
              └─ /api/*                → cesarbritez-api (Node + Hono + pg)
```

- `public/catalogo.html` — grilla con búsqueda y filtros por tipo/material.
- `public/producto.html?id=<uuid>` — ficha estilo marketplace: galería, variantes de color,
  caja de consulta por WhatsApp, ficha técnica y relacionados.
- La portada muestra hasta 4 "destacados" (productos con etiqueta Más vendido / Recomendado /
  Nuevo) si la API responde; si no, el bloque queda oculto y el resto del sitio anda igual.
- **Número de WhatsApp**: único lugar, `public/js/config.js` (`WA_NUMBER`).

## De dónde salen los productos

La API lee **solo** la vista `catalogo_web` de la base de aberturas, con el rol `web_catalogo`
(sin permisos sobre ninguna tabla). Aparece en el catálogo todo producto marcado
"Publicar en catálogo online" en el CRM, activo y con imagen. Publicar / despublicar se ve
en el sitio al instante (hay 60 s de cache en el navegador). Contrato completo de la vista:
`aberturas/docs/catalogo-web.md`.

Endpoints: `GET /api/catalogo` (`?tipo=&material=&q=&destacados=1&excluir=<id>&limite=`),
`GET /api/catalogo/filtros`, `GET /api/catalogo/:id`, `GET /api/health`.

## Local

```bash
# una vez: habilitar el rol en la DB local de aberturas y poner la password en .env
docker exec aberturas-db psql -U postgres -c "ALTER ROLE web_catalogo LOGIN PASSWORD '<pass>'"
cp .env.example .env   # PROXY_NETWORK/DB_NETWORK=aberturas_default, WEB_CATALOGO_DB_PASS=<pass>
docker compose up -d --build     # http://localhost:8080
```

API nativa con recarga: `cd api && npm run dev` (lee `api/.env` con `DATABASE_URL` a
`127.0.0.1:5434` y `PORT=3002`).

## Prod (179.43.120.103, `/opt/docker/cesarbritez`) — pasos manuales, una sola vez

El compose real vive en el host, fuera del repo (plantilla: `vps/docker-compose.yml`).

1. Backup de la base, como siempre antes de tocar prod.
2. Habilitar el rol con un secreto nuevo:
   `docker exec aberturas-db psql -U postgres -c "ALTER ROLE web_catalogo LOGIN PASSWORD '<secreto>'"`
3. En `/opt/docker/cesarbritez/.env`: `WEB_CATALOGO_DB_PASS=<secreto>`.
4. En `/opt/docker/cesarbritez/docker-compose.yml`: agregar al servicio `web` el volumen
   `/var/lib/docker-data/aberturas/uploads/productos:/usr/share/nginx/html/uploads/productos:ro`
   y el servicio `web-api` (copiar de `vps/docker-compose.yml`).
5. `git -C web pull && docker compose up -d --build web web-api`
6. Verificar: `curl -s https://cesarbritez.com.ar/api/health` → `{"ok":true}`.

Deploys siguientes: `git -C web pull && docker compose up -d --build web web-api`.
