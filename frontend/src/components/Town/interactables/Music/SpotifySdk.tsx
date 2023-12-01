import React, { useCallback, useEffect } from 'react';
import { WebPlaybackSDK } from 'react-spotify-web-playback-sdk';
import { AccessToken } from '@spotify/web-api-ts-sdk';
import PrivateMusicArea from '../PrivateMusicArea';
import { useInteractable } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import { useRouter } from 'next/router';

const SpotifySdk: React.VFC<{
  userAccessToken: AccessToken;
  children: React.ReactNode;
}> = (props: { userAccessToken: AccessToken; children: React.ReactNode }) => {
  const router = useRouter();
  const getOAuthToken: Spotify.PlayerInit['getOAuthToken'] = useCallback(
    callback => callback(props.userAccessToken.access_token),
    [props.userAccessToken],
  );
  const coveyTownController = useTownController();
  const musicArea: PrivateMusicArea | undefined = useInteractable('privateMusicArea');

  const handleBeforeUnload = () => {
    console.log('Window is about to be closed');
    // if (musicArea !== undefined) {
    //   const musicAreaController = coveyTownController.getMusicAreaController(musicArea);
    //   if (musicAreaController.sessionInProgress) {
    //     console.log('Removing user from session');
    //     musicAreaController.removeUserFromSession();
    //   }
    // }
  };

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
