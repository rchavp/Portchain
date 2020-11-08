FROM node:lts-alpine3.12

RUN apk update
RUN apk upgrade
RUN apk add bash

COPY ./tsconfig.json ./tslint.json ./package.json ./build_all.sh ./deploy/
COPY ./src ./deploy/src/
COPY ./frontend ./deploy/frontend
WORKDIR /deploy
RUN npm install && \
    cd frontend && \
    npm install
RUN pwd && ./build_all.sh
CMD node /deploy/dist/final.js
