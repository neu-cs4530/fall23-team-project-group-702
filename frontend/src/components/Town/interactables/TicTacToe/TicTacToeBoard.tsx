/// <reference types="@types/spotify-web-playback-sdk"/>
import { Button, chakra, Container, useToast } from '@chakra-ui/react';
import TicTacToeAreaController, {
  TicTacToeCell,
} from '../../../../classes/interactable/TicTacToeAreaController';
import { TicTacToeGridPosition } from '../../../../types/CoveyTownSocket';;
// Spotify
import { Scopes, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useEffect, useState } from 'react';
import SpotifySdk from './SpotifySdk';
import { useRouter } from 'next/router';

export type TicTacToeGameProps = {
  gameAreaController: TicTacToeAreaController;
};

/**
 * A component that will render a single cell in the TicTacToe board, styled
 */
const StyledTicTacToeSquare = chakra(Button, {
  baseStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    flexBasis: '33%',
    border: '1px solid black',
    height: '33%',
    fontSize: '50px',
    _disabled: {
      opacity: '100%',
    },
  },
});
/**
 * A component that will render the TicTacToe board, styled
 */
const StyledTicTacToeBoard = chakra(Container, {
  baseStyle: {
    display: 'flex',
    width: '400px',
    height: '400px',
    padding: '5px',
    flexWrap: 'wrap',
  },
});

export const client_id = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID as string;
export const client_secret = process.env.NEXT_PUBLIC_SPOTIFY_SECRET_TOKEN as string;
export const loginURL = process.env.NEXT_PUBLIC_AUTHORIZATION_URL as string;
export const tokenURL = process.env.NEXT_PUBLIC_ACCESS_TOKEN_URL as string;
export const redirect_uri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI as string;


/**
 * A component that renders the TicTacToe board
 *
 * Renders the TicTacToe board as a "StyledTicTacToeBoard", which consists of 9 "StyledTicTacToeSquare"s
 * (one for each cell in the board, starting from the top left and going left to right, top to bottom).
 * Each StyledTicTacToeSquare has an aria-label property that describes the cell's position in the board,
 * formatted as `Cell ${rowIndex},${colIndex}`.
 *
 * The board is re-rendered whenever the board changes, and each cell is re-rendered whenever the value
 * of that cell changes.
 *
 * If the current player is in the game, then each StyledTicTacToeSquare is clickable, and clicking
 * on it will make a move in that cell. If there is an error making the move, then a toast will be
 * displayed with the error message as the description of the toast. If it is not the current player's
 * turn, then the StyledTicTacToeSquare will be disabled.
 *
 * @param gameAreaController the controller for the TicTacToe game
 */
export default function TicTacToeBoard(): JSX.Element {
  const [accessToken, setAccessToken] = useState("");
  const [sdk, setSdk] = useState<SpotifyApi>(null as unknown as SpotifyApi);
  const router = useRouter();

  useEffect(() => {
    // console.log(`client_id: ${client_id} client_secret: ${client_secret} loginURL: ${loginURL} tokenURL: ${tokenURL} redirect_uri: ${redirect_uri}`)
    const params = router.query;
    (async () => {
      if (!params.code) {
        const loginResponse = await fetch("http://localhost:3000/api/login", {
          method: "GET",
        });
        const loginData = await loginResponse.json();
        if (!loginData) {
          throw new Error("Unable to get Spotify login URL");
        }
        window.location.href = loginData;
      } else if (!accessToken && !sdk) {
        console.log("REACHED")
        const spotifyAccessTokenParams = new URLSearchParams({
          grant_type: "authorization_code",
          code: params.code as string,
          redirect_uri: redirect_uri,
          client_id: client_id,
          client_secret: client_secret,
        });

        const authResponse = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          body: spotifyAccessTokenParams,
        });
        const authorizationData = await authResponse.json();
        // console.log(`Data2: ${JSON.stringify(data2)}`);

        if (authorizationData && authorizationData.access_token) {
          setAccessToken(authorizationData.access_token);
        }
        console.log(`user accessToken: ${authorizationData.access_token}`)
        const internalSdk = SpotifyApi.withClientCredentials(client_id, client_secret, Scopes.all);
        const test = await internalSdk.authenticate();
        console.log(`Application accessToken: ${test.accessToken.access_token}`)
        setSdk(internalSdk);
      }
    })();
  }, []);

  return (
    <>
      {accessToken}
      {(sdk && accessToken != "") ?
        <>
          <SpotifySdk token={accessToken} sdk={sdk} />
        </>
        :
        <>
          SDK / Access Token Not Loaded
          <div>
            sdk is valid: {sdk !== null}
          </div>
          <div>
            accessToken: {accessToken}
          </div>
        </>
      }
    </>
  );
}

/*

import { useCallback } from "react";
import { GetServerSideProps } from "next";
import nookies from "nookies";
import { WebPlaybackSDK } from "react-spotify-web-playback-sdk";
import {
  SPOTIFY_API_TOKEN_URL,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
} from "../common/constant";
import styles from "../styles/player.module.css";
import { PlayerHeader } from "../components/PlayerHeader";
import { PlayerContent } from "../components/PlayerContent";

type Props = { token: TokenObject };

const Player: React.VFC<Props> = ({ token }) => {
  const getOAuthToken: Spotify.PlayerInit["getOAuthToken"] = useCallback(
    callback => callback(token.access_token),
    [token.access_token],
  );

  return (
    <WebPlaybackSDK
      initialDeviceName="Spotify Player on Next.js"
      getOAuthToken={getOAuthToken}
      connectOnInitialized={true}
      initialVolume={0.5}>
      <div className={styles.root}>
        <div className={styles.header}>
          <PlayerHeader />
        </div>
        <main className={styles.player}>
          <PlayerContent access_token={token.access_token} />
        </main>
      </div>
    </WebPlaybackSDK>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({
  query,
  req,
}) => {
  const stateFromCookies = nookies.get({ req }).state;
  const stateFromRequest = query.state;

  if (
    typeof stateFromCookies === "string" &&
    typeof stateFromRequest === "string" &&
    stateFromCookies === stateFromRequest &&
    typeof query.code === "string"
  ) {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: query.code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      client_id: SPOTIFY_CLIENT_ID,
      client_secret: SPOTIFY_CLIENT_SECRET,
    });

    const response = await fetch(SPOTIFY_API_TOKEN_URL, {
      method: "POST",
      body: params,
    }).then(res => res.json());

    if (isTokenObject(response)) {
      return {
        props: { token: response },
      };
    }
  }

  return {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };
};

export default Player;

type TokenObject = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
};

function isTokenObject(value: any): value is TokenObject {
  return (
    value != undefined &&
    typeof value.access_token === "string" &&
    typeof value.token_type === "string" &&
    typeof value.scope === "string" &&
    typeof value.expires_in === "number" &&
    typeof value.refresh_token === "string"
  );
}

*/