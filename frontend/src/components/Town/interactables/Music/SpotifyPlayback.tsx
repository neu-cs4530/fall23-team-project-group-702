import React, { useEffect } from 'react';
import { Track } from '@spotify/web-api-ts-sdk';
import { useState } from 'react';
import { Box, Button, Heading, Input, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { QueuedTrack } from '../../../../types/CoveyTownSocket';

export default function SpotifyPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track>({} as Track); // pull from backend instead of {}
  const [queue, setQueue] = useState<QueuedTrack[]>([]); // pull from backend instead of []

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
    setCurrentTrack(result.currentSong);
    setQueue(result.updatedQueue);
  };

  const handleAddToQueue = async (trackId: string) => {
    const response = await fetch(
      `http://localhost:3000/api/spotifyplayback?temp=addQueue&trackId=${trackId}`,
    );
    const updatedQueue = await response.json();
    setQueue(updatedQueue);
  };

  const handleRemoveFromQueue = async (queueId: string) => {
    const response = await fetch(
      `http://localhost:3000/api/spotifyplayback?temp=removeFromQueue&queueId=${queueId}`,
    );
    const updatedQueue = await response.json();
    setQueue(updatedQueue);
  };

  const handleTogglePlay = async () => {
    const response = await fetch(`http://localhost:3000/api/spotifyplayback?temp=togglePlay`);
    const currentlyPlaying = await response.json();
    setIsPlaying(currentlyPlaying);
  };

  useEffect(() => {
    console.log(JSON.stringify(currentTrack));
  }, [currentTrack]);

  return (
    <Box p={4} bg='white' boxShadow='md' borderRadius='md' my={4}>
      <iframe
        src={`https://open.spotify.com/embed/track/${currentTrack.id}?utm_source=generator&theme=0`}
        width='100%'
        height='200'
        allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'
        loading='lazy'
        style={{ borderRadius: '8px' }}
      />

      <Box my={4}>
        <Box display='flex' alignItems='center' gridGap={2}>
          <Button onClick={handleTogglePlay}>{isPlaying ? 'Toggle Pause' : 'Toggle Play'}</Button>
          <Button onClick={handleSkip}>Skip</Button>
        </Box>
      </Box>

      <Box my={4}>
        <Heading size='md' mb={2}>
          Current Queue
        </Heading>
        <Table variant='simple'>
          <Thead>
            <Tr>
              <Th>Artist</Th>
              <Th>Track Name</Th>
            </Tr>
          </Thead>
          <Tbody>
            {queue.length > 0 ? (
              queue.map(track => (
                <Tr key={track.queueId}>
                  <Td>{track.track.artists[0].name}</Td>
                  <Td>{track.track.name}</Td>
                  <Td>
                    <Button onClick={() => handleRemoveFromQueue(track.queueId)}>Remove</Button>
                  </Td>
                </Tr>
              ))
            ) : (
              <p>Blah</p>
            )}
          </Tbody>
        </Table>
      </Box>

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
      </Box>
    </Box>
  );
}
