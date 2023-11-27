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
import { InteractableID, MusicArea } from '../../../../types/CoveyTownSocket';
import MusicAreaController from '../../../../classes/interactable/MusicAreaController';
import { useRouter } from 'next/router';
import { AccessToken } from '@spotify/web-api-ts-sdk';
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, TOKEN_URL } from '../../../../utilities/constants';
import SpotifyPlayback from './SpotifyPlayback';
import SpotifySdk from './SpotifySdk';

/**
 * Jukebox Interface Component that handles rendering the join/create music session modal and the music playback interface modal.
 */
function FirstMusic({ interactableID }: { interactableID: InteractableID }): JSX.Element {
  const musicAreaController = useInteractableAreaController<MusicAreaController>(interactableID);
  const townController = useTownController();
  const router = useRouter();

  const [accessToken, setAccessToken] = useState<AccessToken | undefined>(
    townController.spotifyAccessToken,
  );
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
        const spotifyLoginPageURL = await loginResponse.json();
        if (!spotifyLoginPageURL) {
          throw new Error('Unable to get Spotify login URL');
        }
        // Redirects user's page to Spotify login page
        window.location.href = spotifyLoginPageURL;
      } else {
        if (accessToken !== undefined) {
          return;
        }
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
          const body = await authResponse.json();
          throw new Error(
            `Unable to set Spotify access token. Error message: ${JSON.stringify(
              body,
            )}. error message ${authResponse.statusText}`,
          );
        }
        /* the access token for the current user */
        const authorizationData: AccessToken = await authResponse.json();

        townController.spotifyAccessToken = authorizationData;
        // // Post new access token to backend
        // await musicAreaController.sendSpotifyCommand({
        //   commandType: 'updateAccessToken',
        //   accessToken: authorizationData,
        // } as MusicArea);

        /* set access token if a valid access token object */
        if (authorizationData && authorizationData.access_token) {
          setAccessToken(authorizationData);
        } else {
          throw new Error('Unable to get Spotify access token');
        }
      }
    }
    login();
  }, [accessToken, router.query, townController]);

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

  // mocking what start music session, should acc use gameAreaController to send interactableCommand to backend
  const handleStartMusicSession = async () => {
    // townController.sendInteractableCommand;
    await musicAreaController.sendSpotifyCommand({
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
          {!accessToken ? (
            <>User Access Tokens Not Loaded</>
          ) : (
            <>
              <div>
                <SpotifyPlayback musicController={musicAreaController} />
              </div>
              <div>
                <SpotifySdk musicController={musicAreaController} userAccessToken={accessToken} />
              </div>
            </>
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
