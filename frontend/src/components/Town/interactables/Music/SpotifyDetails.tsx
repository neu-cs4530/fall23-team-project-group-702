import { AccessToken } from '@spotify/web-api-ts-sdk';
import { useEffect } from 'react';
import { usePlayerDevice } from 'react-spotify-web-playback-sdk';
import MusicAreaController from '../../../../classes/interactable/MusicAreaController';
import { MusicArea } from '../../../../types/CoveyTownSocket';

/*
  Every player should have their own playback device upon entering Covey.Town. We should move this logic
  out of the component eventually.
*/
export const SpotifyDetails: React.VFC<{ userAccessToken: AccessToken, musicController: MusicAreaController }> = (props: {
  userAccessToken: AccessToken;
  musicController: MusicAreaController;
}) => {
  const playerDevice = usePlayerDevice();

  useEffect(() => {
    async function activate() {
      if (playerDevice?.device_id === undefined || !props.userAccessToken) return;
      console.log('Activating device in details... with device_id' + playerDevice.device_id);
      console.log(
        'Activating with device_id (part 2) with accessToken: ' +
          props.userAccessToken.access_token,
      );
      // add user to sessio
      // set sdk in rest api
      const response = await props.musicController.sendSpotifyCommand({
        commandType: 'addUserToSession',
        accessToken: props.userAccessToken,
        deviceId: playerDevice.device_id,
      } as MusicArea);

      /*
      const response2 = await fetch('http://localhost:3000/api/spotifyplayback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: props.userAccessToken,
          deviceId: playerDevice.device_id,
        }),
      });
      */
    }
    activate();
  }, [playerDevice?.device_id, props.userAccessToken]);
  return null;
};
