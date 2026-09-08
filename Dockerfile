FROM node:20.18.1-alpine3.20 AS builder

WORKDIR /usr/src/app

RUN chown node:node /usr/src/app

USER node

COPY --chown=node:node package*.json ./

RUN npm ci --ignore-scripts

COPY --chown=node:node . .

RUN npm run build --if-present

FROM node:20.18.1-alpine3.20 AS prod-deps

WORKDIR /usr/src/app

RUN chown node:node /usr/src/app

USER node

COPY --chown=node:node package*.json ./

RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM node:20.18.1-alpine3.20 AS runner

ENV NODE_ENV=production
ENV PORT=3000

RUN apk upgrade --no-cache && \
    apk add --no-cache tini

WORKDIR /usr/src/app

COPY --chown=root:node --from=builder /usr/src/app ./
COPY --chown=root:node --from=prod-deps /usr/src/app/node_modules ./node_modules

USER node

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "."]