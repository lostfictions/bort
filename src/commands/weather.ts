import * as got from "got";
import { stripIndent } from "common-tags";

import { HandlerArgs } from "../handler-args";
import { makeCommand } from "../util/handler";

import { OPEN_WEATHER_MAP_KEY } from "../env";

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

export default makeCommand<HandlerArgs>(
  {
    name: "weather",
    description: "rain or shine"
  },
  async ({ message }) => {
    if (message.length === 0) {
      return false;
    }

    let completionRes: got.Response<WUAutocompleteResponse>;
    try {
      completionRes = await got(`http://autocomplete.wunderground.com/aq`, {
        query: {
          query: message,
          h: 0
        },
        json: true,
        timeout: 5000
      });
    } catch (e) {
      return `Error getting geocoding results: ${e}`;
    }

    if (
      !completionRes.body.RESULTS ||
      completionRes.body.RESULTS.length === 0
    ) {
      return `dunno where '${message}' is ¯\\_(ツ)_/¯`;
    }

    const { lat, lon, name } = completionRes.body.RESULTS[0];
    if (!lat || !lon) {
      throw new Error(
        `Latitude or longitude missing in query for location '${message}'`
      );
    }

    let owmRes: got.Response<OWMResponse>;
    try {
      owmRes = await got(`https://api.openweathermap.org/data/2.5/weather`, {
        query: {
          lat,
          lon,
          appid: OPEN_WEATHER_MAP_KEY
        },
        json: true,
        timeout: 5000
      });
    } catch (e) {
      if (e.statusCode === 404) {
        return `dunno where '${message}' is ¯\\_(ツ)_/¯`;
      }
      return `Can't get weather for '${message}'! (Error: ${e})`;
    }

    const { sys, weather, main, wind } = owmRes.body;

    let formattedWind = "";
    if (wind) {
      formattedWind = `wind: ${Math.round(
        msToKmH(wind.speed)
      )}km/h (${Math.round(msTompH(wind.speed))}mph)`;
      if (wind.deg) {
        formattedWind += ` ${meteorologicalAngleToDirection(wind.deg)}`;
      }
    }

    return stripIndent`
      ${name}, ${sys.country}
      ${weather[0].description}
      ${Math.round(kelvinToC(main.temp))}°C (${Math.round(
      kelvinToF(main.temp)
    )}°F)
      ${main.humidity}% humidity
      ${formattedWind}
    `;
  }
);

interface WUAutocompleteResponse {
  RESULTS: WULocation[];
}

interface WULocation {
  name: string;
  type: string;
  c: string;
  zmw: string;
  tz: string;
  tzs: string;
  l: string;
  ll: string;
  lat: string;
  lon: string;
}

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
