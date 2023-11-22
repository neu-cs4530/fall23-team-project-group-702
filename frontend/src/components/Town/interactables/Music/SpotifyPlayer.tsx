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

    return (
        <div >
            <div>
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
            </div>
            <SpotifyPlayback sdk={props.sdk} />
        </div>
    );
};
