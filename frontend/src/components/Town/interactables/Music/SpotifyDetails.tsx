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
      const transferPlaybackResponse = await fetch(
        `http://localhost:3000/api/spotifyplayback?temp=transferPlayback&deviceId=${playerDevice.device_id}`,
      );
      if (!transferPlaybackResponse.ok) {
        throw new Error('Unable to transfer playback to player device');
      }
      console.log(`transferPlaybackResponse ok: ${transferPlaybackResponse.ok}`);

      // const defaultTrackId = '1HYzRuWjmS9LXCkdVHi25K';
      // const playSongResponse = await fetch(
      //   `http://localhost:3000/api/spotifyplayback?temp=playSong&trackId=${defaultTrackId}`,
      // );
      // console.log(`playSongResponse ok: ${playSongResponse.ok}`);
      // if (!playSongResponse.ok) {
      //   const text = await playSongResponse.text();
      //   throw new Error(
      //     `Unable to play songs on all devices: ${text} || status: ${playSongResponse.status}`,
      //   );
      // }
    }
    activate();
  }, [playerDevice?.device_id, props.serverAccessToken]);
  return null;
};
