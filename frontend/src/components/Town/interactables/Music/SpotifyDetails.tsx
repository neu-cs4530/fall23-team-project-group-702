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
      const response = await fetch(
        `http://localhost:3000/api/spotifyplayback?temp=transferPlayback&deviceId=${playerDevice.device_id}`,
      );
      if (!response.ok) {
        throw new Error('Unable to transfer playback to player device');
      }

      const response2 = await fetch(
        'https://api.spotify.com/v1/me/player/play?device_id=' + playerDevice.device_id,
        {
          method: 'PUT',
          body: JSON.stringify({ uris: ['spotify:track:1HYzRuWjmS9LXCkdVHi25K'] }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${props.serverAccessToken.access_token}`,
          },
        },
      );
      console.log(`response2: ${response2.ok}`);
      console.log(JSON.stringify(response2));
    }
    activate();
  }, [playerDevice?.device_id, props.serverAccessToken]);
  return null;
};
