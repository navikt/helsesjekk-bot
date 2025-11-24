FROM node:24-alpine AS build

ARG NPM_AUTH_TOKEN

RUN apk add --no-cache bash

WORKDIR /app

COPY package.json /app/
COPY .yarn /app/.yarn
COPY .yarnrc.yml /app/
COPY yarn.lock /app/

ENV NODE_ENV=production

RUN yarn workspaces focus -A --production

FROM node:24-alpine AS runner

RUN apk add --no-cache bash

ENV NODE_ENV=production
ENV YARN_CACHE_FOLDER=/tmp/yarn-cache

WORKDIR /app

COPY --from=build /app/yarn.lock /app/
COPY --from=build /app/.yarnrc.yml /app/
COPY --from=build /app/.yarn /app/.yarn
COPY --from=build /app/package.json /app/
COPY --from=build /app/node_modules /app/node_modules

COPY prisma /app/prisma
COPY prisma.config.ts /app/
COPY next-logger.config.js /app/
COPY next.config.mjs /app/
COPY public /app/public/
COPY .next /app/.next

ENV NODE_ENV=production

EXPOSE 3000

CMD ["yarn", "start:migrate"]
