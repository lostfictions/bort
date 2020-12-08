import fs from "fs";
import { cleanEnv, str, num, bool } from "envalid";
import * as Sentry from "@sentry/node";
import { CaptureConsole } from "@sentry/integrations";
import debug from "debug";
const log = debug("bort:env");

const env = cleanEnv(
  process.env,
  {
    BOT_NAME: str({ default: "bort" }),
    DATA_DIR: str({ default: "persist" }),
    DISCORD_TOKEN: str({ devDefault: "" }),
    DISCORD_CLIENT_SECRET: str({ devDefault: "" }),
    DISCORD_CLIENT_ID: str({ devDefault: "" }),
    JWT_SECRET: str({ devDefault: "" }),
    OPEN_WEATHER_MAP_KEY: str({ default: "" }),
    HOSTNAME: str({ devDefault: "localhost" }),
    PORT: num({ devDefault: 8080 }),
    SENTRY_DSN: str({ default: "" }),
    USE_CLI: bool({
      default: false,
      desc:
        "Start up an interface that reads from stdin and " +
        "prints to stdout instead of connecting to servers.",
    }),
  },
  {
    strict: true,
    dotEnvPath: process.env["USE_TESTING"] ? ".env.test" : ".env",
  }
);

export const {
  isDev,
  BOT_NAME,
  DATA_DIR,
  DISCORD_TOKEN,
  DISCORD_CLIENT_SECRET,
  DISCORD_CLIENT_ID,
  JWT_SECRET,
  OPEN_WEATHER_MAP_KEY,
  HOSTNAME,
  PORT,
  USE_CLI,
} = env;

if (!fs.existsSync(DATA_DIR)) {
  log(DATA_DIR + " not found! creating.");
  fs.mkdirSync(DATA_DIR);
}

if (!env.USE_CLI) {
  if (env.SENTRY_DSN.length === 0) {
    console.warn(
      `Sentry DSN is invalid! Error reporting to sentry will be disabled.`
    );
  } else {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.isDev ? "dev" : "prod",
      integrations: [
        new CaptureConsole({ levels: ["warn", "error", "debug", "assert"] }),
      ],
    });
  }
}

if (OPEN_WEATHER_MAP_KEY.length === 0) {
  console.warn(
    `Open Weather Map key appears invalid! Weather command may not work.`
  );
}

const isValidConfiguration = USE_CLI || DISCORD_TOKEN;

const isNextConfiguration =
  DISCORD_CLIENT_SECRET && DISCORD_CLIENT_ID && JWT_SECRET;

if (!isValidConfiguration) {
  console.warn(
    `Environment configuration doesn't appear to be valid!`,
    `Bot will do nothing if you're not running in CLI mode.`
  );
}

if (!isNextConfiguration) {
  console.warn(
    `Environment configuration doesn't appear ` +
      `to allow running Next server!`
  );
}

if (!isValidConfiguration || !isNextConfiguration) {
  const varsToCheck = [
    "DISCORD_TOKEN",
    "DISCORD_CLIENT_SECRET",
    "DISCORD_CLIENT_ID",
    "JWT_SECRET",
  ];
  const configInfo = varsToCheck
    .map((key) => `${key}: ${(env as any)[key] ? "OK" : "NONE"}`)
    .join("\n");
  console.warn(configInfo);
}
