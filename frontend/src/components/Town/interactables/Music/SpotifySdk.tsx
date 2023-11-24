import { Children, useCallback, useEffect } from "react";
import { WebPlaybackSDK } from "react-spotify-web-playback-sdk";
import { SpotifyDetails } from "./SpotifyDetails";
import SpotifyPlayback from "./SpotifyPlayback";
import { AccessToken } from "@spotify/web-api-ts-sdk";

// const response = await fetch (`https://localhost:3000/api/spotifyplayback?temp=transferPlayback&device_id=${playerDevice.device_id}`);
// console.log(`ok: ${response.ok}`);

const SpotifySdk: React.VFC<{ userAccessToken: AccessToken, serverAccessToken: AccessToken }> = ({ userAccessToken, serverAccessToken }) => {
    const getOAuthToken: Spotify.PlayerInit["getOAuthToken"] = useCallback(
        callback => callback(userAccessToken.access_token),
        [userAccessToken],
    );
    if (!userAccessToken || !serverAccessToken) {
        return <div>Not logged in || Host web sdk object not created</div>;
    } else {
        return (
            <WebPlaybackSDK
                initialDeviceName="Covey Player"
                getOAuthToken={getOAuthToken}
                connectOnInitialized={true}
                initialVolume={0.5}>
                <div >
                    <div>
                        <SpotifyDetails serverAccessToken={serverAccessToken}/>
                    </div>
                    <div>
                        {/* <SpotifyPlayer /> */}
                        <SpotifyPlayback />
                    </div>
                </div>
            </WebPlaybackSDK>
        );
    }
};

export default SpotifySdk;
