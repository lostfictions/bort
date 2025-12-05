import ky, { HTTPError } from "ky";
import { stripIndent } from "common-tags";
import { z } from "zod";

import { makeCommand } from "../util/handler.ts";

import { OPEN_WEATHER_MAP_KEY } from "../env.ts";

const owmResSchema = z.object({
  coord: z.object({ lon: z.number(), lat: z.number() }),
  weather: z.array(
    z.object({
      /** Weather condition id */
      id: z.number(),
      /** Group of weather parameters (Rain, Snow, Extreme etc.) */
      main: z.string(),
      /** Weather condition within the group */
      description: z.string(),
      /** http://openweathermap.org/img/w/${icon}.png */
      icon: z.string(),
    }),
  ),
  main: z.object({
    /** Temperature. Unit Default: Kelvin */
    temp: z.number(),
    /** Temperature. This temperature parameter accounts for the human perception of weather. */
    feels_like: z.number(),
    /** Atmospheric pressure (on the sea level, if there is no sea_level or grnd_level data), hPa */
    pressure: z.number(),
    /** Humidity, % */
    humidity: z.number(),
    /**
     * Minimum temperature at the moment. This is deviation from current temp
     * that is possible for large cities and megalopolises geographically
     * expanded (use these parameter optionally).
     */
    temp_min: z.number(),
    /**
     * Maximum temperature at the moment. This is deviation from current temp
     * that is possible for large cities and megalopolises geographically
     * expanded (use these parameter optionally).
     */
    temp_max: z.number(),
    /**  Atmospheric pressure on the sea level, hPa */
    sea_level: z.number().optional(),
    /**  Atmospheric pressure on the ground level, hPa */
    grnd_level: z.number().optional(),
  }),
  wind: z
    .object({
      /** Wind speed. Unit Default: meter/sec */
      speed: z.number(),
      /** Wind direction, degrees (meteorological) */
      deg: z.number().optional(),
    })
    .optional(),
  clouds: z.object({
    all: z.number(),
  }),
  rain: z
    .object({
      "3h": z.number(),
    })
    .optional(),
  snow: z
    .object({
      "3h": z.number(),
    })
    .optional(),
  /** Time of data calculation, unix, UTC */
  dt: z.number(),
  sys: z.object({
    /** Country code (GB, JP etc.) */
    country: z.string(),
    /** Sunrise time, unix, UTC */
    sunrise: z.number(),
    /** Sunset time, unix, UTC */
    sunset: z.number(),
  }),
  /** City ID */
  id: z.number(),
  /** City name */
  name: z.string(),
});

