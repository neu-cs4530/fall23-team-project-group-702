/*
- Need to split frontend into components
- Ideally move spotify api stuff to the backend and add API route
- Ideally move code for creating new playback to new component
- 
- 
*/

import { SpotifyApi, UserProfile, SdkOptions, AuthorizationCodeWithPKCEStrategy, Devices, Track } from '@spotify/web-api-ts-sdk';
import { useEffect, useRef, useState } from 'react';
import WebPlayback from './WebPlaybackSdk';
import { Button, FormLabel, Heading, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
// import 'spotify-web-api-js'

/*
A song should automatically move to the next song in the queue when the current song ends
If the current song ends and the queue doesn't exist 
*/

declare global {
    interface Window {
        onSpotifyWebPlaybackSDKReady: () => void;
    }
}

export default function SpotifyPlayback(props: { clientId: string, redirectUrl: string, scopes: string[], config?: SdkOptions }) {
    const [sdk, setSdk] = useState<SpotifyApi | null>(null);
    const { current: activeScopes } = useRef(props.scopes);
    const [accessToken, setAccessToken] = useState("");
    const [profile, setProfile] = useState({} as UserProfile);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeDevices, setActiveDevices] = useState({} as Devices);
    const [trackId, setTrackId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Track[]>([]);
    const [currentTrack, setCurrentTrack] = useState<Track>({} as Track);
    const [queue, setQueue] = useState<Track[]>([]);
    const [progressMs, setProgressMs] = useState(0);
    const [player, setPlayer] = useState(null as Spotify.Player | null);

    useEffect(() => {
        if (!accessToken || !sdk) return;
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;

        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = async () => {
            const spotifyPlayer = new window.Spotify.Player({
                name: 'Web Playback SDK',
                getOAuthToken: cb => { cb(accessToken); },
                volume: 0.5
            });

            setPlayer(spotifyPlayer);
            // if (!player) {
            //     throw new Error("Player not initialized");
            // };

            spotifyPlayer.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
            });

            spotifyPlayer.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });

            await spotifyPlayer.connect();

            // console.log("player: ", player?._options.id)
            if (!spotifyPlayer) return;
            // console.log("using player: ", spotifyPlayer._options.id);
            /*
            Transferring the playback to the Web SDK
            */
            await fetch(`https://api.spotify.com/v1/me/player`, {
                method: "PUT",
                body: JSON.stringify({ device_ids: [spotifyPlayer._options.id], play: false }),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            // await sdk.player.transferPlayback([spotifyPlayer._options.id], true);
            await spotifyPlayer.activateElement();
            const state = await spotifyPlayer.getCurrentState();

            console.log(`state: ${JSON.stringify(state)}`)

            spotifyPlayer._options.enableMediaSession = true;
            console.log(`options ${JSON.stringify(spotifyPlayer._options.enableMediaSession)}`)

            return () => {
                spotifyPlayer.disconnect();
                document.body.removeChild(script);
            };
        };
    }, [accessToken]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (isPlaying) {
                setProgressMs((prevProgressMs) => prevProgressMs + 1000);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying]);

    useEffect(() => {
        async function check() {
            if (currentTrack.duration_ms && progressMs >= currentTrack.duration_ms) {
                await handleSkip();
            }
        }
        check();
    }, [currentTrack, progressMs]);

    const handleSearch = async () => {
        if (!sdk) {
            return;
        }

        try {
            const results = await sdk.search(searchQuery, ["track"]);
            setSearchResults(results.tracks.items);
        } catch (e) {
            console.error(e);
        }
    };

    const handlePlayClick = async () => {
        if (!sdk) {
            return;
        }

        try {
            activeDevices.devices.forEach(async (device) => { await sdk.player.startResumePlayback(device.id as string); }); // will throw multiple 502 error because only one device is playing
            setIsPlaying(true);
        } catch (e) {
            console.error(e);
        }
    };

    const handlePauseClick = async () => {
        if (!sdk) {
            return;
        }

        try {
            activeDevices.devices.forEach(async (device) => { 
                await sdk.player.pausePlayback(device.id as string); 
                console.log('paused ' + device.name);
            });
            setIsPlaying(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSkip = async () => {
        if (!sdk) {
            throw new Error('SDK not created');
        }
        if (queue.length < 1) {
            return;
        }

        try {
            const nextSong = queue[0];
            await sdk.player.addItemToPlaybackQueue(`spotify:track:${nextSong.id}`);
            activeDevices.devices.forEach(async (device) => { // will throw multiple 502 error because only one device is playing
                await sdk.player.skipToNext(device.id as string); 
            })
            setCurrentTrack(nextSong);
            const currentQueueWithoutFirst = queue.slice(1);
            setQueue(currentQueueWithoutFirst);
        } catch (e) {
            console.error(e);
        }
    }

    const handleAddToQueue = async (trackId: string) => {
        if (!sdk) {
            return;
        }

        try {
            // await sdk.player.addItemToPlaybackQueue(`spotify:track:${trackId}`);
            // const currentQueue = await sdk.player.getUsersQueue()
            // setQueue(currentQueue.queue as Track[]);
            const track = await sdk.tracks.get(trackId);
            setQueue([...queue, track]);
        } catch (e) {
            throw new Error("Error adding track to queue");
        }
    };

    useEffect(() => {
        (async () => {
            const auth = new AuthorizationCodeWithPKCEStrategy(props.clientId, props.redirectUrl, activeScopes);
            const internalSdk = new SpotifyApi(auth, props.config);

            try {
                const { authenticated } = await internalSdk.authenticate();

                if (authenticated) {
                    setSdk(() => internalSdk);
                }
            } catch (e: Error | unknown) {

                const error = e as Error;
                if (error && error.message && error.message.includes("No verifier found in cache")) {
                    console.error("If you are seeing this error in a React Development Environment it's because React calls useEffect twice. Using the Spotify SDK performs a token exchange that is only valid once, so React re-rendering this component will result in a second, failed authentication. This will not impact your production applications (or anything running outside of Strict Mode - which is designed for debugging components).", error);
                } else {
                    console.error(e);
                }
            }

        })();
    }, [props.clientId, props.redirectUrl, props.config, activeScopes]);

    useEffect(() => {
        if (!sdk) {
            return;
        }

        (async () => {
            const user = await sdk.currentUser.profile();
            const clientToken = await sdk.getAccessToken();
            if (!clientToken) {
                throw new Error("Authentication failed");
            }
            setAccessToken(clientToken.access_token);
            setProfile(user);

            const currentDevices = await sdk.player.getAvailableDevices();
            currentDevices.devices.forEach(async (device) => {
                console.log("device: ", device.name, " is_active: ", device.is_active);
                device.is_active = true;
            })
            setActiveDevices(currentDevices)
            // setActiveDevices({ ...activeDevices, devices: currentDevices.devices.filter((device) => device.is_active) });
        })();
    }, [sdk]);

    return (
        <>
            {/* <iframe
                src="https://open.spotify.com/embed/track/4JzCFEc3O2UEdjKzevvFH5?utm_source=generator&theme=0"
                width="100%" height="352"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy">
            </iframe> */}
            <iframe
                src={`https://open.spotify.com/embed/track/${currentTrack.id}?utm_source=generator&theme=0`}
                width="100%" height="352"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy">
            </iframe>
            {profile.display_name}
            <div>
                <Button onClick={isPlaying ? handlePauseClick : handlePlayClick}>
                    {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button onClick={async () => { await handleSkip(); }}>
                    Skip
                </Button>
            </div>
            <div>
                <Heading size='md'>Devices currently playing:</Heading>
                <ul>
                    {activeDevices.devices ? activeDevices.devices.map(device => (
                        <li key={device.id}>{device.name}</li>
                    )) : null}
                </ul>
            </div>
            <Heading size='md'>Current Queue</Heading>
            <div>
                <Table>
                    <Thead>
                        <Tr>
                            <Th>Artist</Th>
                            <Th>Track Name</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {queue.map((track) => (
                            <Tr key={track.id}>
                                <Td>{track.artists[0].name}</Td>
                                <Td>{track.name}</Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </div>
            <Heading size='md'>Search</Heading>
            <div>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <FormLabel>Search Tracks</FormLabel>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Search query'
                    />
                    <Button onClick={handleSearch}>Search</Button>
                </div>
                {searchResults.length > 0 && (
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>Artists</Th>
                                <Th>Track Name</Th>
                                <Th>Queue</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {searchResults.map((track) => (
                                <Tr key={track.id}>
                                    <Td>{track.artists[0].name}</Td>
                                    <Td>{track.name}</Td>
                                    <Button onClick={() => handleAddToQueue(track.id)}>Add</Button>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                )}
            </div>
            {/* <WebPlayback token={token} /> */}
        </>
    );
}