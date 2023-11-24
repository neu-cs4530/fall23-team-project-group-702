/*
- Need to split frontend into components
- Ideally move spotify api stuff to the backend and add API route
- Ideally move code for creating new playback to new component
- 
- 
*/

import { SpotifyApi, UserProfile, SdkOptions, AuthorizationCodeWithPKCEStrategy, Devices, Track } from '@spotify/web-api-ts-sdk';
import { useEffect, useRef, useState } from 'react';
import { Button, FormLabel, Heading, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { useErrorState, usePlaybackState, usePlayerDevice, useSpotifyPlayer, useWebPlaybackSDKReady } from 'react-spotify-web-playback-sdk';
// import 'spotify-web-api-js'


/*

QUESTIONS: 
- How should we implement testing if this is linked to spotify API, do we only need to test frontend components?
- How is state managed? I saw useContext but it is not nearly as powerful as Redux. Are we allowed to install redux?
  - How does React maintain state across multiple browsers
*/


/*
A song should automatically move to the next song in the queue when the current song ends
If the current song ends and the queue doesn't exist 

 * We can have a web playback for each player, and when a player moves between interactable areas we can transfer the
playback. IDEA - if player leaves interactable area, pause the playback and remove the device from the list of 
active devices for the SDK of the player

*/

export default function SpotifyPlayback() {
    const [profile, setProfile] = useState({} as UserProfile);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeDevices, setActiveDevices] = useState({} as Devices);
    const [trackId, setTrackId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Track[]>([]);
    const [currentTrack, setCurrentTrack] = useState<Track>({} as Track);
    const [queue, setQueue] = useState<Track[]>([]);

    const handleSearch = async () => {
        // try {
        //     const results = await props.sdk.search(searchQuery, ["track"]);
        //     setSearchResults(results.tracks.items);
        // } catch (e) {
        //     console.error(e);
        // }
    };

    const handlePlayClick = async () => {
        // try {
        //     activeDevices.devices.forEach(async (device) => { await props.sdk.player.startResumePlayback(device.id as string); });
        //     setIsPlaying(true);
        // } catch (e) {
        //     console.error(e);
        // }
    };

    const handlePauseClick = async () => {
        // try {
        //     activeDevices.devices.forEach(async (device) => { await props.sdk.player.pausePlayback(device.id as string); });
        //     setIsPlaying(false);
        // } catch (e) {
        //     console.error(e);
        // }
    };

    const handleSkip = async () => {
        // if (queue.length < 1) {
        //     return;
        // }

        // const nextSong = queue[0];
        // await props.sdk.player.addItemToPlaybackQueue(`spotify:track:${nextSong.id}`);
        // await props.sdk.player.skipToNext(activeDevices.devices[0].id as string);
        // setCurrentTrack(nextSong);
        // const currentQueueWithoutFirst = queue.slice(1);
        // setQueue(currentQueueWithoutFirst);
    }

    const handleAddToQueue = async () => {
        // try {
        //     // await sdk.player.addItemToPlaybackQueue(`spotify:track:${trackId}`);
        //     // const currentQueue = await sdk.player.getUsersQueue()
        //     // setQueue(currentQueue.queue as Track[]);
        //     const track = await props.sdk.tracks.get(trackId);
        //     setQueue([...queue, track]);
        //     setTrackId("");
        // } catch (e) {
        //     throw new Error("Error adding track to queue");
        // }
    };

    // useEffect(() => {
    //     if (!props.sdk) {
    //         return;
    //     }

    //     if (playerDevice?.device_id === undefined) return;


    //     (async () => {


    //         const user = await props.sdk.currentUser.profile();
    //         setProfile(user);

    //         const currentDevices = await props.sdk.player.getAvailableDevices();
    //         // currentDevices.devices.forEach(async (device) => {
    //             // console.log("device: ", device.name, " is_active: ", device.is_active);
    //             // props.sdk.player.transferPlayback([device.id as string]);
    //         // })
    //         setActiveDevices(currentDevices)
    //         // setActiveDevices({ ...activeDevices, devices: currentDevices.devices.filter((device) => device.is_active) });
    //     })();
    // }, [props.sdk, playerDevice?.device_id]);

    return (
        <>
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
                        <li key={device.id}>
                            {device.name}: {device.is_active ? "Active" : "Inactive"} | {device.type} | {device.id}
                        </li>
                    )) : null}
                </ul>
            </div>
            <Heading size='md'>Queue</Heading>
            <div>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <FormLabel>Add to Queue</FormLabel>
                    <input
                        type="text"
                        value={trackId}
                        onChange={(e) => setTrackId(e.target.value)}
                        placeholder='Track ID'
                    />
                    <Button onClick={handleAddToQueue}>Add</Button>
                </div>
            </div>
            <Heading size='md'>Current Queue</Heading>
            <div>
                <Table>
                    <Thead>
                        <Tr>
                            <Th>Artist</Th>
                            <Th>Track Name</Th>
                            <Th>Track ID</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {queue.map((track) => (
                            <Tr key={track.id}>
                                <Td>{track.artists[0].name}</Td>
                                <Td>{track.name}</Td>
                                <Td>{track.id}</Td>
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
                                <Th>Track ID</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {searchResults.map((track) => (
                                <Tr key={track.id}>
                                    <Td>{track.artists[0].name}</Td>
                                    <Td>{track.name}</Td>
                                    <Td>{track.id}</Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                )}
            </div>
        </>
    );
}