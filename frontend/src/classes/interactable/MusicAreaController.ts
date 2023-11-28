import { AccordionDescendantsProvider } from '@chakra-ui/react';
import { AccessToken, Track } from '@spotify/web-api-ts-sdk';
import {
  MusicArea,
  MusicArea as MusicAreaModel,
  QueuedTrack,
  Song,
} from '../../types/CoveyTownSocket';
import TownController from '../TownController';
// import { SongQueue } from '../../types/CoveyTownSocket';
import InteractableAreaController, { BaseInteractableEventMap } from './InteractableAreaController';

/**
 * The events that a MusicAreaController can emit
 */
export type MusicAreaEvents = BaseInteractableEventMap & {
  /**
   * A playbackChange event indicates that the playing/paused state has changed.
   * Listeners are passed the new state in the parameter `isPlaying`
   */
  topicChange: (topic: string) => void;
  currentSongChange: (song: Track | null) => void;
  currentQueueChange: (queue: QueuedTrack[]) => void;
  sessionInProgressChange: (sessionInProgress: boolean) => void;
  accessTokenChange: (accessToken: AccessToken) => void;
};

/**
 * A MusicAreaController manages the state for a ViewingArea in the frontend app, serving as a bridge between the video
 * that is playing in the user's browser and the backend TownService, ensuring that all players watching the same video
 * are synchronized in their playback.
 *
 * The MusicAreaController implements callbacks that handle events from the spotify player in this browser window, and
 * emits updates when the state is updated, @see MusicAreaEvents
 */
export default class MusicAreaController extends InteractableAreaController<
  MusicAreaEvents,
  MusicAreaModel
> {
  private _model: MusicAreaModel;

  protected _townController: TownController;

  /**
   * Constructs a new MusicAreaController, initialized with the state of the
   * provided musicAreaModel.
   *
   * @param musicAreaModel The music area model that this controller should represent
   */
  constructor(musicAreaModel: MusicAreaModel, townController: TownController) {
    super(musicAreaModel.id);
    this._model = musicAreaModel;
    this._townController = townController;
    console.log('MusicAreaController constructor');
  }

  get topic(): string {
    if (this._model.topic === undefined) {
      throw new Error('Topic is undefined');
    }
    return this._model.topic;
  }

  /**
   * the topic of the session
   */
  public set topic(topic: string) {
    if (this._model.topic !== topic) {
      this._model.topic = topic;
      this.emit('topicChange', topic);
    }
  }

  get sessionInProgress(): boolean {
    if (this._model.sessionInProgress === undefined) {
      throw new Error('sessionInProgress is undefined');
    }
    return this._model.sessionInProgress;
  }

  public set sessionInProgress(sessionInProgress: boolean) {
    if (this._model.sessionInProgress !== undefined) {
      this._model.sessionInProgress = sessionInProgress;
      this.emit('sessionInProgressChange', sessionInProgress);
    } else {
      throw new Error('session in progress is undefined');
    }
  }

  get currentSong(): Track {
    return this._model.currentSong;
  }

  public set currentSong(currentSong: Track) {
    this._model.currentSong = currentSong;
    this.emit('currentSongChange', currentSong);
  }

  get currentQueue(): QueuedTrack[] {
    return this._model.songQueue;
  }

  public set currentQueue(currentQueue: QueuedTrack[]) {
    this._model.songQueue = currentQueue;
    this.emit('currentQueueChange', currentQueue);
  }

  public isActive(): boolean {
    return this._model.sessionInProgress !== undefined;
  }

  /**
   * @returns MusicAreaModel that represents the current state of this ViewingAreaController
   */
  public toInteractableAreaModel(): MusicAreaModel {
    console.log('inside toInteractableAreaModel');
    return this._model;
  }

  /**
   * Applies updates to this music area controller's model, setting the fields
   *
   *
   * @param updatedModel
   */
  protected _updateFrom(updatedModel: MusicAreaModel): void {
    console.log('inside _updateFrom');
    // Invokes setters, which have emit()
    if (updatedModel.topic) this.topic = updatedModel.topic;
    if (updatedModel.sessionInProgress) this.sessionInProgress = updatedModel.sessionInProgress;
    if (updatedModel.currentSong) this.currentSong = updatedModel.currentSong;
    if (updatedModel.songQueue) this.currentQueue = updatedModel.songQueue;
  }

  /**
   * Tells backend to create a musicSession.
   * @param sessionName name
   */
  public async createSession(sessionName: string) {
    const instanceID = this.id;
    if (!instanceID) {
      throw new Error('instanceID undefined');
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'CreateMusicSession',
      topic: sessionName,
    });
  }

  /**
   * Creates the SpotifyPlayer for this user's access token and device id.
   * @param accessToken a Spotify access token
   * @param deviceId a Spotify device id
   */
  public async addUserToSession(accessToken: AccessToken, deviceId: string) {
    console.log('attempting to send interactableCommand(AddUsertoMusicSession)');
    const instanceID = this.id;
    if (!instanceID) {
      throw new Error('instanceID undefined');
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'AddUserToMusicSession',
      accessToken: accessToken,
      deviceId: deviceId,
    });
  }

  // /**
  //  * Sends a command to the backend to update the state of the music area
  //  * @param payload information to send
  //  */
  // public async sendSpotifyCommand(payload: MusicArea): Promise<MusicArea> {
  //   const instanceID = this.id;
  //   if (!instanceID) {
  //     throw new Error('instanceID undefined');
  //   }
  //   const response = await this._townController.sendInteractableCommand(this.id, {
  //     type: 'MusicAreaCommand',
  //     payload: payload,
  //   });
  //   const musicAreaState = response.payload as MusicArea;
  //   return musicAreaState;
  // }
}
