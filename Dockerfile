FROM node:8

MAINTAINER s

RUN wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-64bit-static.tar.xz &&\
  mkdir ffmpeg-bin &&\
  tar -xvf ffmpeg-release-64bit-static.tar.xz -C ffmpeg-bin/ --strip-components=1 --wildcards --no-anchored 'ffmpeg'

ENV PATH "/ffmpeg-bin:${PATH}"


RUN ls &&\
  echo '...dir:' &&\
  ls ffmpeg-bin &&\
  echo '...path:' &&\
  which ffmpeg

# RUN ./ffmpeg/ffmpeg

WORKDIR /code

COPY . /code

RUN npm i

ENV DEBUG=*

ENTRYPOINT export PATH=$PATH:/ffmpeg && npm run start
