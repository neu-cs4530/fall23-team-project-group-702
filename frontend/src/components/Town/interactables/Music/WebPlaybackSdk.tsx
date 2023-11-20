// import { useCallback } from "react";
// import { WebPlaybackSDK } from "react-spotify-web-playback-sdk";
// import { SpotifyPlayer } from "./SpotifyPlayer";


// export default function WebPlayback(props: { token: string }) {
//     const getOAuthToken = useCallback(callback => callback(props.token), []);

//     return (
//         <WebPlaybackSDK
//             initialDeviceName="My awesome Spotify app"
//             getOAuthToken={getOAuthToken}
//             initialVolume={0.5}
//             connectOnInitialized={true}>
//             <SpotifyPlayer />
//         </WebPlaybackSDK>
//     );
// };

declare global {
  interface Window {
      onSpotifyWebPlaybackSDKReady: () => void;
  }
}
import { Button, chakra, Container, useToast } from '@chakra-ui/react';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import React, { useEffect } from 'react';


const track = {
  name: "",
  album: {
      images: [
          { url: "" }
      ]
  },
  artists: [
      { name: "" }
  ]
}

export default function WebPlayback(props: { token: string,  sdk: SpotifyApi}) {

  const useState = React.useState;
  const [is_paused, setPaused] = useState(false);
  const [is_active, setActive] = useState(false);
  const [player, setPlayer] = useState(null as Spotify.Player | null);
  const [current_track, setTrack] = useState(track);

  useEffect(() => {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;

      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
          const player = new window.Spotify.Player({
              name: 'Web Playback SDK',
              getOAuthToken: cb => { cb(props.token); },
              volume: 0.5
          });

          setPlayer(player);

          player.addListener('ready', ({ device_id }) => {
              console.log('Ready with Device ID', device_id);
          });

          player.addListener('not_ready', ({ device_id }) => {
              console.log('Device ID has gone offline', device_id);
          });

          player.addListener('player_state_changed', (state => {

              if (!state) {
                  return;
              }

              setTrack(state.track_window.current_track);
              setPaused(state.paused);

              player.getCurrentState().then(state => {
                  console.log(`STATE: ${JSON.stringify(state)}`)
                  return (!state) ? setActive(false) : setActive(true)
              });

          }));

          player.connect().then(state => {
              console.log(`state.valueOf: ${state.valueOf()}`)
          });

      };
  }, [props.token]);

  if (!is_active) {
      return (
          <>
              <div className="container">
                  <div className="main-wrapper">
                      <b> Instance not active. Transfer your playback using your Spotify app </b>
                      {/* {JSON.stringify(player)} */}
                      {/* {`props.token: ${props.token}`} */}
                  </div>
              </div>
          </>)
  } else {
      return (
          <>
              <div className="container">
                  <div className="main-wrapper">

                      <img src={current_track.album.images[0].url} className="now-playing__cover" alt="" />

                      <div className="now-playing__side">
                          <div className="now-playing__name">{current_track.name}</div>
                          <div className="now-playing__artist">{current_track.artists[0].name}</div>

                          <Button className="btn-spotify" onClick={() => { player?.previousTrack() }} >
                              &lt;&lt;
                          </Button>

                          <Button className="btn-spotify" onClick={() => { player?.togglePlay() }} >
                              {is_paused ? "PLAY" : "PAUSE"}
                          </Button>

                          <Button className="btn-spotify" onClick={() => { player?.nextTrack() }} >
                              &gt;&gt;
                          </Button>
                      </div>
                  </div>
              </div>
          </>
      );
  }
}