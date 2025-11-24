FROM node:24-alpine

RUN apk add --no-cache bash openssl

ENV NODE_ENV=production

WORKDIR /app

COPY .next/standalone /app
COPY yarn.lock /app
COPY .yarnrc.yml /app/
COPY .yarn /app/.yarn
COPY prisma /app/prisma
COPY prisma.config.ts /app/
COPY next-logger.config.js /app/
COPY public /app/public/
COPY run.sh /app/

EXPOSE 3000

CMD ["/app/run.sh"]
