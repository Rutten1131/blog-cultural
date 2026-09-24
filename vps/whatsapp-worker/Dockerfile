FROM node:20-alpine

WORKDIR /app

# Instalar dependencias del sistema para puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    dumb-init

# Crear usuario no root
RUN addgroup -g 1001 -S appuser && \
    adduser -S nextjs -u 1001 -G appuser

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev \
    @prisma/adapter-mariadb@^7.9.1 \
    mariadb@^3.5.3 \
    prisma@^7.9.1

COPY . .

RUN npx prisma generate

RUN chown -R nextjs:appuser /app
USER nextjs

EXPOSE 8083

CMD ["node", "worker.js"]