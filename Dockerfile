FROM node:24.12.0-alpine AS builder
ARG VITE_API_URL
ARG VITE_APPLICATION_YEAR=2027
ENV VITE_API_URL=$VITE_API_URL VITE_APPLICATION_YEAR=$VITE_APPLICATION_YEAR
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src
COPY scripts ./scripts
COPY nginx.conf ./nginx.conf
RUN node scripts/configure-nginx.mjs /tmp/default.conf && npm run build

FROM nginxinc/nginx-unprivileged:1.28.2-alpine
COPY --from=builder /tmp/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/index.html || exit 1
