import { AccessToken, SpotifyApi } from "@spotify/web-api-ts-sdk";
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
export const SpotifyDetails: React.VFC<{ serverAccessToken: AccessToken }> = ({ serverAccessToken }) => {
    const playerDevice = usePlayerDevice();

    useEffect(() => {
        async function activate() {
            if (playerDevice?.device_id === undefined || !serverAccessToken) return;
            await fetch(`https://api.spotify.com/v1/me/player`, {
                method: "PUT",
                body: JSON.stringify({ device_ids: [playerDevice.device_id], play: false }),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${serverAccessToken.access_token}`,
                },
            });
            await fetch("https://api.spotify.com/v1/me/player/play?device_id=" + playerDevice.device_id, {
                method: "PUT",
                body: JSON.stringify({ uris: ["spotify:track:1HYzRuWjmS9LXCkdVHi25K"] }),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${serverAccessToken.access_token}`
                }
            }).then(response => response.json())
                .then(data => console.log(data))
                .catch(error => console.error('Error:', error));
        }
        activate();
    }, [playerDevice?.device_id, serverAccessToken]);

    // useEffect(() => {
    //     async function activate() {
    //         const res = await fetch("/api/spotifyplayback?temp=accessToken");
    //         const serverAccessToken: AccessToken = await res.json();
    //         console.log(JSON.stringify(serverAccessToken));

    //         if (playerDevice?.device_id === undefined) return;
    //         console.log("REACHED!");
    //         await fetch(`https://api.spotify.com/v1/me/player`, {
    //             method: "PUT",
    //             body: JSON.stringify({ device_ids: [playerDevice.device_id], play: false }),
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 Authorization: `Bearer ${serverAccessToken.access_token}`,
    //             },
    //         });
    //         await fetch("https://api.spotify.com/v1/me/player/play?device_id=" + playerDevice.device_id, {
    //             method: "PUT",
    //             body: JSON.stringify({ uris: ["spotify:track:1HYzRuWjmS9LXCkdVHi25K"] }),
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 "Authorization": `Bearer ${serverAccessToken.access_token}`
    //             }
    //         }).then(response => response.json())
    //             .then(data => console.log(data))
    //             .catch(error => console.error('Error:', error));
    //     }
    //     activate();
    // }, [playerDevice?.device_id]);

    return null;
};
