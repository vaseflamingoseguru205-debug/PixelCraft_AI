FROM node:20.18.1-alpine3.20 AS builder

RUN apk update && apk upgrade --no-cache

WORKDIR /usr/src/app

RUN chown node:node /usr/src/app

USER node

COPY --chown=node:node package*.json ./

RUN npm ci --ignore-scripts

COPY --chown=node:node . .

RUN npm run build --if-present && rm -rf node_modules

FROM node:20.18.1-alpine3.20 AS prod-deps

RUN apk update && apk upgrade --no-cache

WORKDIR /usr/src/app

RUN chown node:node /usr/src/app

USER node

COPY --chown=node:node package*.json ./

RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM node:20.18.1-alpine3.20 AS runner

ENV NODE_ENV=production
ENV PORT=3000

RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache tini

WORKDIR /usr/src/app

RUN chown node:node /usr/src/app

COPY --chown=node:node --from=builder /usr/src/app ./
COPY --chown=node:node --from=prod-deps /usr/src/app/node_modules ./node_modules

USER node

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "."]