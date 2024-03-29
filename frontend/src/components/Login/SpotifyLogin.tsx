import React from 'react';
import { useRouter } from 'next/router';

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID as string;
const LOGIN_URL = process.env.NEXT_PUBLIC_AUTHORIZATION_URL as string;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI as string;

export const SPOTIFY_SCOPES = [
  'ugc-image-upload',
  'user-read-recently-played',
  'user-top-read',
  'user-read-playback-position',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'app-remote-control',
  'streaming',
  'playlist-modify-public',
  'playlist-modify-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-follow-modify',
  'user-follow-read',
  'user-library-modify',
  'user-library-read',
  'user-read-email',
  'user-read-private',
] as const;
const SINGLE_STRING_SCOPE = SPOTIFY_SCOPES.join(' ');

export const generateRandomString = function (length: number) {
  let text = '';
  const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
  }
  return text;
};

export default function SpotifyLogin() {
  const router = useRouter();

  function redirectToUrl() {
    const state = generateRandomString(16);
    const redirectParams = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: SINGLE_STRING_SCOPE,
      redirect_uri: REDIRECT_URI,
      state: state,
    });
    const spotifyLoginPageURL = `${LOGIN_URL}?${redirectParams.toString()}`;

    // window.location.href = url;
    router.push(spotifyLoginPageURL);
  }

  if (router.query.code) {
    return null;
  }
  return (
    <button
      style={{
        backgroundColor: '#1DB954',
        color: 'white',
        border: 'none',
        borderRadius: '25px',
        padding: '10px 20px',
        fontSize: '1em',
        cursor: 'pointer',
      }}
      onClick={redirectToUrl}>
      Login with Spotify
    </button>
  );
}
