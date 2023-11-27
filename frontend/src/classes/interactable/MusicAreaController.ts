import { MusicArea, MusicArea as MusicAreaModel, Song } from '../../types/CoveyTownSocket';
import TownController from '../TownController';
// import { SongQueue } from '../../types/CoveyTownSocket';
import InteractableAreaController, { BaseInteractableEventMap } from './InteractableAreaController';

/**
 * The events that a ViewingAreaController can emit
 */
export type MusicAreaEvents = BaseInteractableEventMap & {
  /**
   * A playbackChange event indicates that the playing/paused state has changed.
   * Listeners are passed the new state in the parameter `isPlaying`
   */
  topicChange: (topic: string | undefined) => void;
  /**
   * A videoChange event indicates that the video selected for this viewing area has changed.
   * Listeners are passed the new video, which is either a string (the URL to a video), or
   * the value `undefined` to indicate that there is no video set.
   */
  // songChange: (song: Song | undefined) => void;
  sessionInProgressChange: (sessionInProgress: boolean | undefined) => void;
};

/**
 * A ViewingAreaController manages the state for a ViewingArea in the frontend app, serving as a bridge between the video
 * that is playing in the user's browser and the backend TownService, ensuring that all players watching the same video
 * are synchronized in their playback.
 *
 * The ViewingAreaController implements callbacks that handle events from the video player in this browser window, and
 * emits updates when the state is updated, @see ViewingAreaEvents
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
  public set topic(topic: string | undefined) {
    if (this._model.topic !== topic) {
      this._model.topic = topic;
      this.emit('topicChange', topic);
    }
  }

  get sessionInProgress(): boolean {
    if (this._model.sessionInProgress === undefined) {
      throw new Error('sessionInProgress is undefined');
    }
    return false;
  }

  public set sessionInProgress(sessionInProgress: boolean | undefined) {
    if (this._model.sessionInProgress !== sessionInProgress) {
      this._model.sessionInProgress = sessionInProgress;
      this.emit('sessionInProgressChange', sessionInProgress);
    }
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
   * isPlaying, elapsedTimeSec and video from the updatedModel
   *
   * @param updatedModel
   */
  protected _updateFrom(updatedModel: MusicAreaModel): void {
    console.log('inside _updateFrom');
    this.topic = updatedModel.topic;
    this.sessionInProgress = updatedModel.sessionInProgress;
  }

  /**
   * Sends a command to the backend to update the state of the music area
   * @param payload information to send
   */
  public async sendSpotifyCommand(payload: MusicArea): Promise<MusicArea> {
    const instanceID = this.id;
    if (!instanceID) {
      throw new Error('instanceID undefined');
    }
    const response = await this._townController.sendInteractableCommand(this.id, {
      type: 'MusicAreaCommand',
      payload: payload,
    });
    console.log('response from sendSpotifyCommand ', response);
    const musicAreaState = response.payload as MusicArea;
    return musicAreaState;
  }
}
