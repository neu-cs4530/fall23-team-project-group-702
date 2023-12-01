import React, { useCallback } from 'react';
import { WebPlaybackSDK } from 'react-spotify-web-playback-sdk';
import { AccessToken } from '@spotify/web-api-ts-sdk';

const SpotifySdk: React.VFC<{
  userAccessToken: AccessToken;
  children: React.ReactNode;
}> = (props: { userAccessToken: AccessToken; children: React.ReactNode }) => {
  const getOAuthToken: Spotify.PlayerInit['getOAuthToken'] = useCallback(
    callback => callback(props.userAccessToken.access_token),
    [props.userAccessToken],
  );

  // useEffect(() => {
  //   console.log('mounting component...');
  //   window.addEventListener('beforeunload', handleBeforeUnload);

  //   return () => {
  //     console.log('unmounting component...');
  //     window.removeEventListener('beforeunload', handleBeforeUnload);
  //   };
  // }, []);

  if (!props.userAccessToken) {
    return null;
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
