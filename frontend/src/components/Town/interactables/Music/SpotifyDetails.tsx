import { AccessToken } from '@spotify/web-api-ts-sdk';
import { useEffect } from 'react';
import { usePlayerDevice } from 'react-spotify-web-playback-sdk';

/*
  Every player should have their own playback device upon entering Covey.Town. We should move this logic
  out of the component eventually.
*/
export const SpotifyDetails: React.VFC<{ userAccessToken: AccessToken }> = (props: {
  userAccessToken: AccessToken;
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
      // set sdk in rest api
      const response = await fetch('http://localhost:3000/api/spotifyplayback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: props.userAccessToken,
          deviceId: playerDevice.device_id,
        }),
      });
      if (!response.ok) {
        throw new Error('Unable to set Spotify access token');
      }
    }
    activate();
  }, [playerDevice?.device_id, props.userAccessToken]);
  return null;
};
