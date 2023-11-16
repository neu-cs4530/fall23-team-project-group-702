/// <reference types="@types/spotify-web-playback-sdk"/>
import { Button, chakra, Container, useToast } from '@chakra-ui/react';
import TicTacToeAreaController, {
  TicTacToeCell,
} from '../../../../classes/interactable/TicTacToeAreaController';
import { TicTacToeGridPosition } from '../../../../types/CoveyTownSocket';;
// Spotify
import { AuthorizationCodeWithPKCEStrategy, Scopes, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useEffect, useState } from 'react';
import SpotifySdk from './SpotifySdk';
import SpotifyPlayback from './SpotifyPlayback';

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
export default function TicTacToeBoard({ gameAreaController }: TicTacToeGameProps): JSX.Element {
  const [accessToken, setAccessToken] = useState("");
  const [sdk, setSdk] = useState<SpotifyApi>(null as unknown as SpotifyApi);

  useEffect(() => {
    (async () => {
      const auth = new AuthorizationCodeWithPKCEStrategy(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID as string, "http://localhost:3000/callback/", Scopes.all);
      const internalSdk = new SpotifyApi(auth, undefined);

      try {
        const { authenticated } = await internalSdk.authenticate();

        if (authenticated) {
          setSdk(internalSdk);
          const clientToken = await internalSdk.getAccessToken();
          if (!clientToken) {
            throw new Error("Authentication failed");
          }
          setAccessToken(clientToken.access_token);
        }
      } catch (e: Error | unknown) {

        const error = e as Error;
        if (error && error.message && error.message.includes("No verifier found in cache")) {
          console.error("If you are seeing this error in a React Development Environment it's because React calls useEffect twice. Using the Spotify SDK performs a token exchange that is only valid once, so React re-rendering this component will result in a second, failed authentication. This will not impact your production applications (or anything running outside of Strict Mode - which is designed for debugging components).", error);
        } else {
          console.error(e);
        }
      }

    })();
  }, []);

  return (
    <>
      {(sdk && accessToken!="") ?
        <>
          <SpotifyPlayback sdk={sdk} />
          <SpotifySdk token={accessToken} />
        </>
        :
        <>
          SDK / Access Token Not Loaded
        </>
      }
    </>
  );
}