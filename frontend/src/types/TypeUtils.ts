import {
  ConversationArea,
  Interactable,
  TicTacToeGameState,
  ViewingArea,
  GameArea,
  MusicArea,
  PrivateMusicArea,
} from './CoveyTownSocket';

/**
 * Test to see if an interactable is a conversation area
 */
export function isConversationArea(interactable: Interactable): interactable is ConversationArea {
  return interactable.type === 'ConversationArea';
}

/**
 * Test to see if an interactable is a viewing area
 */
export function isViewingArea(interactable: Interactable): interactable is ViewingArea {
  return interactable.type === 'ViewingArea';
}

/**
 * Test to see if an interactable is a music area
 */
export function isMusicArea(interactable: Interactable): interactable is MusicArea {
  return interactable.type === 'MusicArea';
}

/**
 * Test to see if an interactable is a private music area
 */
 export function isPrivateMusicArea(interactable: Interactable): interactable is PrivateMusicArea {
  return interactable.type === 'PrivateMusicArea';
}

export function isTicTacToeArea(
  interactable: Interactable,
): interactable is GameArea<TicTacToeGameState> {
  return interactable.type === 'TicTacToeArea';
}
