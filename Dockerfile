FROM gcr.io/distroless/nodejs24-debian13@sha256:51eee69b25037942014428da85f5b436a4d88f283e545981d03f25b7db72469a

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
