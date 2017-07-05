FROM node:8

MAINTAINER s

RUN wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-64bit-static.tar.xz &&\
  mkdir ffmpeg &&\
  tar -xvf ffmpeg-release-64bit-static.tar.xz --strip-components=1 --wildcards --no-anchored 'ffmpeg' -C ffmpeg

ENV PATH /ffmpeg:$PATH

# RUN ls &&\
#   echo 'now what' &&\
#   ls ffmpeg

# RUN which ffmpeg

WORKDIR /code

COPY . /code

RUN npm i

ENV DEBUG=*

ENTRYPOINT npm run start
