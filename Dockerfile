FROM nginx:alpine

# Copy custom config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static files
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/