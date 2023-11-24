import React from 'react';
import { Devices, Track } from '@spotify/web-api-ts-sdk';
import { useState } from 'react';
import { Button, FormLabel, Heading, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';

export default function SpotifyPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeDevices, setActiveDevices] = useState({} as Devices);
  const [trackId, setTrackId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track>({} as Track);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playSong, setPlaySong] = useState('');

  const handleSearch = async () => {
    if (searchQuery === '') return;
    const response = await fetch(
      `http://localhost:3000/api/spotifyplayback?temp=search&searchQuery=${searchQuery}`,
    );
    const results = await response.json();
    setSearchResults(results.tracks.items);
  };

  const handleSkip = async () => {
    const response = await fetch(`http://localhost:3000/api/spotifyplayback?temp=skip`);
    if (response.status === 204) {
      return;
    }
    const result = await response.json();
    setCurrentTrack(result);
  };

  const handleAddToQueue = async () => {
    if (trackId === '') return;
    const response = await fetch(
      `http://localhost:3000/api/spotifyplayback?temp=addQueue&trackId=${trackId}`,
    );
    const track = await response.json();
    setQueue([...queue, track]);
  };

  const handleTogglePlay = async () => {
    const response = await fetch(`http://localhost:3000/api/spotifyplayback?temp=togglePlay`);
    const currentlyPlaying = await response.json();
    setIsPlaying(currentlyPlaying);
  };

  const handlePlaySong = async () => {
    if (playSong === '') return;
    // const defaultTrackId = '1HYzRuWjmS9LXCkdVHi25K';
    const playSongResponse = await fetch(
      `http://localhost:3000/api/spotifyplayback?temp=playSong&trackId=${playSong}`,
    );
    console.log(`playSongResponse ok: ${playSongResponse.ok}`);
    if (!playSongResponse.ok) {
      const text = await playSongResponse.text();
      throw new Error(
        `Unable to play songs on all devices: ${text} || status: ${playSongResponse.status}`,
      );
    }
    const track = await playSongResponse.json();
    console.log(`playSongResponse ok: ${playSongResponse.ok} || body: ${track}`);
    setPlaySong('');
    // setCurrentTrack(track);
  };

  return (
    <>
      <iframe
        src={`https://open.spotify.com/embed/track/${currentTrack.id}?utm_source=generator&theme=0`}
        width='100%'
        height='352'
        allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'
        loading='lazy'></iframe>
      <Heading size='md'>Play Song</Heading>
      <div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FormLabel>Play Song</FormLabel>
          <input
            type='text'
            value={playSong}
            onChange={e => setPlaySong(e.target.value)}
            placeholder='Track ID'
          />
          <Button onClick={handlePlaySong}>Play</Button>
        </div>
      </div>
      <div>
        <Button onClick={handleTogglePlay}>{isPlaying ? 'Pause' : 'Play'}</Button>
        <Button
          onClick={async () => {
            await handleSkip();
          }}>
          Skip
        </Button>
      </div>
      <div>
        <Heading size='md'>Devices currently playing:</Heading>
        <ul>
          {activeDevices.devices
            ? activeDevices.devices.map(device => (
                <li key={device.id}>
                  {device.name}: {device.is_active ? 'Active' : 'Inactive'} | {device.type} |{' '}
                  {device.id}
                </li>
              ))
            : null}
        </ul>
      </div>

      <Heading size='md'>Queue</Heading>
      <div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FormLabel>Add to Queue</FormLabel>
          <input
            type='text'
            value={trackId}
            onChange={e => setTrackId(e.target.value)}
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
            {queue.map(track => (
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FormLabel>Search Tracks</FormLabel>
          <input
            type='text'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
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
              {searchResults.map(track => (
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
