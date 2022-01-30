/* eslint-disable node/no-process-env */

import fs from "fs";
import { parseEnv, z } from "znv";
import { init as initSentry } from "@sentry/node";
import { CaptureConsole } from "@sentry/integrations";
import debug from "debug";
import { oneLine } from "common-tags";
import execa from "execa";

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
  SENTRY_DSN,
  USE_CLI,
} = parseEnv(process.env, {
  BOT_NAME: z.string().nonempty().default("bort"),
  DATA_DIR: {
    schema: z.string().nonempty(),
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
  SENTRY_DSN: { schema: z.string().nonempty().optional() },
  USE_CLI: {
    schema: z.boolean().default(false),
    description:
      "Start up an interface that reads from stdin and prints to stdout instead of connecting to servers.",
  },
});

export const YTDL_COMMAND = ["yt-dlp", "youtube-dl", "ytdl"].find(
  (e) => execa.sync("which", [e], { reject: false }).exitCode === 0
);

if (!YTDL_COMMAND) {
  console.warn(
    "ytdl command not found! video extraction functionality will be unavailable."
  );
}

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
