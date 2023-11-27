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
  ModalOverlay,
  VStack,
} from '@chakra-ui/react';
import { useInteractable, useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import MusicAreaInteractable from '../MusicArea';
import { useCallback, useEffect, useState } from 'react';
import SpotifyMain from './SpotifyMain';
import { InteractableID } from '../../../../types/CoveyTownSocket';
import MusicAreaController from '../../../../classes/interactable/MusicAreaController';

/**
 * Jukebox Interface Component that handles rendering the join/create music session modal and the music playback interface modal.
 */
function FirstMusic({ interactableID }: { interactableID: InteractableID }): JSX.Element {
  const musicAreaController = useInteractableAreaController<MusicAreaController>(interactableID);
  const townController = useTownController();

  const [sessionName, setSessionName] = useState<string>(musicAreaController.topic);
  const [sessionActive, setSessionActive] = useState<boolean>(
    musicAreaController.sessionInProgress,
  );

  // mocking what start music session, should acc use gameAreaController to send interactableCommand to backend
  const handleStartMusicSession = () => {
    // townController.sendInteractableCommand;
    setSessionActive(true); // backend call townController.sendInteract
  };

  if (!sessionActive) {
    return (
      <div>
        <b>Start a Music Session</b>
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
          <Button colorScheme='pink' w='50%' alignSelf='center' onClick={handleStartMusicSession}>
            Create session
          </Button>
        </VStack>
      </div>
    );
  } else {
    return (
      <div>
        {sessionName}
        <SpotifyMain />
      </div>
    );
  }
}

/**
 * A wrapper component for the TicTacToeArea component.
 * Determines if the player is currently in a tic tac toe area on the map, and if so,
 * renders the TicTacToeArea component in a modal.
 *
 */
export default function FirstMusicWrapper(): JSX.Element {
  const musicArea = useInteractable<MusicAreaInteractable>('musicArea');
  const townController = useTownController();

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

  if (musicArea && musicArea.getType() === 'musicArea') {
    console.log('Rendering first music');
    return (
      <Modal isOpen={true} onClose={closeModal} closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <FirstMusic interactableID={musicArea.id} />;
        </ModalContent>
      </Modal>
    );
  }
  return <></>;
}
