import { useSpotifyPlayer } from "react-spotify-web-playback-sdk";
import { Button } from "@chakra-ui/react";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import SpotifyPlayback from "./SpotifyPlayback";
import { useEffect } from "react";

/*
    *** NECESSARY TO SET DEVICE TO ACTIVE ***
  Represents the controls for a single player. Need to link this to webSDK
*/
export default function SpotifyPlayer(props: { sdk: SpotifyApi }) {
    const player = useSpotifyPlayer();

    if (player === null) return null;

    // useEffect(() => {
    //     async function activate() {
    //         if (player === null) return;
    //         await fetch("https://api.spotify.com/v1/me/player/play?device_id=" + player._options.id, {
    //             method: "PUT",
    //             body: JSON.stringify({ uris: ["spotify:track:5ya2gsaIhTkAuWYEMB0nw5"] }),
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 "Authorization": "Bearer " + await props.sdk.getAccessToken()
    //             }
    //         }).then(response => response.json())
    //             .then(data => console.log(data))
    //             .catch(error => console.error('Error:', error));
    //     }
    //     activate();
    // }, [player]);


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
                    <Button onClick={async () => {
                        const pos = await player.getCurrentState();
                        if (pos === null) return;
                        player.seek(pos.position + 10000);
                    }}>
                        <code>+10s</code>
                    </Button>
                    <Button onClick={async () => {
                        const pos = await player.getCurrentState();
                        if (pos === null) return;
                        player.seek(pos.position - 10000);
                    }}>
                        <code>-10s</code>
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
            <SpotifyPlayback sdk={props.sdk} />
        </div>
    );
};
