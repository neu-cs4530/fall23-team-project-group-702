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
  const [sdkAccessToken, setSdkAccessToken] = useState("");
  const router = useRouter();

  useEffect(() => {
    console.log(`client_id: ${client_id} client_secret: ${client_secret} loginURL: ${loginURL} tokenURL: ${tokenURL} redirect_uri: ${redirect_uri}`)
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
      } else if (!accessToken) {
        // const internalSdk = SpotifyApi.withClientCredentials(client_id, client_secret, Scopes.all);
        // const response = await internalSdk.authenticate();
        // const internalAccessToken = response.accessToken;
        // setSdkAccessToken(internalAccessToken.access_token);
        // console.log(`Application accessToken: ${sdkAccessToken}`)
        // setSdk(internalSdk);

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

        if (authorizationData && authorizationData.access_token) {
          setAccessToken(authorizationData.access_token);
        }
        console.log(`user accessToken: ${JSON.stringify(authorizationData)}`)

        const internalSdk = SpotifyApi.withAccessToken(client_id, authorizationData);
        const response = await internalSdk.authenticate();
        const internalAccessToken = response.accessToken;
        setSdkAccessToken(internalAccessToken.access_token);
        console.log(`Application accessToken: ${JSON.stringify(response)}`)
        setSdk(internalSdk);
      }
    })();
  }, []);

  return (
    <>
      {accessToken}
      <div>
        Temp <br />
        {sdkAccessToken}
      </div>
      {(sdk && accessToken != "") ?
        <>
          <SpotifySdk userAccessToken={accessToken} sdk={sdk} serverAccessToken={sdkAccessToken} />
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