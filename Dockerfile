FROM node:14-alpine

RUN apk --no-cache add --virtual native-deps  \
  curl openssl g++ gcc libgcc libstdc++ linux-headers autoconf automake make nasm py-pip git && \
  yarn global add node-gyp typescript rimraf

RUN mkdir /app
WORKDIR /app

ADD ./client .

RUN yarn install --network-concurrency 1

EXPOSE 5000

CMD ["yarn", "run", "dev"]
