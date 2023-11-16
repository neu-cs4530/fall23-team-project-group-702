import { memo, useEffect } from "react";
import {
    usePlaybackState,
    usePlayerDevice,
    useErrorState,
    useWebPlaybackSDKReady,
} from "react-spotify-web-playback-sdk";

/*
  Every player should have their own playback device upon entering Covey.Town. We should move this logic
  out of the component eventually.
*/
export const SpotifyDetails: React.VFC<{ access_token: string }> = memo(
    ({ access_token }) => {
        const playbackState = usePlaybackState(true, 100);
        const playerDevice = usePlayerDevice();
        const errorState = useErrorState();
        const webPlaybackSDKReady = useWebPlaybackSDKReady();

        useEffect(() => {
            if (playerDevice?.device_id === undefined) return;

            fetch(`https://api.spotify.com/v1/me/player`, {
                method: "PUT",
                body: JSON.stringify({ device_ids: [playerDevice.device_id], play: false }),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${access_token}`,
                },
            });
        }, [playerDevice?.device_id]);

        return (
            <div>
                Placeholder
            </div>
        );
    },
);
