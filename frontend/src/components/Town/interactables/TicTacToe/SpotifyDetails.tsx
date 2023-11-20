import { SpotifyApi } from "@spotify/web-api-ts-sdk";
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
export const SpotifyDetails: React.VFC<{ serverAccessToken: string }> = memo(
    ({ serverAccessToken }) => {
        const playbackState = usePlaybackState(true, 100);
        const playerDevice = usePlayerDevice();
        const errorState = useErrorState();
        const webPlaybackSDKReady = useWebPlaybackSDKReady();

        useEffect(() => {
            console.log(`Player Device ID: ${playerDevice?.device_id}`)
            if (playerDevice?.device_id === undefined) return;
            async function activate() {
                console.log("Access Token For SDK: " + serverAccessToken);
                if (playerDevice?.device_id === undefined) return;
                await fetch(`https://api.spotify.com/v1/me/player`, {
                    method: "PUT",
                    body: JSON.stringify({ device_ids: [playerDevice.device_id], play: false }),
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${serverAccessToken}`,
                    },
                });
                await fetch("https://api.spotify.com/v1/me/player/play?device_id=" + playerDevice.device_id, {
                    method: "PUT",
                    body: JSON.stringify({ uris: ["spotify:track:1HYzRuWjmS9LXCkdVHi25K"] }),
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + serverAccessToken
                    }
                }).then(response => response.json())
                    .then(data => console.log(data))
                    .catch(error => console.error('Error:', error));
            }
            activate();
        }, [playerDevice?.device_id]);

        return (
            <div>
                {/* Placeholder */}
            </div>
        );
    },
);
