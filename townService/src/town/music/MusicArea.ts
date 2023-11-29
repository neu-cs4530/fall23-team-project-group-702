/* eslint-disable no-console */
import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import { Track } from '@spotify/web-api-ts-sdk';
import { isPlainObject } from 'lodash';
import InvalidParametersError from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import {
  BoundingBox,
  MusicArea as MusicAreaModel,
  InteractableCommand,
  InteractableCommandReturnType,
  TownEmitter,
} from '../../types/CoveyTownSocket';
import InteractableArea from '../InteractableArea';
import SpotifyController from './SpotifyController';

export default class SpotifyArea extends InteractableArea {
  /* The topic of the conversation area, or undefined if it is not set */
  protected _topic: string;

  protected _sessionInProgress: boolean; // NEED GETTERS AND SETTERS

  protected _musicSessionController: SpotifyController;

  public get topic(): string {
    return this._topic;
  }

  public set topic(value: string) {
    this._topic = value;
  }

  public get sessionInProgress(): boolean {
    return this._sessionInProgress;
  }

  public set sessionInProgress(value: boolean) {
    this._sessionInProgress = value;
  }

  /** The conversation area is "active" when there are players inside of it  */
  public get isActive(): boolean {
    return this._occupants.length > 0;
  }

  /**
   * Creates a new MusicArea
   *
   * @param conversationAreaModel model containing this area's current topic and its ID
   * @param coordinates  the bounding box that defines this conversation area
   * @param townEmitter a broadcast emitter that can be used to emit updates to players
   */
  public constructor(
    { topic, id }: Omit<MusicAreaModel, 'type'>,
    coordinates: BoundingBox,
    townEmitter: TownEmitter,
  ) {
    super(id, coordinates, townEmitter);
    this._topic = topic;
    this._sessionInProgress = false;
    console.log(
      `created music area topic: ${this._topic} | sessionInProgress: ${this._sessionInProgress}`,
    );
    this._musicSessionController = new SpotifyController();
  }

  /**
   * Removes a player from this conversation area.
   *
   * Extends the base behavior of InteractableArea to set the topic of this ConversationArea to undefined and
   * emit an update to other players in the town when the last player leaves.
   *
   * @param player
   */
  public remove(player: Player) {
    console.log(`players before remove:${JSON.stringify(this._occupants)}`);
    super.remove(player);
    console.log('removed');
    if (this._occupants.length === 0) {
      this._topic = '';
      this._emitAreaChanged();
    }
  }

  /**
   * Convert this MusicArea instance to a simple MusicAreaModel suitable for
   * transporting over a socket to a client.
   */
  public toModel(): MusicAreaModel {
    return {
      id: this.id,
      occupants: this.occupantsByID,
      type: 'MusicArea',
      topic: this._topic,
      sessionInProgress: this._sessionInProgress,
      songQueue: this._musicSessionController.queue,
      currentSong: this._musicSessionController.songNowPlaying,
      isPlaying: this._musicSessionController.isASongPlaying,
    };
  }

  /**
   * Creates a new MusicArea object that will represent a Music Area object in the town map.
   * @param mapObject An ITiledMapObject that represents a rectangle in which this music area exists
   * @param broadcastEmitter An emitter that can be used by this music area to broadcast updates
   * @returns
   */
  public static fromMapObject(
    mapObject: ITiledMapObject,
    broadcastEmitter: TownEmitter,
  ): SpotifyArea {
    const { name, width, height } = mapObject;
    if (!width || !height) {
      throw new Error(`Malformed music area ${name}`);
    }
    const rect: BoundingBox = { x: mapObject.x, y: mapObject.y, width, height };
    return new SpotifyArea(
      {
        id: name,
        occupants: [],
        topic: '',
        sessionInProgress: false,
        currentSong: null,
        songQueue: [],
        isPlaying: false,
      },
      rect,
      broadcastEmitter,
    );
  }

