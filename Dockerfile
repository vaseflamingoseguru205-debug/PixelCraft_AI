FROM node:20.18.1-alpine3.20 AS builder

RUN apk upgrade --no-cache

WORKDIR /home/node/app
RUN chown -R node:node /home/node/app

USER node

COPY --chown=node:node package*.json ./

RUN npm ci --ignore-scripts

COPY --chown=node:node . .

RUN npm run build --if-present && rm -rf node_modules

FROM node:20.18.1-alpine3.20 AS prod-deps

RUN apk upgrade --no-cache

WORKDIR /home/node/app
RUN chown -R node:node /home/node/app

USER node

COPY --chown=node:node package*.json ./

RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM node:20.18.1-alpine3.20 AS runner

ENV NODE_ENV=production
ENV PORT=3000

RUN apk upgrade --no-cache && \
    apk add --no-cache tini && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /opt/yarn*

WORKDIR /home/node/app
RUN chown -R node:node /home/node/app

COPY --chown=node:node --from=builder /home/node/app ./
COPY --chown=node:node --from=prod-deps /home/node/app/node_modules ./node_modules

USER node

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "."]