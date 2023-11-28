import React, { useEffect } from 'react';
import { Track } from '@spotify/web-api-ts-sdk';
import { useState } from 'react';
import { Box, Button, Heading, Input, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { MusicArea, QueuedTrack } from '../../../../types/CoveyTownSocket';
import MusicAreaController from '../../../../classes/interactable/MusicAreaController';

export default function SpotifyPlayback({
  musicController,
}: {
  musicController: MusicAreaController;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>({} as Track); // pull from backend instead of {}
  const [queue, setQueue] = useState<QueuedTrack[]>([]); // pull from backend instead of []

  const handleSearch = async () => {
    if (searchQuery === '') return;
    const searchResults = await musicController.searchSongs(searchQuery);
    
    if (searchResults) setSearchResults(searchResults);
  };

  const handleSkip = async () => {
    // Song Skip
    // We expect the properties 'currentSong' and 'songQueue' to change
    await musicController.skip();
  };

  const handleAddToQueue = async (trackId: string) => {
    await musicController.addToQueue(trackId);
  };

  const handleRemoveFromQueue = async (queueId: string) => {
    await musicController.removeFromQueue(queueId);
  };

  const handleTogglePlay = async () => {
    await musicController.togglePlay();
    setIsPlaying(!isPlaying);
  };

  // Listener effects
  /**
   *   currentSongChange: (song: Track | undefined) => void;
       currentQueueChange: (queue: QueuedTrack[] | undefined) => void;
   */
  useEffect(() => {
    musicController.addListener('currentQueueChange', setQueue);
    musicController.addListener('currentSongChange', setCurrentTrack);
    return () => {
      musicController.removeListener('currentQueueChange', setQueue);
      musicController.removeListener('currentSongChange', setCurrentTrack);
    };
  }, [musicController]);

  return (
    <Box p={4} bg='white' boxShadow='md' borderRadius='md' my={4}>
      {currentTrack !== null && (
        <iframe
          src={`https://open.spotify.com/embed/track/${currentTrack.id}?utm_source=generator&theme=0`}
          width='100%'
          height='200'
          allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'
          loading='lazy'
          style={{ borderRadius: '8px' }}
        />
      )}

      <Box my={4}>
        <Box display='flex' alignItems='center' justifyContent='center' gridGap={2}>
          <Button onClick={handleTogglePlay}>{isPlaying ? 'Toggle Pause' : '▶'}</Button>
          <Button onClick={handleSkip}> ⏭ </Button>
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
              <></>
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
                <Th></Th>
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
