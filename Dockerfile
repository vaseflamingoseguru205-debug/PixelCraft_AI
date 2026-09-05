FROM node:20.18.1-alpine3.20 AS builder

WORKDIR /home/node/app

RUN chown node:node /home/node/app

USER node

COPY --chown=node:node package*.json ./

RUN npm ci --ignore-scripts

COPY --chown=node:node . .

RUN npm run build --if-present

RUN rm -rf node_modules

FROM node:20.18.1-alpine3.20 AS prod-deps

WORKDIR /home/node/app

RUN chown node:node /home/node/app

USER node

COPY --chown=node:node package*.json ./

RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM node:20.18.1-alpine3.20 AS runner

ENV NODE_ENV=production
ENV PORT=3000

RUN apk upgrade --no-cache && \
    apk add --no-cache tini

WORKDIR /home/node/app

COPY --chown=root:node --from=builder /home/node/app ./
COPY --chown=root:node --from=prod-deps /home/node/app/node_modules ./node_modules

USER node

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "."]