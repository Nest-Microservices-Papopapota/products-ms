FROM node:22-alpine3.23

WORKDIR /usr/src/app

COPY package.json ./

RUN yarn install
COPY . .

# RUN yarn prisma generate
EXPOSE 3001