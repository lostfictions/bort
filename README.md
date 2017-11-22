a nice bot 4 u.

dockerized. will spin up Slack and/or Discord clients if the respective
environment variables are present. possible env vars are:

- `BOT_NAME`: the bot name (default: 'bort')
- `DATA_DIR`: the directory to store persistent data (default: 'persist')
- `SLACK_TOKENS`: a Slack API token, or a comma-separated list of Slack API
  tokens
- `DISCORD_TOKEN`: a Discord API token
- `USE_CLI`: if 'true', will start up an interface that reads from stdin and
  prints to stdout instead of connecting to any servers.
- `HOSTNAME`: hostname for the bot's server component (defaults to  'localhost'
  in a dev environment, required in production)
- `PORT`: port number for the bot's server component (defaults to 8080 in a dev
  environment, required in production)

(check the `peerio` branch if you're looking for support for that service.)

bort uses the [envalid](https://github.com/af/envalid) package which in turn
wraps [dotenv](https://github.com/motdotla/dotenv), so you can alternately stick
any of the above environment variables in a file named `.env` in the project
root. (it's gitignored.)

the "server component" mentioned above currently serves two purposes:

- it serves static files, like the bot's profile image (which must be hosted for
  services like Slack and Discord) and generated comics.
- it's a ping server that you can use in combination with a service like
  uptimerobot.com to verify if the bot is still running. (...and it's useful in
  the free tier of certain SaaSes to prevent the bot from going to sleep.)

eventually the plan is to have a full web-based management interface (that
optionally authenticates through your Slack or Discord account via OAuth) but
that's a bit ambitious for a hobby project designed for sharing funny gifs and
making bad rhymes.

`npm start` will start the bot, or use `npm run dev` to spin up a command line
interface for testing.

bort is written in typescript, and compilation artifacts are committed (to
simplify push-to-deploy-style scenarios; may be revisited in the future). run
`npm run watch` if you're hacking on it, or just make sure you run `npm run
build` before you deploy.
