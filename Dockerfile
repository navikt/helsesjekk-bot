FROM gcr.io/distroless/nodejs:16

WORKDIR /app
COPY dist /app/
EXPOSE 5000

CMD ["index.js"]
