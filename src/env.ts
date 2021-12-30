import fs from "fs";
import envalid from "envalid";
import * as Sentry from "@sentry/node";
import { CaptureConsole } from "@sentry/integrations";
import debug from "debug";
const log = debug("bort:env");

const env = envalid.cleanEnv(
  process.env,
  {
    BOT_NAME: envalid.str({ default: "bort" }),
    DATA_DIR: envalid.str({ default: "persist" }),
    DISCORD_TOKEN: envalid.str({ default: "" }),
    OPEN_WEATHER_MAP_KEY: envalid.str({ default: "" }),
    HOSTNAME: envalid.str({ devDefault: "localhost" }),
    PORT: envalid.num({ devDefault: 8080 }),
    SENTRY_DSN: envalid.str({ default: "" }),
    USE_CLI: envalid.bool({
      default: false,
      desc:
        "Start up an interface that reads from stdin and " +
        "prints to stdout instead of connecting to servers.",
    }),
  },
  { strict: true }
);

export const {
  BOT_NAME,
  DATA_DIR,
  DISCORD_TOKEN,
  OPEN_WEATHER_MAP_KEY,
  HOSTNAME,
  PORT,
  USE_CLI,
} = env;

const { isDev, SENTRY_DSN } = env;

if (!fs.existsSync(DATA_DIR)) {
  log(DATA_DIR + " not found! creating.");
  fs.mkdirSync(DATA_DIR);
}

if (!USE_CLI) {
  if (SENTRY_DSN.length === 0) {
    console.warn(
      `Sentry DSN is invalid! Error reporting to sentry will be disabled.`
    );
  } else {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: isDev ? "dev" : "prod",
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

if (!isValidConfiguration) {
  console.warn(
    `Environment configuration doesn't appear to be valid!`,
    `Bot will do nothing if you're not running in CLI mode.`
  );

  const varsToCheck = ["DISCORD_TOKEN"];
  const configInfo = varsToCheck
    .map((key) => `${key}: ${(env as any)[key] ? "OK" : "NONE"}`)
    .join("\n");
  console.warn(configInfo);
}
