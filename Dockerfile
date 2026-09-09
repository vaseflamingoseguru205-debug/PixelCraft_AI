FROM node:20.18.1-alpine3.20 AS builder

RUN apk update && apk upgrade --no-cache

WORKDIR /usr/src/app

RUN chown 1000:1000 /usr/src/app

USER 1000:1000

COPY --chown=1000:1000 package*.json ./

RUN npm ci --ignore-scripts

COPY --chown=1000:1000 . .

RUN npm run build --if-present && rm -rf node_modules

FROM node:20.18.1-alpine3.20 AS prod-deps

RUN apk update && apk upgrade --no-cache

WORKDIR /usr/src/app

RUN chown 1000:1000 /usr/src/app

USER 1000:1000

COPY --chown=1000:1000 package*.json ./

RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM node:20.18.1-alpine3.20 AS runner

ENV NODE_ENV=production
ENV PORT=3000

RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache tini

WORKDIR /usr/src/app

COPY --chown=0:0 --from=builder /usr/src/app ./
COPY --chown=0:0 --from=prod-deps /usr/src/app/node_modules ./node_modules

USER 1000:1000

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "."]