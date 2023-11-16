import { useCallback } from "react";
import { WebPlaybackSDK } from "react-spotify-web-playback-sdk";
import SpotifyPlayer from "./SpotifyPlayer";
import {SpotifyDetails} from "./SpotifyDetails";

// const SPOTIFY_API_TOKEN_URL = "https://accounts.spotify.com/api/token";
// const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID as string;
// const SPOTIFY_CLIENT_SECRET = process.env.NEXT_SPOTIFY_CLIENT_SECRET as string;
// const SPOTIFY_REDIRECT_URI = "http://localhost:3000/callback/";

type Props = { token: string };

const SpotifySdk: React.VFC<Props> = ({ token }) => {
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
                    <SpotifyPlayer />
                </div>
                <div>
                    <SpotifyDetails access_token={token} />
                </div>
            </div>
        </WebPlaybackSDK>
    );
};

export default SpotifySdk;
