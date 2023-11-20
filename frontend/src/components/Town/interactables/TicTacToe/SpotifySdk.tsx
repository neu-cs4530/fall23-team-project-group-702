import { Children, useCallback } from "react";
import { WebPlaybackSDK } from "react-spotify-web-playback-sdk";
import SpotifyPlayer from "./SpotifyPlayer";
import { SpotifyDetails } from "./SpotifyDetails";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import SpotifyPlayback from "./SpotifyPlayback";

type Props = {
    token: string,
    sdk: SpotifyApi
};

const SpotifySdk: React.VFC<Props> = ({ token, sdk }) => {
    const getOAuthToken: Spotify.PlayerInit["getOAuthToken"] = useCallback(
        callback => callback(token),
        [token],
    );

    return (
        <WebPlaybackSDK
            initialDeviceName="Covey Player"
            getOAuthToken={getOAuthToken}
            connectOnInitialized={true}
            initialVolume={0.5}>
            <div >
                <div>
                    <SpotifyDetails sdk={sdk} />
                </div>
                <div>
                    <SpotifyPlayer sdk={sdk}/>
                </div>
            </div>
        </WebPlaybackSDK>
    );
};

export default SpotifySdk;
