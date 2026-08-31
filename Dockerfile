FROM node:20.18.1-alpine3.20 AS builder

WORKDIR /usr/src/app

USER node

COPY --chown=node:node package*.json ./

RUN npm ci --ignore-scripts

COPY --chown=node:node . .

RUN npm run build --if-present

RUN rm -rf node_modules

FROM node:20.18.1-alpine3.20 AS prod-deps

WORKDIR /usr/src/app

USER node

COPY --chown=node:node package*.json ./

RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM node:20.18.1-alpine3.20 AS runner

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /usr/src/app

RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache tini && \
    rm -rf /var/cache/apk/* /tmp/*

COPY --from=builder /usr/src/app ./
COPY --from=prod-deps /usr/src/app/node_modules ./node_modules

USER node

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "."]