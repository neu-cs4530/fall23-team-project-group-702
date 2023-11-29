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
  toast,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useInteractable, useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import MusicAreaInteractable from '../MusicArea';
import PrivateMusicAreaInteractable from '../PrivateMusicArea';
import { useCallback, useEffect, useState } from 'react';
import { InteractableID, MusicArea } from '../../../../types/CoveyTownSocket';
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
          {  <Button onClick={() => {
            const privateController = musicAreaController as PrivateMusicAreaController
            privateController.setPrivacy(!privateController.isPrivateSession);
          }}>
              Make Private Session
          </Button>}
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

function isValidMusicAreaType(areaType: string): boolean {
  return areaType === 'musicArea' || areaType === 'privateMusicArea'
}

/**
 * A wrapper component for the TicTacToeArea component.
 * Determines if the player is currently in a tic tac toe area on the map, and if so,
 * renders the TicTacToeArea component in a modal.
 *
 */
export default function FirstMusicWrapper(): JSX.Element {
  let musicArea = useInteractable<MusicAreaInteractable>('musicArea');
  // Check for different types of music rooms
  if (!musicArea) {
    musicArea = useInteractable<PrivateMusicAreaInteractable>('privateMusicArea');
  }
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

  if (musicArea && isValidMusicAreaType(musicArea.getType())) {
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
