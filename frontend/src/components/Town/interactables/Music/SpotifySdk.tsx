import React, { useCallback } from 'react';
import { WebPlaybackSDK } from 'react-spotify-web-playback-sdk';
import { SpotifyDetails } from './SpotifyDetails';
import { AccessToken } from '@spotify/web-api-ts-sdk';

const SpotifySdk: React.VFC<{
  userAccessToken: AccessToken;
}> = (props: { userAccessToken: AccessToken }) => {
  const getOAuthToken: Spotify.PlayerInit['getOAuthToken'] = useCallback(
    callback => callback(props.userAccessToken.access_token),
    [props.userAccessToken],
  );
  if (!props.userAccessToken) {
    return <div>Not logged in || Host web sdk object not created</div>;
  } else {
    return (
      // DEVICE IS CREATED HERE
      <WebPlaybackSDK
        initialDeviceName='Covey Player'
        getOAuthToken={getOAuthToken}
        connectOnInitialized={true}
        initialVolume={0.5}>
        <div>
          <div>
            <SpotifyDetails userAccessToken={props.userAccessToken} />
          </div>
        </div>
      </WebPlaybackSDK>
    );
  }
};

export default SpotifySdk;
