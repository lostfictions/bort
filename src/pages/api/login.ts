import querystring from "querystring";

import { URL } from "url";
import { v4 as uuid } from "uuid";
import fetch from "node-fetch";
import { sign } from "jsonwebtoken";
import cookie from "cookie";

import handler from "../../util/api-handler";
import {
  DISCORD_CLIENT_SECRET as client_secret,
  DISCORD_CLIENT_ID as client_id,
  JWT_SECRET,
  HOSTNAME,
} from "../../env";

import { NextApiResponse } from "next";

const DISCORD_URL = "https://discordapp.com";
const AUTHORIZE_URL = `${DISCORD_URL}/api/oauth2/authorize`;
const TOKEN_URL = `${DISCORD_URL}/api/oauth2/token`;
const USER_URL = `${DISCORD_URL}/api/users/@me`;

const scope = ["identify", "guilds"].join(" ");

/** From state id to the url we return to on successful auth */
const states = new Map<string, string>();

/**
 * The oauth redirect uri is always the route we're currently on, which we
 * determine once and then cache.
 */
let redirect_uri: string = null as any;

export default handler(async function login(req, res) {
  const { searchParams, pathname } = new URL(req.url!, HOSTNAME);
  if (!redirect_uri) redirect_uri = `${HOSTNAME}${pathname}`;

  // TODO: verify already logged in?

  const state = searchParams.get("state");
  if (state) {
    const code = searchParams.get("code");
    if (!code) {
      throw new Error("Both search and code are required to complete auth!");
    }
    return completeAuth(res, state, code);
  }

  const returnTo = searchParams.get("return_to") || req.headers.referer;
  return redirectAuthorize(res, returnTo);
});

/**
 * @param res The server response to write the redirect to.
 * @param returnTo The local route to redirect to on authorization success.
 */
function redirectAuthorize(res: NextApiResponse, returnTo?: string): void {
  let finalReturn = "/";
  if (returnTo) {
    // Disallow open redirect. If we need to get fancy later we can whitelist
    // specific routes.
    const { origin, pathname } = new URL(returnTo, HOSTNAME);
    if (origin !== HOSTNAME) {
      console.warn(`return_to origin doesn't match: "${returnTo}"`);
    } else {
      finalReturn = pathname;
    }
  }

  const state = uuid();
  states.set(state, finalReturn);
  setTimeout(() => {
    states.delete(state);
  }, 1000 * 60 * 30);

  res.statusCode = 302;
  res.setHeader(
    "Location",
    `${AUTHORIZE_URL}?${querystring.stringify({
      response_type: "code",
      prompt: "none",
      client_id,
      redirect_uri,
      scope,
      state,
    })}`
  );
  res.end();
}

/**
 * Complete the auth process and redirect the user to the `returnTo` parameter
 * provided in the initial call.
 * @param res The server response to write the redirect to.
 * @param state The state token we passed to the OAuth provider.
 * @param code The code the client received from the OAuth provider.
 */
async function completeAuth(res: NextApiResponse, state: string, code: string) {
  const returnTo = states.get(state);
  if (!returnTo) {
    // TODO: might've waited on the auth screen too long, say. just redirect
    // somewhere with a better error message?
    throw new Error("Invalid state!");
  }

  states.delete(state);

  interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
  }

  const response: TokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: querystring.encode({
      grant_type: "authorization_code",
      client_id,
      client_secret,
      scope,
      code,
      redirect_uri,
    }),
  }).then((r) => r.json());

  const accessToken = response.access_token;

  if (!accessToken) {
    throw new Error("Expected access token in response to auth grant request!");
  }

  const account = await fetch(USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).then((r) => r.json());

  if (!account && account.id) {
    throw new Error("Couldn't retrieve account info!");
  }

  const data = {
    token: accessToken,
    expires: Date.now() + response.expires_in * 1000,
    refreshToken: response.refresh_token,
  };

  // FIXME: adapt to level
  // await photon.discordUser.upsert({
  //   where: {
  //     id: account.id,
  //   },
  //   update: {
  //     ...data,
  //   },
  //   create: {
  //     id: account.id,
  //     ...data,
  //   },
  // });

  const sessionCookie = sign(account.id, JWT_SECRET);

  res.setHeader(
    "Set-Cookie",
    cookie.serialize("session", sessionCookie, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
  );
  res.statusCode = 302;
  res.setHeader("Location", returnTo);
  res.end();
}
