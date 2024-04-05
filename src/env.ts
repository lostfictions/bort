/* eslint-disable node/no-process-env */

import fs from "fs";
import { parseEnv, z } from "znv";
import { init as initSentry } from "@sentry/node";
import { captureConsoleIntegration } from "@sentry/integrations";
import debug from "debug";
import { oneLine } from "common-tags";

const log = debug("bort:env");

const isDevEnv = process.env["NODE_ENV"] !== "production";
const isTestEnv = process.env["NODE_ENV"] === "test";

if (isDevEnv) {
  require("dotenv").config();
}

export const {
  BOT_NAME,
  DATA_DIR,
  DISCORD_TOKEN,
  OPEN_WEATHER_MAP_KEY,
  SENTRY_DSN,
  USE_CLI,
} = parseEnv(process.env, {
  BOT_NAME: z.string().min(1).default("bort"),
  DATA_DIR: {
    schema: z.string().min(1),
    defaults: {
      production: undefined,
      _: "persist",
    },
  },
  DISCORD_TOKEN: {
    schema: z.string(),
    defaults: {
      production: undefined,
      _: "",
    },
  },
  OPEN_WEATHER_MAP_KEY: z.string().optional(),
  SENTRY_DSN: { schema: z.string().min(1).optional() },
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

if (!USE_CLI && !isTestEnv) {
  if (!OPEN_WEATHER_MAP_KEY) {
    console.warn(
      `Open Weather Map key appears invalid! Weather command may not work.`,
    );
  }

  if (!SENTRY_DSN) {
    console.warn(
      `Sentry DSN is invalid! Error reporting to Sentry will be disabled.`,
    );
  } else {
    initSentry({
      dsn: SENTRY_DSN,
      environment: isDevEnv ? "dev" : "prod",
      integrations: [
        captureConsoleIntegration({
          levels: ["warn", "error", "debug", "assert"],
        }),
      ],
    });
  }
}

const isValidConfiguration = USE_CLI || isTestEnv || DISCORD_TOKEN;

if (!isValidConfiguration) {
  console.warn(oneLine`
    Environment configuration doesn't appear to be valid! Bot will do nothing if
    you're not running in CLI mode and haven't provided a Discord token.
  `);
}
