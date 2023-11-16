import { useSpotifyPlayer } from "react-spotify-web-playback-sdk";
import { Button } from "@chakra-ui/react";

/*
  Represents the controls for a single player. Need to link this to webSDK
*/
export default function SpotifyPlayer() {
    const player = useSpotifyPlayer();

    if (player === null) return null;

    return (
        <div >
            <div>
                <div>
                    <Button onClick={() => player.previousTrack()}>
                        <code>player.previousTrack</code>
                    </Button>
                </div>
                <div>
                    <Button onClick={() => player.togglePlay()}>
                        <code>player.togglePlay</code>
                    </Button>
                </div>
                <div>
                    <Button onClick={() => player.nextTrack()}>
                        <code>player.nextTrack</code>
                    </Button>
                </div>
                <div>
                    <Button onClick={() => player.seek(10)}>
                        <code>player.seek(10)</code>
                    </Button>
                </div>
                <div>
                    <Button onClick={() => player.connect()}>
                        <code>player.connect</code>
                    </Button>
                </div>
                <div>
                    <Button onClick={() => player.disconnect()}>
                        <code>player.disconnect</code>
                    </Button>
                </div>
            </div>
        </div>
    );
};