const owmResRelevantFieldsOnly = owmResSchema.pick({
  coord: true,
  sys: true,
  weather: true,
  main: true,
  wind: true,
  name: true,
});

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

    const parsed = owmResRelevantFieldsOnly.safeParse(owmRes);

    if (!parsed.success) {
      return [
        `Couldn't parse OpenWeatherMap API response:`,
        `\`\`\`JSON\n${JSON.stringify(parsed.error.issues, undefined, 2)}\n\`\`\``,
      ].join("\n");
    }

    const { coord, sys, weather, main, wind, name } = parsed.data;

    const map = `[(Map)](<https://www.google.com/maps/@${coord.lat},${coord.lon},11z>)`;

    let temp = `${Math.round(kelvinToC(main.temp))}°C (${Math.round(
      kelvinToF(main.temp),
    )}°F)`;

    if (Math.abs(main.feels_like - main.temp) > 1) {
      temp += `, feels like ${Math.round(kelvinToC(main.feels_like))}°C (${Math.round(
        kelvinToF(main.feels_like),
      )}°F)`;
    }

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
      ${name}, ${codeToCountry[sys.country] ?? sys.country} ${map}
      ${weather[0].description}
      ${temp}
      ${main.humidity}% humidity
      ${formattedWind}
    `;
  },
);

const codeToCountry: Record<string, string> = {
  AF: "Afghanistan",
  AX: "Åland Islands",
  AL: "Albania",
  DZ: "Algeria",
  AS: "American Samoa",
  AD: "Andorra",
  AO: "Angola",
  AI: "Anguilla",
  AQ: "Antarctica",
  AG: "Antigua and Barbuda",
  AR: "Argentina",
  AM: "Armenia",
  AW: "Aruba",
  AU: "Australia",
  AT: "Austria",
  AZ: "Azerbaijan",
  BS: "Bahamas",
  BH: "Bahrain",
  BD: "Bangladesh",
  BB: "Barbados",
  BY: "Belarus",
  BE: "Belgium",
  BZ: "Belize",
  BJ: "Benin",
  BM: "Bermuda",
  BT: "Bhutan",
  BO: "Bolivia, Plurinational State of",
  BQ: "Bonaire, Sint Eustatius and Saba",
  BA: "Bosnia and Herzegovina",
  BW: "Botswana",
  BV: "Bouvet Island",
  BR: "Brazil",
  IO: "British Indian Ocean Territory",
  BN: "Brunei Darussalam",
  BG: "Bulgaria",
  BF: "Burkina Faso",
  BI: "Burundi",
  KH: "Cambodia",
  CM: "Cameroon",
  CA: "Canada",
  CV: "Cape Verde",
  KY: "Cayman Islands",
  CF: "Central African Republic",
  TD: "Chad",
  CL: "Chile",
  CN: "China",
  CX: "Christmas Island",
  CC: "Cocos (Keeling) Islands",
  CO: "Colombia",
  KM: "Comoros",
  CG: "Congo",
  CD: "Congo, the Democratic Republic of the",
  CK: "Cook Islands",
  CR: "Costa Rica",
  CI: "Côte d'Ivoire",
  HR: "Croatia",
  CU: "Cuba",
  CW: "Curaçao",
  CY: "Cyprus",
  CZ: "Czech Republic",
  DK: "Denmark",
  DJ: "Djibouti",
  DM: "Dominica",
  DO: "Dominican Republic",
  EC: "Ecuador",
  EG: "Egypt",
  SV: "El Salvador",
  GQ: "Equatorial Guinea",
  ER: "Eritrea",
  EE: "Estonia",
  ET: "Ethiopia",
  FK: "Falkland Islands (Malvinas)",
  FO: "Faroe Islands",
  FJ: "Fiji",
  FI: "Finland",
  FR: "France",
  GF: "French Guiana",
  PF: "French Polynesia",
  TF: "French Southern Territories",
  GA: "Gabon",
  GM: "Gambia",
  GE: "Georgia",
  DE: "Germany",
  GH: "Ghana",
  GI: "Gibraltar",
  GR: "Greece",
  GL: "Greenland",
  GD: "Grenada",
  GP: "Guadeloupe",
  GU: "Guam",
  GT: "Guatemala",
  GG: "Guernsey",
  GN: "Guinea",
  GW: "Guinea-Bissau",
  GY: "Guyana",
  HT: "Haiti",
  HM: "Heard Island and McDonald Islands",
  VA: "Holy See (Vatican City State)",
  HN: "Honduras",
  HK: "Hong Kong",
  HU: "Hungary",
  IS: "Iceland",
  IN: "India",
  ID: "Indonesia",
  IR: "Iran, Islamic Republic of",
  IQ: "Iraq",
  IE: "Ireland",
  IM: "Isle of Man",
  IL: "Israel",
  IT: "Italy",
  JM: "Jamaica",
  JP: "Japan",
  JE: "Jersey",
  JO: "Jordan",
  KZ: "Kazakhstan",
  KE: "Kenya",
  KI: "Kiribati",
  KP: "Korea, Democratic People's Republic of",
  KR: "Korea, Republic of",
  KW: "Kuwait",
  KG: "Kyrgyzstan",
  LA: "Lao People's Democratic Republic",
  LV: "Latvia",
  LB: "Lebanon",
  LS: "Lesotho",
  LR: "Liberia",
  LY: "Libya",
  LI: "Liechtenstein",
  LT: "Lithuania",
  LU: "Luxembourg",
  MO: "Macao",
  MK: "Macedonia, the Former Yugoslav Republic of",
  MG: "Madagascar",
  MW: "Malawi",
  MY: "Malaysia",
  MV: "Maldives",
  ML: "Mali",
  MT: "Malta",
  MH: "Marshall Islands",
  MQ: "Martinique",
  MR: "Mauritania",
  MU: "Mauritius",
  YT: "Mayotte",
  MX: "Mexico",
  FM: "Micronesia, Federated States of",
  MD: "Moldova, Republic of",
  MC: "Monaco",
  MN: "Mongolia",
  ME: "Montenegro",
  MS: "Montserrat",
  MA: "Morocco",
  MZ: "Mozambique",
  MM: "Myanmar",
  NA: "Namibia",
  NR: "Nauru",
  NP: "Nepal",
  NL: "Netherlands",
  NC: "New Caledonia",
  NZ: "New Zealand",
  NI: "Nicaragua",
  NE: "Niger",
  NG: "Nigeria",
  NU: "Niue",
  NF: "Norfolk Island",
  MP: "Northern Mariana Islands",
  NO: "Norway",
  OM: "Oman",
  PK: "Pakistan",
  PW: "Palau",
  PS: "Palestine, State of",
  PA: "Panama",
  PG: "Papua New Guinea",
  PY: "Paraguay",
  PE: "Peru",
  PH: "Philippines",
  PN: "Pitcairn",
  PL: "Poland",
  PT: "Portugal",
  PR: "Puerto Rico",
  QA: "Qatar",
  RE: "Réunion",
  RO: "Romania",
  RU: "Russian Federation",
  RW: "Rwanda",
  BL: "Saint Barthélemy",
  SH: "Saint Helena, Ascension and Tristan da Cunha",
  KN: "Saint Kitts and Nevis",
  LC: "Saint Lucia",
  MF: "Saint Martin (French part)",
  PM: "Saint Pierre and Miquelon",
  VC: "Saint Vincent and the Grenadines",
  WS: "Samoa",
  SM: "San Marino",
  ST: "Sao Tome and Principe",
  SA: "Saudi Arabia",
  SN: "Senegal",
  RS: "Serbia",
  SC: "Seychelles",
  SL: "Sierra Leone",
  SG: "Singapore",
  SX: "Sint Maarten (Dutch part)",
  SK: "Slovakia",
  SI: "Slovenia",
  SB: "Solomon Islands",
  SO: "Somalia",
  ZA: "South Africa",
  GS: "South Georgia and the South Sandwich Islands",
  SS: "South Sudan",
  ES: "Spain",
  LK: "Sri Lanka",
  SD: "Sudan",
  SR: "Suriname",
  SJ: "Svalbard and Jan Mayen",
  SZ: "Eswatini",
  SE: "Sweden",
  CH: "Switzerland",
  SY: "Syrian Arab Republic",
  TW: "Taiwan, Province of China",
  TJ: "Tajikistan",
  TZ: "Tanzania, United Republic of",
  TH: "Thailand",
  TL: "Timor-Leste",
  TG: "Togo",
  TK: "Tokelau",
  TO: "Tonga",
  TT: "Trinidad and Tobago",
  TN: "Tunisia",
  TR: "Turkey",
  TM: "Turkmenistan",
  TC: "Turks and Caicos Islands",
  TV: "Tuvalu",
  UG: "Uganda",
  UA: "Ukraine",
  AE: "United Arab Emirates",
  GB: "United Kingdom",
  US: "USA",
  UM: "United States Minor Outlying Islands",
  UY: "Uruguay",
  UZ: "Uzbekistan",
  VU: "Vanuatu",
  VE: "Venezuela, Bolivarian Republic of",
  VN: "Viet Nam",
  VG: "Virgin Islands, British",
  VI: "Virgin Islands, U.S.",
  WF: "Wallis and Futuna",
  EH: "Western Sahara",
  YE: "Yemen",
  ZM: "Zambia",
  ZW: "Zimbabwe",
};
