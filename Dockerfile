FROM node:24-alpine

WORKDIR /app

COPY package.json package.json
COPY server.js server.js
COPY index.html index.html
COPY styles.css styles.css
COPY app.js app.js
COPY src src
COPY mcp mcp
COPY observability observability
COPY *.md ./
COPY LICENSE LICENSE

EXPOSE 8080

ENV PORT=8080

CMD ["npm", "start"]
