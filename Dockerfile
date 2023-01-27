FROM node:18-alpine as build

RUN apk add --no-cache bash

WORKDIR /app

COPY package.json /app/
COPY .yarn /app/.yarn
COPY .yarnrc.yml /app/
COPY yarn.lock /app/
COPY prisma /app/prisma

RUN yarn workspaces focus -A --production
RUN yarn prisma:generate

FROM node:18-alpine as runner

ENV NODE_ENV production

WORKDIR /app

COPY --from=build /app/package.json /app/
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/prisma /app/prisma
COPY dist /app/

EXPOSE 5000

CMD ["yarn", "start:migrate"]
