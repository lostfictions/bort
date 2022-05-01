# HACK: dunno why the vps says https://registry-1.docker.io/v2/ has an expired
# x509 cert, but let's use this for now

FROM registry.hub.docker.com/library/node:16.15.0 AS build
WORKDIR /app
ENV YARN_CACHE_FOLDER=/root/.yarn
COPY package.json yarn.lock ./
RUN --mount=type=cache,target=/root/.yarn yarn install --frozen-lockfile
COPY src ./src
COPY tsconfig.json ./
# we re-run `yarn install --production` to strip the unneeded devDeps from
# node_modules after the build is done.
RUN --mount=type=cache,target=/root/.yarn yarn build && yarn install --frozen-lockfile --production --offline

FROM registry.hub.docker.com/library/node:16.15.0
WORKDIR /app
RUN wget -q \
  https://github.com/yt-dlp/yt-dlp/releases/download/2022.01.21/yt-dlp \
  -O /usr/local/bin/ytdl \
  && chmod a+rx /usr/local/bin/ytdl
COPY data ./data
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# ensure python output is output immediately to logs
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS='--enable-source-maps'
ENV DEBUG=bort
ENTRYPOINT ["node", "dist/main.js"]