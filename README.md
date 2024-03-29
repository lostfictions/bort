bort is a nice bot.

![bort in cyberverse](https://i.imgur.com/fJwZM2T.gif)

dockerized. will spin up ~~Slack and/or~~ Discord clients if the respective
environment variables are present. possible env vars are:

- `DISCORD_TOKEN`: a Discord API token
- `USE_CLI`: if 'true', will start up an interface that reads from stdin and
  prints to stdout instead of connecting to any servers.
- `BOT_NAME`: the bot name (default: 'bort')
- `DATA_DIR`: the directory to store persistent data (default: 'persist')
- `HOSTNAME`: hostname for the bot's server component (defaults to 'localhost'
  in a dev environment, required in production)
- `PORT`: port number for the bot's server component (defaults to 8080 in a dev
  environment, required in production)
- `OPEN_WEATHER_MAP_KEY`: an api key for the
  [OpenWeatherMap](https://openweathermap.org/) api, if you'd like bort to be
  able to tell you the weather.

_(Slack support is removed as of `4.0.0` -- there were some breaking changes in
the client API and it didn't seem like bort was running on any Slack teams. if
there's interest it can be re-added.)_

each service that bort connects to gets its own isolated data store. stores are
[leveldb](https://github.com/google/leveldb) databases (via the
[level](https://github.com/Level/level) package) that are persisted to the
directory provided as the `DATA_DIR`.

the "server component" mentioned above currently serves two purposes:

- it serves static files, like the bot's profile image (which must be hosted for
  services like Slack and Discord) and generated comics.
- it's a ping server that you can use in combination with a service like
  uptimerobot.com to verify if the bot is still running. (...and it's useful in
  the free tier of certain SaaSes to prevent the bot from going to sleep.)

eventually the plan is to have a full web-based management interface (that
optionally authenticates through Discord account for authorized members of your
server) but that's a bit ambitious for a hobby project designed for sharing
funny gifs and making bad rhymes.

`npm start` will start the bot in production mode. Use `npm run dev` if you want
to run a local bot that will connect to services but restart on any change, or
`npm run dev-cli` to spin up an offline command-line interface for testing that
will restart on any change.

bort is written in typescript, and the dockerfile will compile to js as part of
its setup.
