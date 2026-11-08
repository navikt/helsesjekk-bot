FROM gcr.io/distroless/nodejs24-debian13@sha256:03980f6fd2a3245fa06e371c36fd33528ebbc676a1d0f84e3e21d95cd291b807

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
