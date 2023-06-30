FROM node:18.12.1 AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn install --frozen-lockfile
COPY src ./src
COPY tsconfig.json ./
# we re-run `yarn install --production` to strip the unneeded devDeps from
# node_modules after the build is done.
RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn build && yarn install --frozen-lockfile --production --offline

FROM node:18.12.1
WORKDIR /app
COPY data ./data
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# ensure python output is output immediately to logs
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS='--enable-source-maps'
ENV DEBUG=bort
ENTRYPOINT ["node", "dist/main.js"]
