import { useSpotifyPlayer } from "react-spotify-web-playback-sdk";
import SpotifyPlayback from "./SpotifyPlayback";

/*
    *** NECESSARY TO SET DEVICE TO ACTIVE ***
  Represents the controls for a single player. Need to link this to webSDK
*/
export default function SpotifyPlayer() {
    const player = useSpotifyPlayer();

    if (player === null) return null;

    return (
        <div >
            <SpotifyPlayback />
        </div>
    );
};
