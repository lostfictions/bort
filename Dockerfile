FROM node:10.6

MAINTAINER s

# RUN wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-64bit-static.tar.xz &&\
#   mkdir ffmpeg-bin &&\
#   tar -xvf ffmpeg-release-64bit-static.tar.xz -C ffmpeg-bin/ --strip-components=1 --wildcards --no-anchored 'ffmpeg'

# ENV PATH "/ffmpeg-bin:${PATH}"

WORKDIR /code

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . ./
RUN yarn build

ENV NODE_ENV=production
ENV DEBUG=*
ENTRYPOINT yarn start
