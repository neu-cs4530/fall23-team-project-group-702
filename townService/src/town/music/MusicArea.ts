/* eslint-disable no-console */
import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import { AccessToken, Track } from '@spotify/web-api-ts-sdk';
import InvalidParametersError from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import {
  BoundingBox,
  MusicArea as MusicAreaModel,
  InteractableCommand,
  InteractableCommandReturnType,
  TownEmitter,
  MusicAreaCommand,
  MusicArea,
} from '../../types/CoveyTownSocket';
import InteractableArea from '../InteractableArea';
import SpotifyController from './SpotifyController';

export default class SpotifyArea extends InteractableArea {
  /* The topic of the conversation area, or undefined if it is not set */
  public topic?: string;

  public sessionInProgress?: boolean;

  private _musicSessionController: SpotifyController;

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
    this.topic = topic;
    this.sessionInProgress = false;
    console.log(
      `created music area topic: ${this.topic} | sessionInProgress: ${this.sessionInProgress}`,
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
      this.topic = undefined;
      this._emitAreaChanged();
    }
  }

  /**
   * Convert this MusicArea instance to a simple MusicAreaModel suitable for
   * transporting over a socket to a client.
   */
  public toModel(): MusicAreaModel {
    console.log('sending sessionInPorrgreis:');
    console.log(this.sessionInProgress);
    return {
      id: this.id,
      occupants: this.occupantsByID,
      type: 'MusicArea',
      topic: this.topic,
      sessionInProgress: this.sessionInProgress,
      songQueue: this._musicSessionController.queue,
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
      { id: name, occupants: [], topic: 'JASON IS THE BEST', sessionInProgress: false },
      rect,
      broadcastEmitter,
    );
  }

  /**
   * Updates the state of this ViewingArea, setting the video, isPlaying and progress properties
   *
   * @param musicArea updated model
   */
  public updateModel({ topic, sessionInProgress }: MusicAreaModel) {
    this.topic = topic;
    this.sessionInProgress = sessionInProgress;
  }

  public async handleSpotifyCommand<CommandType extends InteractableCommand>(
    command: CommandType,
  ): Promise<InteractableCommandReturnType<CommandType>> {
    if (command.type === 'MusicAreaCommand') {
      const newMusicArea = command as MusicAreaCommand;
      switch (newMusicArea.payload.commandType) {
        case 'createSession': {
          const { topic } = newMusicArea.payload;
          if (!topic) {
            console.log('topic was undefined');
            return {} as InteractableCommandReturnType<CommandType>;
          }
          // Update with new topic
          this.topic = topic as string;

          console.log(`topic updated: ${this.topic}`);

          // Update session in progress
          this.sessionInProgress = true;
          console.log('sessionInProgress was set to: ');
          console.log(this.sessionInProgress);

          // Emit to other frontend MusicAreaControllers to update their state
          this._emitAreaChanged();
          return {} as InteractableCommandReturnType<CommandType>;
        }
        case 'skip': {
          const results = await this._musicSessionController.skip();
          console.log('skipped');
          return {
            payload: { currentSong: results[0], songQueue: results[1] } as MusicArea,
          } as InteractableCommandReturnType<CommandType>;
        }
        case 'togglePlay': {
          await this._musicSessionController.togglePlay();
          console.log('toggled play');
          return {} as InteractableCommandReturnType<CommandType>;
        }
        case 'search': {
          const { searchQuery } = newMusicArea.payload;
          if (!searchQuery) {
            console.log('no search query provided');
            return {} as InteractableCommandReturnType<CommandType>;
          }
          const results = await this._musicSessionController.search(searchQuery as string);
          console.log('Search successful');
          return {
            payload: { searchResults: results },
          } as InteractableCommandReturnType<CommandType>;
        }
        case 'playSong': {
          const { trackId } = newMusicArea.payload;
          if (!trackId) {
            console.log('no track ID provided');
            return {} as InteractableCommandReturnType<CommandType>;
          }
          await this._musicSessionController.playSongNow(trackId as string);
          return {} as InteractableCommandReturnType<CommandType>;
        }
        case 'addQueue': {
          const { trackId } = newMusicArea.payload;
          if (!trackId) {
            console.log('no track ID provided');
            return {} as InteractableCommandReturnType<CommandType>;
          }
          const updatedQueue = await this._musicSessionController.addSongToQueue(trackId as string);
          console.log('added to queue');
          return {
            payload: { songQueue: updatedQueue },
          } as InteractableCommandReturnType<CommandType>;
        }
        case 'removeFromQueue': {
          const { queueId } = newMusicArea.payload;
          if (!queueId) {
            console.log('no track ID provided');
            return {} as InteractableCommandReturnType<CommandType>;
          }
          const updatedQueue = await this._musicSessionController.removeFromQueue(
            queueId as string,
          );
          console.log('removed from queue');
          return {
            payload: { songQueue: updatedQueue },
          } as InteractableCommandReturnType<CommandType>;
        }
        case 'getCurrentPlayback': {
          const { queue } = this._musicSessionController;
          console.log('got queue');
          return { payload: { songQueue: queue } } as InteractableCommandReturnType<CommandType>;
        }
        case 'addUserToSession': {
          const userAccessToken: AccessToken = newMusicArea.payload.accessToken;
          const { deviceId } = newMusicArea.payload;

          if (userAccessToken && deviceId) {
            console.log('received access token. creating spotify playback object');
            const confirmedAccessToken = await this._musicSessionController.addUserMusicPlayer(
              deviceId,
              userAccessToken,
            );
            return {
              payload: { accessToken: confirmedAccessToken },
            } as InteractableCommandReturnType<CommandType>;
          }
          console.log('400, should not reach');
          return {} as InteractableCommandReturnType<CommandType>;
        }
        default:
          console.log('invalid query');
          break;
      }
    }
    throw new InvalidParametersError('Unknown command type');
  }

  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
  ): InteractableCommandReturnType<CommandType> {
    throw new InvalidParametersError('Unknown command type');
  }
}
