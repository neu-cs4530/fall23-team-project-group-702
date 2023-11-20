import { Children, useCallback, useEffect } from "react";
import { WebPlaybackSDK } from "react-spotify-web-playback-sdk";
import SpotifyPlayer from "./SpotifyPlayer";
import { SpotifyDetails } from "./SpotifyDetails";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import SpotifyPlayback from "./SpotifyPlayback";

type Props = {
    userAccessToken: string,
    sdk: SpotifyApi,
    serverAccessToken: string,
};

const SpotifySdk: React.VFC<Props> = ({ userAccessToken, sdk, serverAccessToken }) => {
    const getOAuthToken: Spotify.PlayerInit["getOAuthToken"] = useCallback(
        callback => callback(userAccessToken),
        [userAccessToken],
    );

    useEffect(() => {
        console.log(`SpotifySdk: ${serverAccessToken} | UserAccesstoken: ${userAccessToken}`)
    }, []);

    return (
        <WebPlaybackSDK
            initialDeviceName="Covey Player"
            getOAuthToken={getOAuthToken}
            connectOnInitialized={true}
            initialVolume={0.5}>
            <div >
                <div>
                    <SpotifyDetails serverAccessToken={serverAccessToken} />
                </div>
                <div>
                    <SpotifyPlayer sdk={sdk} />
                </div>
            </div>
        </WebPlaybackSDK>
    );
};

export default SpotifySdk;
