import { NextApiHandler } from "next";
// import { setCookie } from "nookies";

const client_id = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID as string;
const client_secret = process.env.NEXT_PUBLIC_SPOTIFY_SECRET_TOKEN as string;
const loginURL = process.env.NEXT_PUBLIC_AUTHORIZATION_URL as string;
const tokenURL = process.env.NEXT_PUBLIC_ACCESS_TOKEN_URL as string;
const redirect_uri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI as string;

let dictionary: { [key: string]: string } = {
  "key1": "value1",
  "key2": "value2",
  "key3": "value3"
};

export const SPOTIFY_SCOPES = [
  "ugc-image-upload",
  "user-read-recently-played",
  "user-top-read",
  "user-read-playback-position",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "app-remote-control",
  "streaming",
  "playlist-modify-public",
  "playlist-modify-private",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-follow-modify",
  "user-follow-read",
  "user-library-modify",
  "user-library-read",
  "user-read-email",
  "user-read-private",
] as const;
const singleStringScope = SPOTIFY_SCOPES.join(" ");

const generateRandomString = function (length: number) {
  let text = '';
  const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
  }
  return text;
};

const handler: NextApiHandler = (req, res) => {
  if (req.method === "GET") {
    const state = generateRandomString(16);
    // const test = Spotify.PlayerInit["getOAuthToken"]

    const redirectParams = new URLSearchParams({
    response_type: "code",
    client_id: client_id,
    scope: singleStringScope,
    redirect_uri: redirect_uri,
    state: state,
    });

    // const secure = !req.headers.host?.includes("localhost");
    // setCookie({ res }, "state", state, {
    //   maxAge: 3600000,
    //   secure: secure,
    //   httpOnly: true,
    //   path: "/",
    // });
    const url = `${loginURL}?${redirectParams.toString()}`;

    res.json(url);
  }
  else if (req.method === "POST") {
    const queryParams = req.query;
    const queryParamsString = JSON.stringify(queryParams);
    if (dictionary[queryParamsString]) {
      res.status(200).send("Already created");
      return;
    }
    dictionary[queryParamsString] = queryParamsString;
    res.send(queryParamsString);
  }
  else {
    res.status(405).send("Method Not Allowed, must be GET request");
  }
};

export default handler;
