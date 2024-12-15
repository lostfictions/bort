import ky, { HTTPError } from "ky";
import { stripIndent } from "common-tags";

import { makeCommand } from "../util/handler.ts";

import { OPEN_WEATHER_MAP_KEY } from "../env.ts";

const kelvinToC = (kelvin: number) => kelvin - 273.15;
const kelvinToF = (kelvin: number) => (kelvin * 9) / 5 - 459.67;
const msToKmH = (ms: number) => ms * 3.6;
const msTompH = (ms: number) => ms * 2.23694;

function meteorologicalAngleToDirection(deg: number): string {
  switch (true) {
    case deg >= 348.75 || deg < 11.25:
      return "↑"; // 'N'
    case deg >= 11.25 && deg < 33.75:
      return "↑"; // 'NNE'
    case deg >= 33.75 && deg < 56.25:
      return "↗"; // 'NE'
    case deg >= 56.25 && deg < 78.75:
      return "→"; // 'ENE'
    case deg >= 78.75 && deg < 101.25:
      return "→"; // 'E'
    case deg >= 101.25 && deg < 123.75:
      return "→"; // 'ESE'
    case deg >= 123.75 && deg < 146.25:
      return "↘"; // 'SE'
    case deg >= 146.25 && deg < 168.75:
      return "↓"; // 'SSE'
    case deg >= 168.75 && deg < 191.25:
      return "↓"; // 'S'
    case deg >= 191.25 && deg < 213.75:
      return "↓"; // 'SSW'
    case deg >= 213.75 && deg < 236.25:
      return "↙"; // 'SW'
    case deg >= 236.25 && deg < 258.75:
      return "←"; // 'WSW'
    case deg >= 258.75 && deg < 281.25:
      return "←"; // 'W'
    case deg >= 281.25 && deg < 303.75:
      return "←"; // 'WNW'
    case deg >= 303.75 && deg < 326.25:
      return "↖"; // 'NW'
    case deg >= 326.25 && deg < 348.75:
      return "↑"; // 'NNW'
    default:
      return "?";
  }
}

export default makeCommand(
  {
    name: "weather",
    description: "rain or shine",
  },
  async ({ message }) => {
    if (message.length === 0) {
      return false;
    }

    if (!OPEN_WEATHER_MAP_KEY) {
      return `can't tell da weather... i wasn't passed an openweathermap key on launch :(`;
    }

    const trimmed = message.trim();

    let owmRes;
    try {
      owmRes = await ky
        .get(`https://api.openweathermap.org/data/2.5/weather`, {
          searchParams: /^[0-9]{5}$/.test(trimmed)
            ? { zip: trimmed, appid: OPEN_WEATHER_MAP_KEY }
            : { q: trimmed, appid: OPEN_WEATHER_MAP_KEY },
          timeout: 5000,
        })
        .json();
    } catch (e) {
      if (e instanceof HTTPError && e.response.status === 404) {
        return `dunno where '${message}' is ¯\\_(ツ)_/¯`;
      }
      return `Can't get weather for '${message}'! (Error: ${String(e)})`;
    }

    const { sys, weather, main, wind, name } = owmRes as OWMResponse;

    let formattedWind = "";
    if (wind) {
      formattedWind = `wind: ${Math.round(
        msToKmH(wind.speed),
      )}km/h (${Math.round(msTompH(wind.speed))}mph)`;
      if (wind.deg) {
        formattedWind += ` ${meteorologicalAngleToDirection(wind.deg)}`;
      }
    }

    return stripIndent`
      ${name}, ${sys.country}
      ${weather[0].description}
      ${Math.round(kelvinToC(main.temp))}°C (${Math.round(
        kelvinToF(main.temp),
      )}°F)
      ${main.humidity}% humidity
      ${formattedWind}
    `;
  },
);

interface OWMResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: {
    /** Weather condition id */
    id: number;
    /** Group of weather parameters (Rain, Snow, Extreme etc.) */
    main: string;
    /** Weather condition within the group */
    description: string;
    /** http://openweathermap.org/img/w/${icon}.png */
    icon: string;
  }[];
  main: {
    /** Temperature. Unit Default: Kelvin */
    temp: number;
    /** Atmospheric pressure (on the sea level, if there is no sea_level or grnd_level data), hPa */
    pressure: number;
    /** Humidity, % */
    humidity: number;
    /**
     * Minimum temperature at the moment. This is deviation from current temp
     * that is possible for large cities and megalopolises geographically
     * expanded (use these parameter optionally).
     */
    temp_min: number;
    /**
     * Maximum temperature at the moment. This is deviation from current temp
     * that is possible for large cities and megalopolises geographically
     * expanded (use these parameter optionally).
     */
    temp_max: number;
    /**  Atmospheric pressure on the sea level, hPa */
    sea_level?: number;
    /**  Atmospheric pressure on the ground level, hPa */
    grnd_level?: number;
  };
  wind?: {
    /** Wind speed. Unit Default: meter/sec */
    speed: number;
    /** Wind direction, degrees (meteorological) */
    deg?: number;
  };
  clouds: {
    all: number;
  };
  rain?: {
    "3h": number;
  };
  snow?: {
    "3h": number;
  };
  /** Time of data calculation, unix, UTC */
  dt: number;
  sys: {
    /** Country code (GB, JP etc.) */
    country: string;
    /** Sunrise time, unix, UTC */
    sunrise: number;
    /** Sunset time, unix, UTC */
    sunset: number;
  };
  /** City ID */
  id: number;
  /** City name */
  name: string;
}
