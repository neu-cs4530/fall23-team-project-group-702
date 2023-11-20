import { NextApiHandler } from "next";
import { setCookie } from "nookies";

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
    client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID as string,
    scope: "user-modify-playback-state streaming user-read-email user-read-private",
    redirect_uri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI as string,
    state: state,
    });

    // const secure = !req.headers.host?.includes("localhost");
    // setCookie({ res }, "state", state, {
    //   maxAge: 3600000,
    //   secure: secure,
    //   httpOnly: true,
    //   path: "/",
    // });
    const url = `${process.env.NEXT_PUBLIC_AUTHORIZATION_URL}?${redirectParams.toString()}`;

    res.json(url);
  } else {
    res.status(405).send("Method Not Allowed, must be GET request");
  }
};

export default handler;
