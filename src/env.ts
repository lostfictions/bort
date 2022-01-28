/* eslint-disable node/no-process-env */

import fs from "fs";

import { parseEnv, port, z } from "znv";
import { init as initSentry } from "@sentry/node";
import { CaptureConsole } from "@sentry/integrations";
import debug from "debug";
import { oneLine } from "common-tags";

const log = debug("bort:env");

const isDev = process.env["NODE_ENV"] !== "production";

if (isDev) {
  require("dotenv").config();
}

export const {
  BOT_NAME,
  DATA_DIR,
  DISCORD_TOKEN,
  OPEN_WEATHER_MAP_KEY,
  HOSTNAME,
  PORT,
  SENTRY_DSN,
  USE_CLI,
} = parseEnv(process.env, {
  BOT_NAME: { schema: z.string().nonempty(), defaults: { _: "bort" } },
  DATA_DIR: { schema: z.string().nonempty(), defaults: { _: "persist" } },
  DISCORD_TOKEN: {
    schema: z.string(),
    defaults: {
      production: undefined,
      _: "",
    },
  },
  OPEN_WEATHER_MAP_KEY: z.string().optional(),
  HOSTNAME: {
    schema: z.string(),
    defaults: { development: "localhost" },
  },
  PORT: {
    schema: port(),
    defaults: { development: 8080 },
  },
  SENTRY_DSN: { schema: z.string().nonempty().optional() },
  USE_CLI: {
    schema: z.boolean().default(false),
    description:
      "Start up an interface that reads from stdin and prints to stdout instead of connecting to servers.",
  },
});

if (!fs.existsSync(DATA_DIR)) {
  log(`${DATA_DIR} not found! creating.`);
  fs.mkdirSync(DATA_DIR);
}

if (!USE_CLI) {
  if (!OPEN_WEATHER_MAP_KEY) {
    console.warn(
      `Open Weather Map key appears invalid! Weather command may not work.`
    );
  }

  if (!SENTRY_DSN) {
    console.warn(
      `Sentry DSN is invalid! Error reporting to sentry will be disabled.`
    );
  } else {
    initSentry({
      dsn: SENTRY_DSN,
      environment: isDev ? "dev" : "prod",
      integrations: [
        new CaptureConsole({ levels: ["warn", "error", "debug", "assert"] }),
      ],
    });
  }
}

const isValidConfiguration = USE_CLI || DISCORD_TOKEN;

if (!isValidConfiguration) {
  console.warn(oneLine`
    Environment configuration doesn't appear to be valid! Bot will do nothing if
    you're not running in CLI mode and haven't provided a Discord token.
  `);
}
