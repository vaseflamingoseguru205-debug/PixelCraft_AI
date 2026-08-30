FROM node:20.18.1-alpine3.20 AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY . .

FROM node:20.18.1-alpine3.20 AS prod-deps

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM node:20.18.1-alpine3.20 AS runner

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /usr/src/app

RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache tini=~0.19 && \
    rm -rf /var/cache/apk/* /tmp/*

COPY --chown=node:node --from=builder /usr/src/app ./
COPY --chown=node:node --from=prod-deps /usr/src/app/node_modules ./node_modules

USER node

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "."]