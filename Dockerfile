FROM nginx:1.27-alpine

# Config nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Assets del sitio
COPY public/ /usr/share/nginx/html/

EXPOSE 80
