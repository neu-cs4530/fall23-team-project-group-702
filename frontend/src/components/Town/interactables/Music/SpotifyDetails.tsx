import { AccessToken } from '@spotify/web-api-ts-sdk';
import { useEffect } from 'react';
import { usePlayerDevice } from 'react-spotify-web-playback-sdk';

/*
  Every player should have their own playback device upon entering Covey.Town. We should move this logic
  out of the component eventually.
*/
export const SpotifyDetails: React.VFC<{ serverAccessToken: AccessToken }> = (props: {
  serverAccessToken: AccessToken;
}) => {
  const playerDevice = usePlayerDevice();

  useEffect(() => {
    async function activate() {
      if (playerDevice?.device_id === undefined || !props.serverAccessToken) return;
      console.log("Activating device in details... with device_id" + playerDevice.device_id)
      console.log("Activating with device_id (part 2) with accessToken: " + props.serverAccessToken.access_token)
      const transferPlaybackResponse = await fetch(
        `http://localhost:3000/api/spotifyplayback?temp=transferPlayback&deviceId=${playerDevice.device_id}&accessToken=${props.serverAccessToken.access_token}`,
        {
          method: "GET"
        }
      );
      if (!transferPlaybackResponse.ok) {
        throw new Error('Unable to transfer playback to player device');
      }
    }
    activate();
  }, [playerDevice?.device_id, props.serverAccessToken]);
  return null;
};
