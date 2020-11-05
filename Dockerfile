FROM node:lts-alpine3.12

RUN apk update
RUN apk upgrade
RUN apk add bash

COPY ./tsconfig.json ./tslint.json ./package.json ./deploy/
COPY ./src ./deploy/src/
RUN cd deploy && \
    npm install && \
    npm run build && \
    npm run test
CMD node /deploy/dist/final.js
