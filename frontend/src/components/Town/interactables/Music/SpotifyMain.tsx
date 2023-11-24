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
import { client_id, client_secret, redirect_uri, tokenURL } from '../../../../utilities/constants';

export default function SpotifyMain() {
  const [accessToken, setAccessToken] = useState(null as unknown as AccessToken);
  const [serverAccessToken, setServerAccessToken] = useState(null as unknown as AccessToken);
  const router = useRouter();

  useEffect(() => {
    const params = router.query;
    (async () => {
      // if no code, redirect to spotify login
      if (!params.code) {
        const loginResponse = await fetch('http://localhost:3000/api/login', {
          method: 'GET',
        });
        const loginData = await loginResponse.json();
        if (!loginData) {
          throw new Error('Unable to get Spotify login URL');
        }
        window.location.href = loginData;
      } else if (!accessToken) {
        // get user access token
        const spotifyAccessTokenParams = new URLSearchParams({
          grant_type: 'authorization_code',
          code: params.code as string,
          redirect_uri: redirect_uri,
          client_id: client_id,
          client_secret: client_secret,
        });
        const authResponse = await fetch(tokenURL, {
          method: 'POST',
          body: spotifyAccessTokenParams,
        });
        if (!authResponse.ok) {
          throw new Error('Unable to get Spotify access token using code');
        }
        const authorizationData = await authResponse.json();

        if (authorizationData && authorizationData.access_token) {
          setAccessToken(authorizationData);
          // set sdk in rest api
          const response = await fetch('http://localhost:3000/api/spotifyplayback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accessToken: authorizationData,
            }),
          });
          if (!response.ok) {
            throw new Error('Unable to set Spotify access token');
          }
          setServerAccessToken(authorizationData);
        } else {
          throw new Error('Unable to get Spotify access token');
        }
      }
    })();
  }, [accessToken, router.query]);

  return (
    <>
      {!accessToken || !serverAccessToken ? (
        <>User/Server Access Tokens Not Loaded</>
      ) : (
        <>
          <SpotifySdk userAccessToken={accessToken} serverAccessToken={serverAccessToken} />
        </>
      )}
    </>
  );
}
