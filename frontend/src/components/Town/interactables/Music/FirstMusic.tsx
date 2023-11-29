import React from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  toast,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useInteractable, useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import MusicAreaInteractable from '../MusicArea';
import PrivateMusicAreaInteractable from '../PrivateMusicArea';
import { useCallback, useEffect, useState } from 'react';
import { InteractableID } from '../../../../types/CoveyTownSocket';
import MusicAreaController from '../../../../classes/interactable/MusicAreaController';
import { AccessToken } from '@spotify/web-api-ts-sdk';
import SpotifyPlayback from './SpotifyPlayback';
import { SpotifyDetails } from './SpotifyDetails';
import PrivateMusicAreaController from '../../../../classes/interactable/PrivateMusicAreaController';

/**
 * Jukebox Interface Component that handles rendering the join/create music session modal and the music playback interface modal.
 */
function FirstMusic({ interactableID }: { interactableID: InteractableID }): JSX.Element {
  const musicAreaController = useInteractableAreaController<MusicAreaController>(interactableID);
  const privateMusicAreaController = musicAreaController as PrivateMusicAreaController;
  const townController = useTownController();

  const [accessToken, setAccessToken] = useState<AccessToken | undefined>(
    townController.spotifyAccessToken,
  );
  const [sessionName, setSessionName] = useState<string>(musicAreaController.topic);
  const [sessionActive, setSessionActive] = useState<boolean>(
    musicAreaController.sessionInProgress,
  );
  const [isPrivate, setIsPrivate] = useState<boolean>(privateMusicAreaController.isPrivateSession);

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

  useEffect(() => {
    const privateController = musicAreaController as PrivateMusicAreaController;
    privateController.addListener('roomVisibilityChange', setIsPrivate);
    return () => {
      musicAreaController.removeListener('roomVisibilityChange', setIsPrivate);
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

  const handleSetPrivacyState = async () => {
    const privateController = musicAreaController as PrivateMusicAreaController;
    // Emit to all controllers
    privateController.setPrivacy(!privateController.isPrivateSession);

    // Set for this controller
    setIsPrivate(!privateController.isPrivateSession);
  };

  if (!accessToken) {
    return <div>Not logged in</div>;
  }

  if (!sessionActive) {
    return (
      <div>
        <Box mt={4}>
          <VStack spacing={6} align='stretch' p={3}>
            <Box textAlign='center'>You found an Open Lounge Jukebox!</Box>
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
        </Box>
      </div>
    );
  } else {
    return (
      <div>
        <Heading as='h2' size='lg' textAlign='center' my={4}>
          {sessionName}
        </Heading>
        <Box textAlign='center'>
          {
            <Button onClick={handleSetPrivacyState}>
              {isPrivate ? 'Unlock Area' : 'Lock Area'}
            </Button>
          }
        </Box>
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

function isValidMusicAreaType(areaType: string): boolean {
  return areaType === 'musicArea' || areaType === 'privateMusicArea';
}

/**
 * A wrapper component for the TicTacToeArea component.
 * Determines if the player is currently in a tic tac toe area on the map, and if so,
 * renders the TicTacToeArea component in a modal.
 */
export default function FirstMusicWrapper(): JSX.Element {
  let musicArea = useInteractable<MusicAreaInteractable>('musicArea');
  // Check for different types of music rooms
  if (!musicArea) {
    musicArea = useInteractable<PrivateMusicAreaInteractable>('privateMusicArea');
  }
  const townController = useTownController();

  const [isOpen, setIsOpen] = useState<boolean>(true);

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

    console.log('closing modal');
    if (musicArea) {
      const musicAreaController = townController.getMusicAreaController(musicArea);
      console.log(
        'musicAreaController.sessionInProgress: ' + musicAreaController.sessionInProgress,
      );
      if (!musicAreaController.sessionInProgress) {
        musicArea.overlapExit();
      }
    }
  }, [musicArea, townController]);

  const handleReopen = useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  const handleLeaveSession = useCallback(async () => {
    if (musicArea) {
      console.log('handling leave session');
      townController.interactEnd(musicArea);
      const musicAreaController = townController.getMusicAreaController(musicArea);
      await musicAreaController.removeUserFromSession();
      if (!musicAreaController.sessionInProgress) {
        // Reset state if session ended
        const privateMusicAreaController = musicAreaController as PrivateMusicAreaController;
        await privateMusicAreaController.setPrivacy(false);
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

  if (musicArea && isValidMusicAreaType(musicArea.getType())) {
    console.log('Rendering first music. isOpen: ' + isOpen);
    let sessionInProgress;
    if (musicArea) {
      const musicAreaController = townController.getMusicAreaController(musicArea);
      sessionInProgress = musicAreaController.sessionInProgress;
    }
    console.log('session in progress: ' + sessionInProgress);
    if (!isOpen && sessionInProgress) {
      return <Button onClick={handleReopen}>Re-open Music Player</Button>;
    } else {
      return (
        <Modal isOpen={isOpen} onClose={closeModal} closeOnOverlayClick={false} size='2xl'>
          <ModalOverlay />
          <ModalContent maxW='540px'>
            {' '}
            <ModalCloseButton />
            <FirstMusic interactableID={musicArea.id} />
          </ModalContent>
        </Modal>
      );
    }
  }
  return <></>;
}
