/* eslint-disable no-console */
import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import {
  BoundingBox,
  InteractableCommand,
  InteractableCommandReturnType,
  InteractableType,
  PrivateMusicArea as PrivateMusicAreaModel,
  TownEmitter,
} from '../../types/CoveyTownSocket';
import SpotifyArea from './MusicArea';

export default class PrivateSpotifyArea extends SpotifyArea {
  private _isPrivate: boolean;

  /**
   * Creates a new MusicArea
   *
   * @param conversationAreaModel model containing this area's current topic and its ID
   * @param coordinates  the bounding box that defines this conversation area
   * @param townEmitter a broadcast emitter that can be used to emit updates to players
   */
  public constructor(
    { topic, id, isPrivate }: Omit<PrivateMusicAreaModel, 'type'>,
    coordinates: BoundingBox,
    townEmitter: TownEmitter,
  ) {
    super({ topic, id } as Omit<PrivateMusicAreaModel, 'type'>, coordinates, townEmitter);
    this._isPrivate = isPrivate;
  }

  public toModel(): PrivateMusicAreaModel {
    const basicModel = super.toModel();
    const privateModel = {
      ...basicModel,
      type: 'PrivateMusicArea' as InteractableType,
      isPrivate: this._isPrivate,
    };
    return privateModel;
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
  ): PrivateSpotifyArea {
    const { name, width, height } = mapObject;
    if (!width || !height) {
      throw new Error(`Malformed music area ${name}`);
    }
    const rect: BoundingBox = { x: mapObject.x, y: mapObject.y, width, height };
    return new PrivateSpotifyArea(
      {
        id: name,
        occupants: [],
        topic: '',
        sessionInProgress: false,
        currentSong: null,
        songQueue: [],
        isPlaying: false,
        isPrivate: false,
      },
      rect,
      broadcastEmitter,
    );
  }

  public async handleSpotifyCommand<CommandType extends InteractableCommand>(
    command: CommandType,
  ): Promise<InteractableCommandReturnType<CommandType>> {
    // Open and close the room to other coveytown members
    if (command.type === 'SetRoomPrivacy') {
      console.log('spotify command found room privacy');
      this._isPrivate = !this._isPrivate;
      this._emitAreaChanged();
      return {} as InteractableCommandReturnType<CommandType>;
    }
    return super.handleSpotifyCommand(command);
  }
}
