FROM node:23.11.1-alpine3.22

# Non-sensitive defaults only — secrets MUST come from env_file / orchestrator.
ENV PORT=5000
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Chromium + dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    ttf-dejavu \
    ttf-droid \
    ttf-liberation \
    font-noto \
    font-noto-cjk \
    font-noto-emoji \
    udev \
    xvfb \
    xvfb-run

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN node verify-chromium.js

# Generate Prisma client and build at image build time (cached across deploys).
RUN pnpm exec prisma generate && pnpm run build

CMD pnpm run migrate:deploy && node dist/main
