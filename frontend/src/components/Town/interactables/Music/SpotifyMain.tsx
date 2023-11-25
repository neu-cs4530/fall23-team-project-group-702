/*
- Need to split frontend into components
- Ideally move spotify api stuff to the backend and add API route
- Ideally move code for creating new playback to new component
- 
- 
*/

// Spotify
import { AccessToken } from '@spotify/web-api-ts-sdk';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SpotifySdk from './SpotifySdk';
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, TOKEN_URL } from '../../../../utilities/constants';

export default function SpotifyMain() {
  const [accessToken, setAccessToken] = useState(null as unknown as AccessToken);
  const router = useRouter();

  useEffect(() => {
    const params = router.query;
    (async () => {
      if (!params.code) {
        /* redirect user to spotify login */
        const loginResponse = await fetch('http://localhost:3000/api/login', {
          method: 'GET',
        });
        const loginData = await loginResponse.json();
        if (!loginData) {
          throw new Error('Unable to get Spotify login URL');
        }
        window.location.href = loginData;
      } else if (!accessToken) {
        /* get user access token using login info */
        const spotifyAccessTokenParams = new URLSearchParams({
          grant_type: 'authorization_code',
          code: params.code as string,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        });
        const authResponse = await fetch(TOKEN_URL, {
          method: 'POST',
          body: spotifyAccessTokenParams,
        });
        if (!authResponse.ok) {
          throw new Error('Unable to get Spotify access token using code');
        }
        /* the access token for the current user */
        const authorizationData = await authResponse.json();

        /* set access token if a valid access token object */
        if (authorizationData && authorizationData.access_token) {
          setAccessToken(authorizationData);
        } else {
          throw new Error('Unable to get Spotify access token');
        }
      }
    })();
  }, [accessToken, router.query]);

  return (
    <>
      {!accessToken ? (
        <>User Access Tokens Not Loaded</>
      ) : (
        <>
          <SpotifySdk userAccessToken={accessToken} />
        </>
      )}
    </>
  );
}
