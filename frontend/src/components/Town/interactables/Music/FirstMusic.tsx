import React from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  VStack,
} from '@chakra-ui/react';
import { useInteractable } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import MusicAreaInteractable from '../MusicArea';
import { useCallback, useEffect, useState } from 'react';
import SpotifyMain from './SpotifyMain';

/**
 * Jukebox Interface Component that handles rendering the join/create music session modal and the music playback interface modal.
 */
export default function FirstMusic(): JSX.Element {
  const musicArea = useInteractable<MusicAreaInteractable>('musicArea');
  const townController = useTownController();

  const [sessionName, setSessionName] = useState<string>('');
  const [sessionActive, setSessionActive] = useState<boolean>(false); // TODO should use environment by default

  const isOpen = musicArea !== undefined;

  useEffect(() => {
    if (musicArea) {
      townController.pause();
    } else {
      townController.unPause();
    }
  }, [townController, musicArea]);

  const closeModal = useCallback(() => {
    if (musicArea) {
      townController.interactEnd(musicArea);
      // setIsVisible(false);
    }
  }, [townController, musicArea]);

  const handleStartMusicSession = () => {
    setSessionActive(true);
  };

  if (musicArea && musicArea.getType() === 'musicArea') {
    console.log('Rendering first music');
    if (!sessionActive) {
      return (
        <Modal isOpen={isOpen} onClose={closeModal} closeOnOverlayClick={false}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Start a Music Session</ModalHeader>
            <ModalCloseButton />
            <VStack spacing={3} align='stretch' p={3}>
              <Box textAlign='center'>Open Lounge Jukebox 1</Box>
              <form>
                <FormControl display='flex' flexDirection='column' alignItems='center'>
                  {' '}
                  <FormLabel htmlFor='name' mb={2}>
                    Name of Music Session
                  </FormLabel>{' '}
                  <Input
                    id='name'
                    placeholder='What are the vibes?'
                    name='name'
                    value={sessionName}
                    onChange={e => setSessionName(e.target.value)}
                    w='70%'
                  />
                </FormControl>
              </form>
              <Button
                colorScheme='pink'
                w='50%'
                alignSelf='center'
                onClick={handleStartMusicSession}>
                Create session
              </Button>
            </VStack>
          </ModalContent>
        </Modal>
      );
    } else {
      return (
        <Modal
          isOpen={isOpen}
          onClose={() => {
            closeModal();
            setSessionActive(false); // TODO should be based on when owner closes
            townController.unPause();
          }}
          closeOnOverlayClick={false}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{sessionName}</ModalHeader>
            <ModalCloseButton />
            <SpotifyMain />
          </ModalContent>
        </Modal>
      );
    }
  }
  return <></>;
}
