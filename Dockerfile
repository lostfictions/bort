FROM node:13

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
