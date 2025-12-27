# should match .node-version
FROM node:24.11.1-slim
WORKDIR /app
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch --prod
COPY package.json ./
RUN pnpm install --offline --prod
COPY data ./data
COPY src ./src
ENV NODE_ENV=production
ENTRYPOINT ["pnpm", "start"]
