import React from 'react';
import { Track } from '@spotify/web-api-ts-sdk';
import { useState } from 'react';
import {
  Box,
  Button,
  FormLabel,
  Heading,
  Input,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';

export default function SpotifyPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
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
    setTrackId('');
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
    <Box p={4} bg='white' boxShadow='md' borderRadius='md' my={4}>
      <iframe
        src={`https://open.spotify.com/embed/track/${currentTrack.id}?utm_source=generator&theme=0`}
        width='100%'
        height='352'
        allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'
        loading='lazy'
        style={{ borderRadius: '8px' }}
      />
      <Box my={4}>
        <Heading size='md' mb={2}>
          Play Song
        </Heading>
        <Box display='flex' alignItems='center' gridGap={2}>
          <Input
            id='playSong'
            type='text'
            value={playSong}
            onChange={e => setPlaySong(e.target.value)}
            placeholder='Paste Track ID here'
          />
          <Button onClick={handlePlaySong}>Play now</Button>
        </Box>
      </Box>

      <Box my={4}>
        <Box display='flex' alignItems='center' gridGap={2}>
          <Button onClick={handleTogglePlay}>{isPlaying ? 'Toggle Pause' : 'Toggle Play'}</Button>
          <Button onClick={handleSkip}>Skip</Button>
        </Box>
      </Box>

      <Box my={4}>
        <Heading size='md' mb={2}>
          Queue
        </Heading>
        <Box display='flex' alignItems='center' gridGap={2}>
          <Input
            id='addQueue'
            type='text'
            value={trackId}
            onChange={e => setTrackId(e.target.value)}
            placeholder='Paste Track ID here'
          />
          <Button onClick={handleAddToQueue}>Add</Button>
        </Box>
      </Box>

      {queue.length > 0 && (
        <Box my={4}>
          <Heading size='md' mb={2}>
            Current Queue
          </Heading>
          <Table variant='simple'>
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
        </Box>
      )}

      <Box my={4}>
        <Heading size='md' mb={2}>
          Search
        </Heading>
        <Box display='flex' alignItems='center' gridGap={2}>
          <Input
            id='searchTracks'
            type='text'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder='Search for songs or artist'
          />
          <Button onClick={handleSearch}>Search</Button>
        </Box>
        {searchResults.length > 0 && (
          <Table variant='simple' mt={3}>
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
                  <Td>{track.artists.map(artist => artist.name).join(', ')}</Td>
                  <Td>{track.name}</Td>
                  <Td>{track.id}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
    </Box>
  );
}
