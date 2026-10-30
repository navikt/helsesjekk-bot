FROM gcr.io/distroless/nodejs24-debian13@sha256:bd9e0df8099c872d37e590e4fc8c815e02e6a3048bf012081f5cee160cf893d6

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
