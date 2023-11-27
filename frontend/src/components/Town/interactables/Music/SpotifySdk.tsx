import React, { useCallback, useEffect } from 'react';
import { WebPlaybackSDK } from 'react-spotify-web-playback-sdk';
import { AccessToken } from '@spotify/web-api-ts-sdk';
// import MusicAreaController from '../../../../classes/interactable/MusicAreaController';

const SpotifySdk: React.VFC<{
  userAccessToken: AccessToken;
  children: React.ReactNode;
}> = (props: { userAccessToken: AccessToken; children: React.ReactNode }) => {
  const getOAuthToken: Spotify.PlayerInit['getOAuthToken'] = useCallback(
    callback => callback(props.userAccessToken.access_token),
    [props.userAccessToken],
  );
  useEffect(() => {
    console.log(`accessToken: ${props.userAccessToken.access_token}`);
  }, [props.userAccessToken]);
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
        <div>{props.children}</div>
      </WebPlaybackSDK>
    );
  }
};

export default SpotifySdk;
