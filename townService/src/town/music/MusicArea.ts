/* eslint-disable no-console */
import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import { Track } from '@spotify/web-api-ts-sdk';
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
    return {
      id: this.id,
      occupants: this.occupantsByID,
      type: 'MusicArea',
      topic: this.topic,
      sessionInProgress: this.sessionInProgress,
      songQueue: [],
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

  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
  ): InteractableCommandReturnType<CommandType> {
    if (command.type === 'MusicAreaCommand') {
      const musicArea = command as MusicAreaCommand;
      this.updateModel(musicArea.payload);
      let response: InteractableCommandReturnType<CommandType>;
      this._musicSessionController
        .skip()
        .then(results => {
          // console.log('skipped');
          // res.status(200).json({ currentSong: results[0], updatedQueue: results[1] });
          response = {
            payload: { songQueue: results[1] },
          } as InteractableCommandReturnType<CommandType>;
          return response;
        })
        .catch(err => {
          throw new Error(err);
        });
      /*
      switch (payload.commandType) {
        case 'skip': {
          this._musicSessionController.skip().then(results => {
            console.log('skipped');
            // res.status(200).json({ currentSong: results[0], updatedQueue: results[1] });
          });
          break;
        }
        case 'togglePlay': {
          this._musicSessionController.togglePlay().then(results => {
            console.log('toggled play');
            // res.status(200).json({ currentSong: results[0], updatedQueue: results[1] });
          });
          break;
        }
        case 'search': {
          const { searchQuery } = req.query;
          if (!searchQuery) {
            console.log('no search query provided');
            // res.status(400).send('no search query provided');
            break;
          }
          this._musicSessionController.search(searchQuery as string).then(results => {
            console.log('search successful');
            // res.status(200).json(results);
          });
          console.log('Search successful');
          // res.status(200).json(searchResults);
          break;
        }
        case 'playSong': {
          const { trackId } = req.query;
          if (!trackId) {
            console.log('no track ID provided');
            // res.status(400).send('no track ID provided');
            break;
          }
          this._musicSessionController.playSongNow(trackId as string).then(() => {
            console.log('playing song');
          });
          // res.status(200).send('playing song');
          break;
        }
        case 'addQueue': {
          const { trackId } = req.query;
          if (!trackId) {
            console.log('no track ID provided');
            // res.status(400).send('no track ID provided');
            return {} as InteractableCommandReturnType<CommandType>;
          }
          const updatedQueue = await this._musicSessionController.addSongToQueue(trackId as string);
          console.log('added to queue');
          // res.status(200).json(updatedQueue);
          break;
        }
        case 'removeFromQueue': {
          const { queueId } = req.query;
          if (!queueId) {
            console.log('no track ID provided');
            // res.status(400).send('no track ID provided');
            break;
          }
          const updatedQueue = await this._musicSessionController.removeFromQueue(
            queueId as string,
          );
          console.log('removed from queue');
          // res.status(200).json(updatedQueue);
          break;
        }
        case 'getCurrentPlayback': {
          const { queue } = this._musicSessionController;

          console.log('got queue');
          // res.status(200).json(queue);
          const responsePayload = { songQueue: queue } as MusicArea;
          return { payload: responsePayload } as InteractableCommandReturnType<CommandType>;
        }
        default:
          console.log('invalid query');
          break;
      }
      */
    } else {
      throw new InvalidParametersError('Unknown command type');
    }
  }
}
