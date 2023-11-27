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
import { InteractableID, MusicArea } from '../../../../types/CoveyTownSocket';
import MusicAreaController from '../../../../classes/interactable/MusicAreaController';
import { useRouter } from 'next/router';
import { AccessToken } from '@spotify/web-api-ts-sdk';
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, TOKEN_URL } from '../../../../utilities/constants';

/**
 * Jukebox Interface Component that handles rendering the join/create music session modal and the music playback interface modal.
 */
function FirstMusic({ interactableID }: { interactableID: InteractableID }): JSX.Element {
  const musicAreaController = useInteractableAreaController<MusicAreaController>(interactableID);
  const townController = useTownController();
  const router = useRouter();

  const [accessToken, setAccessToken] = useState(null as unknown as AccessToken);
  const [sessionName, setSessionName] = useState<string | undefined>(musicAreaController.topic);
  const [sessionActive, setSessionActive] = useState<boolean | undefined>(
    musicAreaController.sessionInProgress,
  );

  useEffect(() => {
    const params = router.query;
    async function login() {
      if (!params.code) {
        /* redirect user to spotify login */
        const loginResponse = await fetch('http://localhost:3000/api/login', {
          method: 'GET',
        });
        const loginData = await loginResponse.json();
        if (!loginData) {
          throw new Error('Unable to get Spotify login URL');
        }
        window.location.href = loginData;
      } else if (!accessToken) {
        /* get user access token using login info */
        const spotifyAccessTokenParams = new URLSearchParams({
          grant_type: 'authorization_code',
          code: params.code as string,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        });
        const authResponse = await fetch(TOKEN_URL, {
          method: 'POST',
          body: spotifyAccessTokenParams,
        });
        if (!authResponse.ok) {
          throw new Error('Unable to get Spotify access token using code');
        }
        /* the access token for the current user */
        const authorizationData = await authResponse.json();

        /* set access token if a valid access token object */
        if (authorizationData && authorizationData.access_token) {
          setAccessToken(authorizationData);
        } else {
          throw new Error('Unable to get Spotify access token');
        }
      }
    }
    login();
  }, [accessToken, router.query]);

  useEffect(() => {
    musicAreaController.addListener('topicChange', setSessionName);
    musicAreaController.addListener('sessionInProgressChange', setSessionActive);
    return () => {
      musicAreaController.removeListener('topicChange', setSessionName);
      musicAreaController.removeListener('sessionInProgressChange', setSessionActive);
    };
  }, [musicAreaController]);

  // mocking what start music session, should acc use gameAreaController to send interactableCommand to backend
  const handleStartMusicSession = async () => {
    // townController.sendInteractableCommand;
    const musicAreaState = await musicAreaController.sendSpotifyCommand({
      commandType: 'createSession',
      topic: sessionName,
    } as MusicArea);
    setSessionActive(true); // backend call townController.sendInteract
  };

  if (!accessToken) {
    return <div>Not logged in</div>;
  }

  if (!sessionActive) {
    return (
      <div>
        <div>
          {JSON.stringify(sessionActive)}
        </div>

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
    if (sessionActive == undefined) {
      console.log('session active is undefined');
      console.log(sessionActive);
    }
    return (
      <div>
        {sessionName} <br/>
        {typeof sessionActive}<br/>
        {typeof undefined}<br/>
        <SpotifyMain accessToken={accessToken} />
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
