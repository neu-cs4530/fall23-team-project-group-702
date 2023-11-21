/*
- Need to split frontend into components
- Ideally move spotify api stuff to the backend and add API route
- Ideally move code for creating new playback to new component
- 
- 
*/

// Spotify
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SpotifySdk from './SpotifySdk';

import { client_id, client_secret, loginURL, redirect_uri, tokenURL } from '../../../../utilities/constants';


export default function SpotifyMain() {
  const [accessToken, setAccessToken] = useState("");
  const [sdk, setSdk] = useState<SpotifyApi>(null as unknown as SpotifyApi);
  const [sdkAccessToken, setSdkAccessToken] = useState("");
  const router = useRouter();

  useEffect(() => {
    const params = router.query;
    (async () => {
      // if no code, redirect to spotify login
      if (!params.code) {
        const loginResponse = await fetch("http://localhost:3000/api/login", {
          method: "GET",
        });
        const loginData = await loginResponse.json();
        if (!loginData) {
          throw new Error("Unable to get Spotify login URL");
        }
        window.location.href = loginData;
      } else if (!accessToken) {
        // get access token
        const spotifyAccessTokenParams = new URLSearchParams({
          grant_type: "authorization_code",
          code: params.code as string,
          redirect_uri: redirect_uri,
          client_id: client_id,
          client_secret: client_secret,
        });

        const authResponse = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          body: spotifyAccessTokenParams,
        });
        const authorizationData = await authResponse.json();

        if (authorizationData && authorizationData.access_token) {
          setAccessToken(authorizationData.access_token);
        }
        console.log(`client_id: ${client_id} client_secret: ${client_secret} loginURL: ${loginURL} tokenURL: ${tokenURL} redirect_uri: ${redirect_uri}`)
        console.log(`user accessToken: ${JSON.stringify(authorizationData)}`)

        const internalSdk = SpotifyApi.withAccessToken(client_id, authorizationData);
        const response = await internalSdk.authenticate();
        const internalAccessToken = response.accessToken;
        setSdkAccessToken(internalAccessToken.access_token);
        console.log(`Application accessToken: ${JSON.stringify(response)}`)
        setSdk(internalSdk);
        const test = await internalSdk.player.getAvailableDevices();
        console.log(`Available Devices: ${JSON.stringify(test)}`)
      }
    })();
  }, []);

  return (
    <>
      {accessToken}
      <div>
        Temp <br />
        {sdkAccessToken}
      </div>
      {(sdk && accessToken != "") ?
        <>
          <SpotifySdk userAccessToken={accessToken} sdk={sdk} serverAccessToken={sdkAccessToken} />
        </>
        :
        <>
          SDK / Access Token Not Loaded
          <div>
            sdk is valid: {sdk !== null}
          </div>
          <div>
            accessToken: {accessToken}
          </div>
        </>
      }
    </>
  );
}
