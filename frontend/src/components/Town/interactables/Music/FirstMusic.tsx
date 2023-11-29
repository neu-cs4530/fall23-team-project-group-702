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
import { InteractableID } from '../../../../types/CoveyTownSocket';
import MusicAreaController from '../../../../classes/interactable/MusicAreaController';
import { AccessToken } from '@spotify/web-api-ts-sdk';
import SpotifyPlayback from './SpotifyPlayback';
import { SpotifyDetails } from './SpotifyDetails';

/**
 * Jukebox Interface Component that handles rendering the join/create music session modal and the music playback interface modal.
 */
function FirstMusic({ interactableID }: { interactableID: InteractableID }): JSX.Element {
  const musicAreaController = useInteractableAreaController<MusicAreaController>(interactableID);
  const townController = useTownController();

  const [accessToken, setAccessToken] = useState<AccessToken | undefined>(
    townController.spotifyAccessToken,
  );
  const [sessionName, setSessionName] = useState<string>(musicAreaController.topic);
  const [sessionActive, setSessionActive] = useState<boolean>(
    musicAreaController.sessionInProgress,
  );

  useEffect(() => {
    musicAreaController.addListener('topicChange', setSessionName);
    musicAreaController.addListener('sessionInProgressChange', setSessionActive);
    musicAreaController.addListener('accessTokenChange', setAccessToken);
    return () => {
      musicAreaController.removeListener('topicChange', setSessionName);
      musicAreaController.removeListener('sessionInProgressChange', setSessionActive);
      musicAreaController.removeListener('accessTokenChange', setAccessToken);
    };
  }, [musicAreaController]);

  /**
   * Handles starting a music session with the session name.
   */
  const handleStartMusicSession = async () => {
    console.log('Starting music session');
    await musicAreaController.createSession(sessionName);
    setSessionActive(true);
  };

  if (!accessToken) {
    return <div>Not logged in</div>;
  }

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
        <div>{sessionName}</div>
        <>
          {accessToken ? (
            <>
              <div>
                <SpotifyPlayback musicController={musicAreaController} />
              </div>
              <SpotifyDetails userAccessToken={accessToken} musicController={musicAreaController} />
            </>
          ) : (
            <>User Access Tokens Not Loaded</>
          )}
        </>
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
  console.log('Rendering FirstMusicWrapper');
  const musicArea = useInteractable<MusicAreaInteractable>('musicArea');
  const townController = useTownController();

  const [isOpen, setIsOpen] = useState<boolean>(true); // not being properly cleaned up

  // // Whenever player wants to reopen interface
  // useEffect(() => {
  //   const handleInteract = () => {
  //     setIsOpen(true);
  //   };
  //   if (musicArea) {
  //     console.log('attempting to interact');
  //     musicArea.addListener('interact', handleInteract);
  //     return () => {
  //       musicArea.removeListener('interact', handleInteract);
  //     };
  //   }
  // }, [musicArea]);

  // Pause controller if interacting and modal is open
  useEffect(() => {
    if (isOpen && musicArea) {
      townController.pause();
    } else {
      townController.unPause();
    }
  }, [isOpen, musicArea, townController]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const handleReopen = useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  const handleLeaveSession = useCallback(async () => {
    if (musicArea) {
      console.log('handling leave session');
      townController.interactEnd(musicArea);
      const controller = townController.getMusicAreaController(musicArea);
      await controller.removeUserFromSession();
      if (!controller.sessionInProgress) {
        // Reset state if session ended
        setIsOpen(true);
      }
    }
  }, [musicArea, townController]);

  useEffect(() => {
    if (musicArea) {
      musicArea.addListener('leaveSession', handleLeaveSession);
      return () => {
        musicArea.removeListener('leaveSession', handleLeaveSession);
      };
    }
  });

  if (musicArea && musicArea.getType() === 'musicArea') {
    console.log('Rendering first music. isOpen: ' + isOpen);
    if (isOpen) {
      return (
        <Modal isOpen={true} onClose={closeModal} closeOnOverlayClick={false}>
          <ModalOverlay />
          <ModalContent>
            <ModalCloseButton />
            <FirstMusic interactableID={musicArea.id} />;
          </ModalContent>
        </Modal>
      );
    } else {
      return <Button onClick={handleReopen}>Open Music Player</Button>;
    }
  }
  return <></>;
}