  /**
   * Updates the state of this MusicArea, setting properties
   *
   * @param musicArea updated model
   */
  public updateModel({ topic, sessionInProgress }: MusicAreaModel) {
    this._topic = topic;
    this._sessionInProgress = sessionInProgress;
  }

  public async handleSpotifyCommand<CommandType extends InteractableCommand>(
    command: CommandType,
  ): Promise<InteractableCommandReturnType<CommandType>> {
    switch (command.type) {
      case 'CreateMusicSession': {
        console.log('backend: created music session');
        this._topic = command.topic;
        this._sessionInProgress = true;

        this._emitAreaChanged();

        return {} as InteractableCommandReturnType<CommandType>;
      }
      case 'AddUserToMusicSession': {
        const { accessToken } = command;
        const { deviceId } = command;

        if (accessToken && deviceId) {
          console.log('received access token. creating spotify playback object');
          const confirmedAccessToken = await this._musicSessionController.addUserMusicPlayer(
            deviceId,
            accessToken,
          );
          this._emitAreaChanged();
          return {
            accessToken: confirmedAccessToken,
          } as InteractableCommandReturnType<CommandType>;
        }
        return {} as InteractableCommandReturnType<CommandType>;
      }
      case 'SearchSongsMusicSession': {
        const { searchQuery } = command;
        const spotifySearchResults = await this._musicSessionController.search(searchQuery);
        const searchResults: Track[] = spotifySearchResults.tracks.items;
        return { searchResults } as InteractableCommandReturnType<CommandType>;
      }
      case 'AddMusicToSessionQueue': {
        const { trackId } = command;
        const updatedQueue = await this._musicSessionController.addSongToQueue(trackId);
        this._emitAreaChanged();
        return { updatedQueue } as InteractableCommandReturnType<CommandType>;
      }
      case 'SkipSongMusicSession': {
        const updatedState = await this._musicSessionController.skip();
        console.log('~SKIP STATS~');
        console.log(updatedState[0]?.name);
        console.log(updatedState[1]?.length);
        this._emitAreaChanged();
        return {
          currentSong: updatedState[0],
          updatedQueue: updatedState[1],
        } as InteractableCommandReturnType<CommandType>;
      }
      case 'TogglePlayMusicSession': {
        // Boolean representing the new playback state
        const isPlaying = await this._musicSessionController.togglePlay();
        this._emitAreaChanged();
        return { isPlaying } as InteractableCommandReturnType<CommandType>;
      }
      case 'RemoveMusicFromSessionQueue': {
        const { queueId } = command;
        const updatedQueue = await this._musicSessionController.removeFromQueue(queueId);
        this._emitAreaChanged();
        return { updatedQueue } as InteractableCommandReturnType<CommandType>;
      }
      case 'RemoveUserFromMusicSession': {
        const { accessToken } = command;
        console.log(`removing from session with access token: ${accessToken.access_token}`);

        // Check if the host (player who created this session) left
        let hostUserWasRemoved: boolean;
        if (this._musicSessionController.userMusicPlayers.length > 0) {
          // if invariant, don't need to check
          if (
            this._musicSessionController.userMusicPlayers[0].accessToken.access_token ===
            accessToken.access_token
          ) {
            hostUserWasRemoved = true;
          } else {
            hostUserWasRemoved = false;
          }
        } else {
          hostUserWasRemoved = false;
        }
        this._musicSessionController.removeUser(accessToken.access_token); // if invariant don't need to check
        if (this._musicSessionController.userMusicPlayers.length === 0 || hostUserWasRemoved) {
          // Reset state
          console.log('clearing musicSession state');
          this._topic = '';
          this._musicSessionController.clearState();
          this.sessionInProgress = false;
        }
        this._emitAreaChanged();
        return {} as InteractableCommandReturnType<CommandType>;
      }
      default:
        throw new InvalidParametersError('Unknown command type');
    }
  }

  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
  ): InteractableCommandReturnType<CommandType> {
    throw new InvalidParametersError('Unknown command type');
  }
}
