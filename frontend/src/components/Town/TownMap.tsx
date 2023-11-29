import React, { useState, useEffect } from 'react';
import Phaser from 'phaser';
import useTownController from '../../hooks/useTownController';
import SocialSidebar from '../SocialSidebar/SocialSidebar';
import NewConversationModal from './interactables/NewCoversationModal';
import TownGameScene from './TownGameScene';
import TicTacToeAreaWrapper from './interactables/TicTacToe/TicTacToeArea';
import FirstMusicWrapper from './interactables/Music/FirstMusic';
import { AccessToken } from '@spotify/web-api-ts-sdk';
import { useRouter } from 'next/router';
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, TOKEN_URL } from '../../utilities/constants';
import SpotifySdk from './interactables/Music/SpotifySdk';

export default function TownMap(): JSX.Element {
  const coveyTownController = useTownController();
  const router = useRouter();

  const [accessToken, setAccessToken] = useState<AccessToken | undefined>(
    coveyTownController.spotifyAccessToken,
  );

  useEffect(() => {
    const params = router.query;
    async function spotifyAccessTokenRequest() {
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
      } else if (accessToken === undefined) {
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

        coveyTownController.spotifyAccessToken = authorizationData;

        if (authorizationData && authorizationData.access_token) {
          setAccessToken(authorizationData);
        } else {
          throw new Error('Unable to get Spotify access token');
        }
      }
    }
    spotifyAccessTokenRequest();
  });

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      backgroundColor: '#000000',
      parent: 'map-container',
      render: { pixelArt: true, powerPreference: 'high-performance' },
      scale: {
        expandParent: false,
        mode: Phaser.Scale.ScaleModes.WIDTH_CONTROLS_HEIGHT,
        autoRound: true,
      },
      width: 800,
      height: 600,
      fps: { target: 30 },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 }, // Top down game, so no gravity
        },
      },
    };

    const game = new Phaser.Game(config);
    const newGameScene = new TownGameScene(coveyTownController);
    game.scene.add('coveyBoard', newGameScene, true);
    const pauseListener = newGameScene.pause.bind(newGameScene);
    const unPauseListener = newGameScene.resume.bind(newGameScene);
    coveyTownController.addListener('pause', pauseListener);
    coveyTownController.addListener('unPause', unPauseListener);
    return () => {
      coveyTownController.removeListener('pause', pauseListener);
      coveyTownController.removeListener('unPause', unPauseListener);
      game.destroy(true);
    };
  }, [coveyTownController]);

  return (
    <div id='app-container'>
      <NewConversationModal />
      <TicTacToeAreaWrapper />

      <div id='map-container' />
      <div id='social-container'>
        <SocialSidebar />
      </div>
      {accessToken ? (
        <>
          <div>
            <SpotifySdk userAccessToken={accessToken}>
              <FirstMusicWrapper />
            </SpotifySdk>
          </div>
        </>
      ) : (
        <>Not Logged Into Spotify</>
      )}
    </div>
  );
}
