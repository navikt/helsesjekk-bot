FROM gcr.io/distroless/nodejs:16

ENV NODE_ENV production

WORKDIR /app
COPY dist /app/
EXPOSE 5000

CMD ["index.js"]
