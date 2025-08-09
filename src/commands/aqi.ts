import { Agent } from "node:https";
import { AttachmentBuilder } from "discord.js";
import debug from "debug";

import ky from "ky";
import { createCanvas, loadImage } from "@napi-rs/canvas";

import { makeCommand } from "../util/handler.ts";

import { AQICN_KEY, OPEN_WEATHER_MAP_KEY } from "../env.ts";

const log = debug("bort:aqi");

/** OSM tiles are always 256x256. */
const OSM_TILE_SIZE = 256;

const MAP_ZOOM = 12;

/*
 * how many extra tiles in each direction should we fetch? for example, a value
 * of 2 means 2 extra tiles above, below, left and right, ie. a 5x5 grid.
 */
const MAP_TILE_PADDING = 2;

export default makeCommand(
  {
    name: "aqi",
    description: "what color is the sky in your world",
  },
  async ({ message, discordMeta, channel }) => {
    if (message.length === 0) {
      return false;
    }

    if (!AQICN_KEY) return `no aqicn api key provided :(`;
    if (!OPEN_WEATHER_MAP_KEY) return `no openweathermap key provided :(`;

    const trimmed = message.trim();

    log(`Using OWM geocode API to fetch lat/lon for ${trimmed}`);

    let owmRes;
    try {
      owmRes = /^[0-9]{5}$/.test(trimmed)
        ? await ky
            .get(`http://api.openweathermap.org/geo/1.0/zip`, {
              searchParams: { zip: trimmed, appid: OPEN_WEATHER_MAP_KEY },
              timeout: 5000,
            })
            .json()
        : await ky
            .get(`http://api.openweathermap.org/geo/1.0/direct`, {
              searchParams: { q: trimmed, appid: OPEN_WEATHER_MAP_KEY },
              timeout: 5000,
            })
            .json();
    } catch (e) {
      return `Can't get location from OpenWeatherMap for '${message}'! (Error: ${String(e)})`;
    }

    if (!Array.isArray(owmRes) || owmRes.length === 0) {
      return `dunno where '${message}' is ¯\\_(ツ)_/¯`;
    }

    const { name, country, lat, lon } = (
      owmRes as [{ name: string; lat: number; lon: number; country: string }]
    )[0];

    log(`Building AQI map for ${name}, ${country}`);

    const jpgData = await getTilesForCoords(lat, lon, MAP_ZOOM);

    if (discordMeta) {
      const { channel: discordChannel } = discordMeta.message;
      await discordChannel.fetch();
      if (!discordChannel.isSendable()) {
        throw new Error(
          `We don't have permissions to send in channel! (Channel: ${discordChannel.name})`,
        );
      }
      const attachment = new AttachmentBuilder(jpgData, {
        name: "aqi-map.jpg",
      });
      await discordChannel.send({
        content: `AQI data for ${name}, ${country}`,
        files: [attachment],
      });
      return "";
    }

    if (channel === "cli-channel") {
      const { writeFile, mkdir } = await import("node:fs/promises");
      const { tmpdir } = await import("node:os");
      const { join } = await import("node:path");

      const dir = join(tmpdir(), "bort");
      await mkdir(dir, { recursive: true });
      const filename = join(dir, "map.jpg");
      await writeFile(filename, jpgData);
      return `wrote file to file://${filename}`;
    }

    return "client type doesn't support uploading images yet (or i haven't implemented it)";
  },
);

// https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
function lon2tile(lon: number, zoom: number) {
  const res = ((lon + 180) / 360) * 2 ** zoom;
  return [Math.floor(res), res % 1];
}

function lat2tile(lat: number, zoom: number) {
  const res =
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180),
      ) /
        Math.PI) /
      2) *
    2 ** zoom;

  return [Math.floor(res), res % 1];
}

async function getTilesForCoords(lat: number, lon: number, zoom: number) {
  const [xCoord] = lon2tile(lon, zoom);
  const [yCoord] = lat2tile(lat, zoom);

  const osmUrls: string[] = [];
  const aqiUrls: string[] = [];

  for (let j = -MAP_TILE_PADDING; j <= MAP_TILE_PADDING; j++) {
    for (let i = -MAP_TILE_PADDING; i <= MAP_TILE_PADDING; i++) {
      osmUrls.push(osmTile(xCoord + i, yCoord + j, MAP_ZOOM));
      aqiUrls.push(aqiTile(xCoord + i, yCoord + j, MAP_ZOOM));
    }
  }

  // we need to limit request concurrency -- firing off a bunch of tile requests
  // can make node trip over itself, at least using `@napi-rs/canvas`'s
  // `loadImage()`
  const agent = new Agent({ maxSockets: 5 });

  log("gathered urls:", { osmUrls, aqiUrls });

  // float the promise while we composite the base layer
  const aqiTilesPromise = Promise.all(
    aqiUrls.map((u) =>
      loadImage(u, {
        requestOptions: {
          agent,
        },
      }),
    ),
  );

  log("fetching base tiles...");
  const osmTiles = await Promise.all(
    osmUrls.map((u) =>
      loadImage(u, {
        requestOptions: {
          agent,
          // custom user-agent is part of osm tile usage technical requirements:
          // https://operations.osmfoundation.org/policies/tiles/#technical-usage-requirements
          headers: { "user-agent": "bort the funny bot" },
        },
      }),
    ),
  );

  const gridSize = MAP_TILE_PADDING * 2 + 1;
  const canvasSize = OSM_TILE_SIZE * gridSize;

  const canvas = createCanvas(canvasSize, canvasSize);
  const ctx = canvas.getContext("2d");

  log("drawing base layer...");
  for (let j = 0; j < gridSize; j++) {
    for (let i = 0; i < gridSize; i++) {
      ctx.drawImage(
        osmTiles[i + gridSize * j],
        OSM_TILE_SIZE * i,
        OSM_TILE_SIZE * j,
      );
    }
  }

  log("fetching aqi tiles...");
  const aqiTiles = await aqiTilesPromise;

  log("drawing aqi layer...");
  for (let j = 0; j < gridSize; j++) {
    for (let i = 0; i < gridSize; i++) {
      ctx.drawImage(
        aqiTiles[i + gridSize * j],
        OSM_TILE_SIZE * i,
        OSM_TILE_SIZE * j,
      );
    }
  }

  log("encoding to buffer...");
  const jpgData = await canvas.encode("jpeg", 90);

  return jpgData;
}

const osmTile = (x: number, y: number, zoom: number) =>
  `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;

const aqiTile = (x: number, y: number, zoom: number) =>
  `https://tiles.aqicn.org/tiles/usepa-aqi/${zoom}/${x}/${y}.png?token=${AQICN_KEY}`;
