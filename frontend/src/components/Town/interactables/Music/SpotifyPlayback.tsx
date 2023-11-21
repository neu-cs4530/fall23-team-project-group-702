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
import { uniqueId } from 'lodash';
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

// Uniquely-identifiable Track added to a Spotify Playback Queue
interface QueuedTrack {
    queueId: string
    track: Track
}

export default function SpotifyPlayback(props: { clientId: string, redirectUrl: string, scopes: string[], config?: SdkOptions }) {
    const [sdk, setSdk] = useState<SpotifyApi | null>(null);
    const { current: activeScopes } = useRef(props.scopes);
    // const [accessToken, setAccessToken] = useState("");
    const [profile, setProfile] = useState({} as UserProfile);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeDevices, setActiveDevices] = useState({} as Devices);
    // const [trackId, setTrackId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Track[]>([]);
    const [currentTrack, setCurrentTrack] = useState<Track>({} as Track);
    const [queue, setQueue] = useState<QueuedTrack[]>([]);
    const [progressMs, setProgressMs] = useState(0);
    // const [player, setPlayer] = useState(null as Spotify.Player | null);

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
            setSearchQuery('');
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

        try {
            // When there's no more songs in queue
            if (queue.length < 1) {
                console.log('Error: Queue empty');
                // If there's still a current song set, clear it and pause
                if (currentTrack.id) {
                    setCurrentTrack({} as Track);
                    handlePauseClick();
                }
                return;
            }

            const nextSong = queue[0];
            await sdk.player.addItemToPlaybackQueue(`spotify:track:${nextSong.track.id}`);
            activeDevices.devices.forEach(async (device) => { // will throw multiple 502 error because only one device is playing
                await sdk.player.skipToNext(device.id as string); 
                setIsPlaying(true); // skipToNext() autoplays
            })
            setCurrentTrack(nextSong.track);
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
            const queuedTrack: QueuedTrack = {
                queueId: uniqueId(),
                track: track
            };
            setQueue([...queue, queuedTrack]);
        } catch (e) {
            throw new Error("Error adding track to queue");
        }
    };

    // Set the currentTrack from the queue, if not empty
    useEffect(() => {
        // if currentTrack not set, initialize to first in queue
        if (queue.length > 0 && !currentTrack.id) {
            console.log('preloading first song')
            handleSkip();
        }
    }, [queue])

    const handleRemoveFromQueue = async (queueId: string) => {
        if (!sdk) {
            return;
        }

        try {
            const newQueue = queue.filter((item) => item.queueId !== queueId)
            setQueue(newQueue);
        } catch (e) {
            throw new Error("Error removing track from queue");
        }
    }

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
            // const clientToken = await sdk.getAccessToken();
            // if (!clientToken) {
                // throw new Error("Authentication failed");
            // }
            // setAccessToken(clientToken.access_token);
            setProfile(user);

            const allDevices = await sdk.player.getAvailableDevices();
            setActiveDevices({devices: allDevices.devices.filter((device) => device.is_active)});
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
                            <Tr key={track.queueId}>
                                <Td>{track.track.artists[0].name}</Td>
                                <Td>{track.track.name}</Td>
                                <Td>
                                    <Button onClick={() => handleRemoveFromQueue(track.queueId)}>Remove</Button>
                                </Td>
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
                                    <Td>
                                        <Button onClick={() => handleAddToQueue(track.id)}>Add</Button>
                                    </Td>
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