FROM node:16.9.1 AS build
WORKDIR /code
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY src ./src
COPY defs ./defs
COPY tsconfig.json ./
# we re-run `yarn install --production` to strip the unneeded devDeps from
# node_modules after the build is done.
RUN yarn build && yarn install --frozen-lockfile --production

FROM node:16.9.1
WORKDIR /code
ENV PYTHONUNBUFFERED=1
RUN wget -q \
  https://github.com/ytdl-org/youtube-dl/releases/download/2021.06.06/youtube-dl \
  -O /usr/local/bin/ytdl \
  && chmod a+rx /usr/local/bin/ytdl
COPY data ./data
COPY --from=build /code/node_modules ./node_modules
COPY --from=build /code/dist ./dist
ENV NODE_ENV=production
ENV DEBUG=bort
ENTRYPOINT ["node", "dist/main.js"]