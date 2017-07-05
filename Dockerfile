FROM node:8

MAINTAINER s

RUN apt-get update &&\
    apt-get install -y ffmpeg

WORKDIR /code

COPY . /code

RUN npm i

ENV DEBUG=*

ENTRYPOINT npm run start
