# Use a base image with Node.js installed
FROM node:23.11.1-alpine3.22

ENV PORT=5000
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb?schema=my_db"
ENV JWTSECRET="SECRET"
ENV WEB_URI="http://localhost:3000"
ENV API_URI="http://localhost:5111"
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install Chromium and required dependencies for Puppeteer
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

# PRISMA
# ENV DATABASE_URL="mysql://root:my-secret-pw@db-ecourse-rehab-hati:3306/ecourse"

# Set the working directory inside the container
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# Copy package manifests to the container
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Verify Chromium installation
RUN node verify-chromium.js

# EXPOSE ${PORT}

# Command to run your application

CMD pnpm exec prisma generate && pnpm run migrate:deploy && pnpm run start
