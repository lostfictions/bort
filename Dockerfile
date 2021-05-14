FROM node:16

RUN curl -L https://yt-dl.org/downloads/latest/youtube-dl -o /usr/local/bin/ytdl \
  && chmod a+rx /usr/local/bin/ytdl

WORKDIR /code

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY src ./src
COPY defs ./defs
COPY tsconfig.json ./
RUN yarn build

COPY . ./
ENV NODE_ENV=production
ENV DEBUG=bort
ENTRYPOINT yarn start
