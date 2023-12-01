import { ChakraProvider } from '@chakra-ui/react';
import { MuiThemeProvider } from '@material-ui/core/styles';
import assert from 'assert';
import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import TownController from './classes/TownController';
import { ChatProvider } from './components/VideoCall/VideoFrontend/components/ChatProvider';
import ErrorDialog from './components/VideoCall/VideoFrontend/components/ErrorDialog/ErrorDialog';
import PreJoinScreens from './components/VideoCall/VideoFrontend/components/PreJoinScreens/PreJoinScreens';
import UnsupportedBrowserWarning from './components/VideoCall/VideoFrontend/components/UnsupportedBrowserWarning/UnsupportedBrowserWarning';
import { VideoProvider } from './components/VideoCall/VideoFrontend/components/VideoProvider';
import AppStateProvider, { useAppState } from './components/VideoCall/VideoFrontend/state';
import theme from './components/VideoCall/VideoFrontend/theme';
import useConnectionOptions from './components/VideoCall/VideoFrontend/utils/useConnectionOptions/useConnectionOptions';
import VideoOverlay from './components/VideoCall/VideoOverlay/VideoOverlay';
import TownMap from './components/Town/TownMap';
import TownControllerContext from './contexts/TownControllerContext';
import LoginControllerContext from './contexts/LoginControllerContext';
import { TownsServiceClient } from './generated/client';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/router';
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID as string;
const LOGIN_URL = process.env.NEXT_PUBLIC_AUTHORIZATION_URL as string;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI as string;

export const SPOTIFY_SCOPES = [
  'ugc-image-upload',
  'user-read-recently-played',
  'user-top-read',
  'user-read-playback-position',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'app-remote-control',
  'streaming',
  'playlist-modify-public',
  'playlist-modify-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-follow-modify',
  'user-follow-read',
  'user-library-modify',
  'user-library-read',
  'user-read-email',
  'user-read-private',
] as const;
const SINGLE_STRING_SCOPE = SPOTIFY_SCOPES.join(' ');

export const generateRandomString = function (length: number) {
  let text = '';
  const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
  }
  return text;
};

function App() {
  const [townController, setTownController] = useState<TownController | null>(null);

  const { error, setError } = useAppState();
  const connectionOptions = useConnectionOptions();
  const onDisconnect = useCallback(() => {
    townController?.disconnect();
  }, [townController]);

  const router = useRouter();

  useEffect(() => {
    const params = router.query;
    async function spotifyAccessTokenRequest() {
      if (!params.code) {
        /* redirect user to spotify login */
        // const loginResponse = await fetch('/api/login', {
        //   method: 'GET',
        // });
        // const spotifyLoginPageURL = await loginResponse.json();
        // if (!spotifyLoginPageURL) {
        //   throw new Error('Unable to get Spotify login URL');
        // }
        // Redirects user's page to Spotify login page
        const state = generateRandomString(16);
        const redirectParams = new URLSearchParams({
          response_type: 'code',
          client_id: CLIENT_ID,
          scope: SINGLE_STRING_SCOPE,
          redirect_uri: REDIRECT_URI,
          state: state,
        });
        const url = `${LOGIN_URL}?${redirectParams.toString()}`;
        window.location.href = url;
      }
    }
    spotifyAccessTokenRequest();
  });

  let page: JSX.Element;
  if (townController) {
    page = (
      <TownControllerContext.Provider value={townController}>
        <ChatProvider>
          <TownMap />
          <VideoOverlay preferredMode='fullwidth' />
        </ChatProvider>
      </TownControllerContext.Provider>
    );
  } else {
    page = <PreJoinScreens />;
  }
  const url = process.env.NEXT_PUBLIC_TOWNS_SERVICE_URL;
  assert(url, 'NEXT_PUBLIC_TOWNS_SERVICE_URL must be defined');
  const townsService = new TownsServiceClient({ BASE: url }).towns;
  return (
    <LoginControllerContext.Provider value={{ setTownController, townsService }}>
      <UnsupportedBrowserWarning>
        <VideoProvider options={connectionOptions} onError={setError} onDisconnect={onDisconnect}>
          <ErrorDialog dismissError={() => setError(null)} error={error} />
          {page}
        </VideoProvider>
      </UnsupportedBrowserWarning>
    </LoginControllerContext.Provider>
  );
}

const DEBUG_TOWN_NAME = 'DEBUG_TOWN';
function DebugApp(): JSX.Element {
  const [townController, setTownController] = useState<TownController | null>(null);
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_TOWNS_SERVICE_URL;
    assert(url, 'NEXT_PUBLIC_TOWNS_SERVICE_URL must be defined');
    const townsService = new TownsServiceClient({ BASE: url }).towns;
    async function getOrCreateDebugTownID() {
      const towns = await townsService.listTowns();
      const existingTown = towns.find(town => town.friendlyName === DEBUG_TOWN_NAME);
      if (existingTown) {
        return existingTown.townID;
      } else {
        try {
          const newTown = await townsService.createTown({
            friendlyName: DEBUG_TOWN_NAME,
            isPubliclyListed: true,
          });
          return newTown.townID;
        } catch (e) {
          console.error(e);
          //Try one more time to see if the town had been created by another process
          const townsRetry = await townsService.listTowns();
          const existingTownRetry = townsRetry.find(town => town.friendlyName === DEBUG_TOWN_NAME);
          if (!existingTownRetry) {
            throw e;
          } else {
            return existingTownRetry.townID;
          }
        }
      }
    }
    getOrCreateDebugTownID().then(townID => {
      assert(townID);
      const newTownController = new TownController({
        townID,
        loginController: {
          setTownController: () => {},
          townsService,
        },
        userName: nanoid(),
      });
      newTownController.connect().then(() => {
        setTownController(newTownController);
      });
    });
  }, []);
  if (!townController) {
    return <div>Loading...</div>;
  } else {
    return (
      <TownControllerContext.Provider value={townController}>
        <ChatProvider>
          <TownMap />
        </ChatProvider>
      </TownControllerContext.Provider>
    );
  }
}

function AppOrDebugApp(): JSX.Element {
  const debugTown = process.env.NEXT_PUBLIC_TOWN_DEV_MODE;
  if (debugTown && debugTown.toLowerCase() === 'true') {
    return <DebugApp />;
  } else {
    return <App />;
  }
}

export default function AppStateWrapper(): JSX.Element {
  return (
    <BrowserRouter>
      <ChakraProvider>
        <MuiThemeProvider theme={theme}>
          <AppStateProvider>
            <AppOrDebugApp />
          </AppStateProvider>
        </MuiThemeProvider>
      </ChakraProvider>
    </BrowserRouter>
  );
}
