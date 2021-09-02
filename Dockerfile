FROM node:16.8.0-alpine
WORKDIR /code
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY src ./src
COPY defs ./defs
COPY tsconfig.json ./
# run install --prod to strip devDeps after build is done
RUN yarn build && yarn install --frozen-lockfile --production

FROM node:16.8.0-alpine
WORKDIR /code
ENV PYTHONUNBUFFERED=1
RUN apk add --no-cache python3 && ln -sf python3 /usr/bin/python
RUN wget https://github.com/ytdl-org/youtube-dl/releases/download/2021.06.06/youtube-dl -O /usr/local/bin/ytdl \
  && chmod a+rx /usr/local/bin/ytdl
COPY data ./data
COPY --from=0 /code/node_modules ./node_modules
COPY --from=0 /code/dist ./dist
ENV NODE_ENV=production
ENV DEBUG=bort
ENTRYPOINT node dist/main.js