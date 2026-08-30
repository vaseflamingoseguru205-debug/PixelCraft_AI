FROM node:20.18.1-alpine3.20 AS build

ENV NODE_ENV=production

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
    apk add --no-cache tini=~0.19 && \
    rm -rf /var/cache/apk/* /tmp/*

WORKDIR /usr/src/app

RUN chown node:node /usr/src/app

COPY --chown=node:node . .
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules

USER node

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "."]