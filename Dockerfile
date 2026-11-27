FROM gcr.io/distroless/nodejs24-debian13@sha256:235cae47d37e0ba4ab70a723ed0bfd4f619c04d16d4226371d5d0c71a52f9211

WORKDIR /app

# Next.js app
COPY next-logger.config.cjs /app/
COPY .next/standalone /app/
COPY public /app/public/

# Drizzle migrations
COPY drizzle /app/drizzle

ENV NODE_ENV=production

EXPOSE 3000

CMD ["server.js"]
