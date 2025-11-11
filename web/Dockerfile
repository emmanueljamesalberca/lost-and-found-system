FROM nginx:alpine
# Nginx config
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
# Static assets (from repo root)
COPY index.html /usr/share/nginx/html/index.html
COPY style.css /usr/share/nginx/html/style.css
COPY script.js /usr/share/nginx/html/script.js
