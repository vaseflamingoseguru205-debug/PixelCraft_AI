FROM node:20.18.1-alpine3.20 AS build

USER node
WORKDIR /home/node/app

COPY --chown=node:node package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

FROM node:20.18.1-alpine3.20

RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache tini && \
    rm -rf /var/cache/apk/*

WORKDIR /home/node/app

ENV NODE_ENV=production

COPY --chown=node:node . .
COPY --chown=node:node --from=build /home/node/app/node_modules ./node_modules

USER 1000:1000

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "."]